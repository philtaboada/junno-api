import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { IntegrationEventType } from '@pm/contracts';
import { IntegrationType } from '../entities/project-integration.entity';

class WebhookIntegrationConfigDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  secret?: string;
}

class SlackIntegrationConfigDto {
  @IsEnum(['incoming_webhook', 'oauth'] as const)
  mode!: 'incoming_webhook' | 'oauth';

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  clientSecret?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  channelName?: string;
}

class WhatsappKapsoIntegrationConfigDto {
  @IsString()
  @MinLength(3)
  phoneNumberId!: string;

  @IsString()
  @MinLength(8)
  recipientE164!: string;
}

class DiscordIntegrationConfigDto {
  @IsEnum(['webhook', 'bot'] as const)
  mode!: 'webhook' | 'bot';

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  botToken?: string;

  @IsOptional()
  @IsString()
  channelId?: string;
}

class GitHubIntegrationConfigDto {
  @IsString()
  @MinLength(1)
  owner!: string;

  @IsString()
  @MinLength(1)
  repo!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  accessToken?: string;
}

export class CreateIntegrationDto {
  @IsEnum(IntegrationType)
  type!: IntegrationType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(['task.created', 'task.updated'] as const, { each: true })
  events!: IntegrationEventType[];

  @IsObject()
  config!: Record<string, unknown>;
}

export class UpdateIntegrationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['task.created', 'task.updated'] as const, { each: true })
  events?: IntegrationEventType[];

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CompleteSlackOAuthDto {
  @IsString()
  channelId!: string;

  @IsOptional()
  @IsString()
  channelName?: string;
}

export class ListGitHubReposDto {
  @IsString()
  @MinLength(10)
  accessToken!: string;
}

export {
  WebhookIntegrationConfigDto,
  SlackIntegrationConfigDto,
  DiscordIntegrationConfigDto,
  GitHubIntegrationConfigDto,
  WhatsappKapsoIntegrationConfigDto,
};
