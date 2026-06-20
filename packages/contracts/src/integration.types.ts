export type IntegrationType = 'webhook' | 'slack' | 'whatsapp_kapso';

export type IntegrationEventType = 'task.created' | 'task.updated';

export interface WebhookIntegrationConfigDto {
  readonly url: string;
  readonly secret?: string;
}

export interface SlackIntegrationConfigDto {
  readonly mode: 'incoming_webhook' | 'oauth';
  readonly webhookUrl?: string;
  readonly channelId?: string;
  readonly channelName?: string;
  readonly teamName?: string;
}

export interface WhatsappKapsoIntegrationConfigDto {
  readonly phoneNumberId: string;
  readonly recipientE164: string;
}

export type IntegrationConfigDto =
  | WebhookIntegrationConfigDto
  | SlackIntegrationConfigDto
  | WhatsappKapsoIntegrationConfigDto;

export interface IntegrationSummaryDto {
  readonly id: string;
  readonly projectId: string;
  readonly type: IntegrationType;
  readonly name: string;
  readonly events: IntegrationEventType[];
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IntegrationDetailDto extends IntegrationSummaryDto {
  readonly config: IntegrationConfigDto;
}

export interface CreateIntegrationRequestDto {
  readonly type: IntegrationType;
  readonly name: string;
  readonly events: IntegrationEventType[];
  readonly config: IntegrationConfigDto;
}

export interface UpdateIntegrationRequestDto {
  readonly name?: string;
  readonly events?: IntegrationEventType[];
  readonly config?: IntegrationConfigDto;
  readonly isActive?: boolean;
}

export interface SlackOAuthStartResponseDto {
  readonly authorizeUrl: string;
}

export interface IntegrationDeliveryLogDto {
  readonly id: string;
  readonly integrationId: string;
  readonly eventType: IntegrationEventType;
  readonly status: 'success' | 'failed';
  readonly responseCode: number | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

export interface IntegrationEventPayloadDto {
  readonly id: string;
  readonly type: IntegrationEventType;
  readonly occurredAt: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly taskUrl: string;
  readonly actorUserId: string;
}
