import { createHmac, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IntegrationEventPayloadDto,
  IntegrationEventType,
} from '@pm/contracts';
import type { IntegrationJobPayload } from './integration-job.types';

@Injectable()
export class IntegrationPayloadService {
  constructor(private readonly configService: ConfigService) {}

  buildEventPayload(payload: IntegrationJobPayload): IntegrationEventPayloadDto {
    const webAppUrl =
      this.configService.get<string>('WEB_APP_URL') ?? 'http://localhost:3001';
    return {
      id: randomUUID(),
      type: payload.eventType,
      occurredAt: payload.occurredAt,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      projectName: payload.projectName,
      taskId: payload.taskId,
      taskName: payload.taskName,
      taskUrl: `${webAppUrl}/projects/${payload.projectId}?taskId=${payload.taskId}`,
      actorUserId: payload.actorUserId,
    };
  }

  buildSlackText(event: IntegrationEventPayloadDto): string {
    const label = event.type === 'task.created' ? 'Nueva tarea' : 'Tarea actualizada';
    return `${label} en *${event.projectName}*: ${event.taskName}\n${event.taskUrl}`;
  }

  buildWhatsappText(event: IntegrationEventPayloadDto): string {
    const label = event.type === 'task.created' ? 'Nueva tarea' : 'Tarea actualizada';
    return `${label} en ${event.projectName}: ${event.taskName}\n${event.taskUrl}`;
  }

  buildDiscordText(event: IntegrationEventPayloadDto): string {
    const label = event.type === 'task.created' ? 'Nueva tarea' : 'Tarea actualizada';
    return `**${label}** en **${event.projectName}**: ${event.taskName}\n${event.taskUrl}`;
  }

  buildGitHubCommentBody(event: IntegrationEventPayloadDto): string {
    const label = event.type === 'task.created' ? 'Nueva tarea' : 'Tarea actualizada';
    return `${label} en **${event.projectName}**: ${event.taskName}\n\n${event.taskUrl}`;
  }

  buildGitHubIssueTitle(event: IntegrationEventPayloadDto): string {
    const prefix = event.type === 'task.created' ? '[Junno] Nueva tarea' : '[Junno] Tarea actualizada';
    return `${prefix}: ${event.taskName}`;
  }

  signWebhookPayload(secret: string, body: string): string {
    const digest = createHmac('sha256', secret).update(body).digest('hex');
    return `sha256=${digest}`;
  }

  isSupportedEvent(eventType: IntegrationEventType): boolean {
    return eventType === 'task.created' || eventType === 'task.updated';
  }
}
