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

  private mapFetchResult(response: Response): DeliveryResult {
    if (!response.ok) {
      return {
        status: IntegrationDeliveryStatus.FAILED,
        responseCode: response.status,
        errorMessage: `HTTP ${response.status}`,
      };
    }
    return {
      status: IntegrationDeliveryStatus.SUCCESS,
      responseCode: response.status,
      errorMessage: null,
    };
  }
}
