export type IntegrationType =
  | 'webhook'
  | 'slack'
  | 'discord'
  | 'github'
  | 'whatsapp_kapso';

export type IntegrationEventType = 'task.created' | 'task.updated';

export interface WebhookIntegrationConfigDto {
  readonly url: string;
  readonly secret?: string;
}

export interface SlackIntegrationConfigDto {
  readonly mode: 'incoming_webhook' | 'oauth';
  readonly webhookUrl?: string;
  /** Slack App Client ID — BYOC, guardado en DB por integración */
  readonly clientId?: string;
  /** Slack App Client Secret — enmascarado en respuestas API */
  readonly clientSecret?: string;
  readonly channelId?: string;
  readonly channelName?: string;
  readonly teamName?: string;
}

export interface DiscordIntegrationConfigDto {
  readonly mode: 'webhook' | 'bot';
  /** Channel webhook URL (Integrations → Webhooks en Discord) */
  readonly webhookUrl?: string;
  readonly botToken?: string;
  /** Snowflake del canal */
  readonly channelId?: string;
}

export interface GitHubIntegrationConfigDto {
  readonly owner: string;
  readonly repo: string;
  /** PAT classic (repo) o fine-grained con Issues — pegado en DB, sin OAuth */
  readonly accessToken?: string;
}

export interface WhatsappKapsoIntegrationConfigDto {
  readonly phoneNumberId: string;
  readonly recipientE164: string;
}

export type IntegrationConfigDto =
  | WebhookIntegrationConfigDto
  | SlackIntegrationConfigDto
  | DiscordIntegrationConfigDto
  | GitHubIntegrationConfigDto
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
  /** Redirect URI fija de la plataforma — registrar en la Slack App del usuario */
  readonly redirectUri: string;
}

/** URLs OAuth de plataforma (no secretos) para configurar apps externas */
export interface IntegrationOAuthSetupDto {
  readonly slackRedirectUri: string;
}

export interface GitHubRepoOptionDto {
  readonly owner: string;
  readonly name: string;
  readonly fullName: string;
  readonly isPrivate: boolean;
}

export interface ListGitHubReposResponseDto {
  readonly repos: GitHubRepoOptionDto[];
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
