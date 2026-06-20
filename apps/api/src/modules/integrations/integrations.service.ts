import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  IntegrationDeliveryLogDto,
  IntegrationDetailDto,
  IntegrationEventType,
  IntegrationSummaryDto,
  SlackOAuthStartResponseDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
} from './dto/integration.dto';
import { IntegrationDeliveryLog } from './entities/integration-delivery-log.entity';
import {
  IntegrationType,
  ProjectIntegration,
} from './entities/project-integration.entity';
import { SlackOAuthService } from './slack-oauth.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly slackOAuthService: SlackOAuthService,
  ) {}

  async listForProject(
    workspaceId: string,
    projectId: string,
  ): Promise<IntegrationSummaryDto[]> {
    await this.findProjectInWorkspace(workspaceId, projectId);
    const integrations = await this.entityManager.find(
      ProjectIntegration,
      { workspace: workspaceId, project: projectId },
      { orderBy: { createdAt: 'DESC' } },
    );
    return integrations.map((integration) => this.buildSummary(integration));
  }

  async createForProject(
    context: WorkspaceContext,
    projectId: string,
    createIntegrationDto: CreateIntegrationDto,
  ): Promise<IntegrationDetailDto> {
    await this.assertProjectEditor(context.workspace.id, projectId, context.user.id);
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    this.validateConfig(createIntegrationDto.type, createIntegrationDto.config);
    const integration = this.entityManager.create(ProjectIntegration, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      project: this.entityManager.getReference(Project, project.id),
      type: createIntegrationDto.type,
      name: createIntegrationDto.name.trim(),
      events: [...createIntegrationDto.events],
      config: this.normalizeConfig(createIntegrationDto.type, createIntegrationDto.config),
      isActive: true,
      createdBy: this.entityManager.getReference(User, context.user.id),
    });
    await this.entityManager.persist(integration);
    await this.entityManager.flush();
    return this.buildDetail(integration);
  }

  async getForWorkspace(
    workspaceId: string,
    integrationId: string,
  ): Promise<IntegrationDetailDto> {
    const integration = await this.findIntegrationInWorkspace(workspaceId, integrationId);
    return this.buildDetail(integration);
  }

  async updateIntegration(
    context: WorkspaceContext,
    integrationId: string,
    updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<IntegrationDetailDto> {
    const integration = await this.findIntegrationInWorkspace(
      context.workspace.id,
      integrationId,
    );
    await this.assertProjectEditor(
      context.workspace.id,
      integration.project.id,
      context.user.id,
    );
    if (updateIntegrationDto.name !== undefined) {
      integration.name = updateIntegrationDto.name.trim();
    }
    if (updateIntegrationDto.events !== undefined) {
      integration.events = [...updateIntegrationDto.events];
    }
    if (updateIntegrationDto.config !== undefined) {
      this.validateConfig(integration.type, updateIntegrationDto.config);
      integration.config = this.mergeConfig(
        integration.type,
        integration.config,
        updateIntegrationDto.config,
      );
    }
    if (updateIntegrationDto.isActive !== undefined) {
      integration.isActive = updateIntegrationDto.isActive;
    }
    await this.entityManager.flush();
    return this.buildDetail(integration);
  }

  async removeIntegration(context: WorkspaceContext, integrationId: string): Promise<void> {
    const integration = await this.findIntegrationInWorkspace(
      context.workspace.id,
      integrationId,
    );
    await this.assertProjectEditor(
      context.workspace.id,
      integration.project.id,
      context.user.id,
    );
    this.entityManager.remove(integration);
    await this.entityManager.flush();
  }

  async startSlackOAuth(
    context: WorkspaceContext,
    integrationId: string,
  ): Promise<SlackOAuthStartResponseDto> {
    const integration = await this.findIntegrationInWorkspace(
      context.workspace.id,
      integrationId,
    );
    await this.assertProjectEditor(
      context.workspace.id,
      integration.project.id,
      context.user.id,
    );
    if (integration.type !== IntegrationType.SLACK) {
      throw new BadRequestException('La integración no es de Slack');
    }
    if (integration.config.mode !== 'oauth') {
      throw new BadRequestException('La integración Slack no usa OAuth');
    }
    return {
      authorizeUrl: this.slackOAuthService.buildAuthorizeUrl(
        integration.id,
        context.workspace.id,
      ),
    };
  }

  async completeSlackOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ readonly integrationId: string; readonly teamName: string }> {
    const statePayload = this.slackOAuthService.parseState(state);
    const integration = await this.findIntegrationInWorkspace(
      statePayload.workspaceId,
      statePayload.integrationId,
    );
    if (integration.type !== IntegrationType.SLACK) {
      throw new BadRequestException('Integración inválida');
    }
    const token = await this.slackOAuthService.exchangeCodeForToken(code);
    integration.config = {
      ...integration.config,
      mode: 'oauth',
      botToken: token.botToken,
      teamId: token.teamId,
      teamName: token.teamName,
    };
    await this.entityManager.flush();
    return { integrationId: integration.id, teamName: token.teamName };
  }

  async completeSlackChannel(
    context: WorkspaceContext,
    integrationId: string,
    channelId: string,
    channelName?: string,
  ): Promise<IntegrationDetailDto> {
    const integration = await this.findIntegrationInWorkspace(
      context.workspace.id,
      integrationId,
    );
    await this.assertProjectEditor(
      context.workspace.id,
      integration.project.id,
      context.user.id,
    );
    if (integration.type !== IntegrationType.SLACK || integration.config.mode !== 'oauth') {
      throw new BadRequestException('Integración Slack OAuth requerida');
    }
    if (typeof integration.config.botToken !== 'string') {
      throw new BadRequestException('Conecta Slack antes de elegir canal');
    }
    integration.config = {
      ...integration.config,
      channelId,
      channelName: channelName ?? integration.config.channelName,
    };
    await this.entityManager.flush();
    return this.buildDetail(integration);
  }

  async listDeliveryLogs(
    workspaceId: string,
    integrationId: string,
    limit = 20,
  ): Promise<IntegrationDeliveryLogDto[]> {
    await this.findIntegrationInWorkspace(workspaceId, integrationId);
    const logs = await this.entityManager.find(
      IntegrationDeliveryLog,
      { integration: integrationId, workspace: workspaceId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
    return logs.map((log) => ({
      id: log.id,
      integrationId,
      eventType: log.eventType as IntegrationEventType,
      status: log.status,
      responseCode: log.responseCode,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }

  async logKapsoInboundWebhook(payload: unknown): Promise<void> {
    this.logger.log(`Kapso inbound webhook: ${JSON.stringify(payload)}`);
  }

  private validateConfig(type: IntegrationType, config: Record<string, unknown>): void {
    switch (type) {
      case IntegrationType.WEBHOOK: {
        if (typeof config.url !== 'string' || config.url.trim().length === 0) {
          throw new BadRequestException('URL de webhook requerida');
        }
        return;
      }
      case IntegrationType.SLACK: {
        const mode = config.mode === 'oauth' ? 'oauth' : 'incoming_webhook';
        if (mode === 'incoming_webhook') {
          if (typeof config.webhookUrl !== 'string' || config.webhookUrl.trim().length === 0) {
            throw new BadRequestException('Webhook URL de Slack requerida');
          }
        }
        return;
      }
      case IntegrationType.WHATSAPP_KAPSO: {
        if (typeof config.phoneNumberId !== 'string' || config.phoneNumberId.trim().length === 0) {
          throw new BadRequestException('phoneNumberId requerido');
        }
        if (typeof config.recipientE164 !== 'string' || config.recipientE164.trim().length === 0) {
          throw new BadRequestException('recipientE164 requerido (ej. +54911...)');
        }
        return;
      }
      default:
        throw new BadRequestException('Tipo de integración no soportado');
    }
  }

  private normalizeConfig(
    type: IntegrationType,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    if (type === IntegrationType.SLACK) {
      return {
        ...config,
        mode: config.mode === 'oauth' ? 'oauth' : 'incoming_webhook',
      };
    }
    return { ...config };
  }

  private mergeConfig(
    type: IntegrationType,
    current: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged = { ...current, ...patch };
    this.validateConfig(type, merged);
    return this.normalizeConfig(type, merged);
  }

  private buildSummary(integration: ProjectIntegration): IntegrationSummaryDto {
    return {
      id: integration.id,
      projectId: integration.project.id,
      type: integration.type,
      name: integration.name,
      events: integration.events as IntegrationEventType[],
      isActive: integration.isActive,
      createdAt: integration.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private buildDetail(integration: ProjectIntegration): IntegrationDetailDto {
    return {
      ...this.buildSummary(integration),
      config: this.sanitizeConfig(integration.type, integration.config),
    };
  }

  private sanitizeConfig(
    type: IntegrationType,
    config: Record<string, unknown>,
  ): IntegrationDetailDto['config'] {
    switch (type) {
      case IntegrationType.WEBHOOK:
        return {
          url: String(config.url ?? ''),
          ...(typeof config.secret === 'string' && config.secret.length > 0
            ? { secret: '••••••••' }
            : {}),
        };
      case IntegrationType.SLACK: {
        const mode = config.mode === 'oauth' ? 'oauth' : 'incoming_webhook';
        if (mode === 'incoming_webhook') {
          return {
            mode,
            webhookUrl: typeof config.webhookUrl === 'string' ? config.webhookUrl : undefined,
          };
        }
        return {
          mode,
          channelId: typeof config.channelId === 'string' ? config.channelId : undefined,
          channelName: typeof config.channelName === 'string' ? config.channelName : undefined,
          teamName: typeof config.teamName === 'string' ? config.teamName : undefined,
        };
      }
      case IntegrationType.WHATSAPP_KAPSO:
        return {
          phoneNumberId: String(config.phoneNumberId ?? ''),
          recipientE164: String(config.recipientE164 ?? ''),
        };
      default:
        return {} as IntegrationDetailDto['config'];
    }
  }

  private async findProjectInWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.entityManager.findOne(Project, {
      id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async findIntegrationInWorkspace(
    workspaceId: string,
    integrationId: string,
  ): Promise<ProjectIntegration> {
    const integration = await this.entityManager.findOne(
      ProjectIntegration,
      { id: integrationId, workspace: workspaceId },
      { populate: ['project'] },
    );
    if (!integration) {
      throw new NotFoundException('Integración no encontrada');
    }
    return integration;
  }

  private async assertProjectEditor(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    void workspaceId;
    const membership = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    if (
      membership.role !== ProjectAccessRole.ADMIN &&
      membership.role !== ProjectAccessRole.EDITOR
    ) {
      throw new ForbiddenException('Se requiere rol editor o admin');
    }
  }
}
