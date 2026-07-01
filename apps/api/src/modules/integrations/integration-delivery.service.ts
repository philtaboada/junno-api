import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import type { IntegrationEventPayloadDto } from '@pm/contracts';
import {
  IntegrationDeliveryLog,
  IntegrationDeliveryStatus,
} from './entities/integration-delivery-log.entity';
import {
  IntegrationType,
  ProjectIntegration,
} from './entities/project-integration.entity';
import { IntegrationPayloadService } from './integration-payload.service';
import { Workspace } from '../workspaces/entities/workspace.entity';

type DeliveryResult = {
  readonly status: IntegrationDeliveryStatus;
  readonly responseCode: number | null;
  readonly errorMessage: string | null;
};

@Injectable()
export class IntegrationDeliveryService {
  private readonly logger = new Logger(IntegrationDeliveryService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly integrationPayloadService: IntegrationPayloadService,
  ) {}

  async deliverIntegration(
    integration: ProjectIntegration,
    event: IntegrationEventPayloadDto,
  ): Promise<void> {
    const em = this.entityManager.fork();
    const result = await this.executeDelivery(integration, event);
    const log = em.create(IntegrationDeliveryLog, {
      workspace: em.getReference(Workspace, event.workspaceId),
      integration: em.getReference(ProjectIntegration, integration.id),
      eventType: event.type,
      status: result.status,
      responseCode: result.responseCode,
      errorMessage: result.errorMessage,
    });
    await em.persist(log);
    await em.flush();
  }

  private async executeDelivery(
    integration: ProjectIntegration,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    try {
      switch (integration.type) {
        case IntegrationType.WEBHOOK:
          return await this.deliverWebhook(integration.config, event);
        case IntegrationType.SLACK:
          return await this.deliverSlack(integration.config, event);
        case IntegrationType.DISCORD:
          return await this.deliverDiscord(integration.config, event);
        case IntegrationType.GITHUB:
          return await this.deliverGitHub(integration.config, event);
        case IntegrationType.WHATSAPP_KAPSO:
          return await this.deliverWhatsappKapso(integration.config, event);
        default:
          return {
            status: IntegrationDeliveryStatus.FAILED,
            responseCode: null,
            errorMessage: 'Tipo de integración no soportado',
          };
      }
    } catch (error) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  private async deliverWebhook(
    config: Record<string, unknown>,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    const url = typeof config.url === 'string' ? config.url : null;
    if (!url) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'URL de webhook no configurada',
      };
    }
    const body = JSON.stringify(event);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Junno-Event': event.type,
    };
    const secret = typeof config.secret === 'string' ? config.secret : null;
    if (secret) {
      headers['X-Junno-Signature'] =
        this.integrationPayloadService.signWebhookPayload(secret, body);
    }
    const response = await fetch(url, { method: 'POST', headers, body });
    if (!response.ok) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: `Webhook respondió ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }

  private async deliverSlack(
    config: Record<string, unknown>,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    const mode = config.mode === 'oauth' ? 'oauth' : 'incoming_webhook';
    const text = this.integrationPayloadService.buildSlackText(event);
    if (mode === 'incoming_webhook') {
      const webhookUrl = typeof config.webhookUrl === 'string' ? config.webhookUrl : null;
      if (!webhookUrl) {
        return {
          status: IntegrationDeliveryStatus.FAILED,
          responseCode: null,
          errorMessage: 'Webhook URL de Slack no configurada',
        };
      }
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return this.mapFetchResult(response);
    }
    const botToken = typeof config.botToken === 'string' ? config.botToken : null;
    const channelId = typeof config.channelId === 'string' ? config.channelId : null;
    if (!botToken || !channelId) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'Slack OAuth incompleto (token o canal)',
      };
    }
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({ channel: channelId, text, unfurl_links: false }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: payload.error ?? `Slack respondió ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }

  private async deliverDiscord(
    config: Record<string, unknown>,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    const mode = config.mode === 'bot' ? 'bot' : 'webhook';
    const content = this.integrationPayloadService.buildDiscordText(event);
    if (mode === 'webhook') {
      const webhookUrl = typeof config.webhookUrl === 'string' ? config.webhookUrl : null;
      if (!webhookUrl) {
        return {
          status: IntegrationDeliveryStatus.FAILED,
          responseCode: null,
          errorMessage: 'Webhook URL de Discord no configurada',
        };
      }
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return this.mapFetchResult(response, true);
    }
    const botToken = typeof config.botToken === 'string' ? config.botToken : null;
    const channelId = typeof config.channelId === 'string' ? config.channelId : null;
    if (!botToken || !channelId) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'Discord bot incompleto (token o canal)',
      };
    }
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'Junno-Integrations (https://junno.online)',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn(`Discord bot delivery failed: ${response.status} ${errorText}`);
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: `Discord respondió ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }

  private async deliverGitHub(
    config: Record<string, unknown>,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    if (event.type !== 'task.created') {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'GitHub solo crea issues en task.created',
      };
    }
    const owner = typeof config.owner === 'string' ? config.owner.trim() : '';
    const repo = typeof config.repo === 'string' ? config.repo.trim() : '';
    const accessToken = typeof config.accessToken === 'string' ? config.accessToken : null;
    if (!owner || !repo || !accessToken) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'Config GitHub incompleta (owner, repo o token)',
      };
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'Junno-Integrations',
    };
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: this.integrationPayloadService.buildGitHubIssueTitle(event),
        body: this.integrationPayloadService.buildGitHubCommentBody(event),
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn(`GitHub create issue failed: ${response.status} ${errorText}`);
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: `GitHub respondió ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }

  private async deliverWhatsappKapso(
    config: Record<string, unknown>,
    event: IntegrationEventPayloadDto,
  ): Promise<DeliveryResult> {
    const apiKey = this.configService.get<string>('KAPSO_API_KEY');
    if (!apiKey) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'KAPSO_API_KEY no configurada',
      };
    }
    const phoneNumberId =
      typeof config.phoneNumberId === 'string' ? config.phoneNumberId : null;
    const recipientE164 =
      typeof config.recipientE164 === 'string' ? config.recipientE164 : null;
    if (!phoneNumberId || !recipientE164) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: null,
        errorMessage: 'Config Kapso incompleta',
      };
    }
    const baseUrl =
      this.configService.get<string>('KAPSO_API_BASE_URL') ?? 'https://api.kapso.ai';
    const graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v24.0';
    const to = recipientE164.replace(/^\+/, '');
    const body = this.integrationPayloadService.buildWhatsappText(event);
    const response = await fetch(
      `${baseUrl}/meta/whatsapp/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn(`Kapso delivery failed: ${response.status} ${errorText}`);
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: `Kapso respondió ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }

  private mapFetchResult(response: Response, allowNoContent = false): DeliveryResult {
    if (response.ok || (allowNoContent && response.status === 204)) {
      return {
        status: IntegrationDeliveryStatus.SUCCESS,
        responseCode: response.status,
        errorMessage: null,
      };
    }
    return {
      status: IntegrationDeliveryStatus.FAILED,
      responseCode: response.status,
      errorMessage: `HTTP ${response.status}`,
    };
  }
}
