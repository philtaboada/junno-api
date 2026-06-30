import type {
  CreateIntegrationRequestDto,
  IntegrationDeliveryLogDto,
  IntegrationDetailDto,
  IntegrationSummaryDto,
  SlackOAuthStartResponseDto,
  UpdateIntegrationRequestDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchProjectIntegrations(
  projectId: string,
): Promise<IntegrationSummaryDto[]> {
  return apiRequest<IntegrationSummaryDto[]>(`/projects/${projectId}/integrations`, {
    method: 'GET',
  });
}

export async function createProjectIntegration(
  projectId: string,
  input: CreateIntegrationRequestDto,
): Promise<IntegrationDetailDto> {
  return apiRequest<IntegrationDetailDto>(`/projects/${projectId}/integrations`, {
    method: 'POST',
    body: input,
  });
}

export async function fetchIntegration(integrationId: string): Promise<IntegrationDetailDto> {
  return apiRequest<IntegrationDetailDto>(`/integrations/${integrationId}`, { method: 'GET' });
}

export async function updateIntegration(
  integrationId: string,
  input: UpdateIntegrationRequestDto,
): Promise<IntegrationDetailDto> {
  return apiRequest<IntegrationDetailDto>(`/integrations/${integrationId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteIntegration(integrationId: string): Promise<void> {
  return apiRequest<void>(`/integrations/${integrationId}`, { method: 'DELETE' });
}

export async function fetchIntegrationDeliveryLogs(
  integrationId: string,
  limit = 10,
): Promise<IntegrationDeliveryLogDto[]> {
  return apiRequest<IntegrationDeliveryLogDto[]>(
    `/integrations/${integrationId}/delivery-logs?limit=${limit}`,
    { method: 'GET' },
  );
}

export async function startSlackOAuth(
  integrationId: string,
): Promise<SlackOAuthStartResponseDto> {
  return apiRequest<SlackOAuthStartResponseDto>(
    `/integrations/${integrationId}/slack/oauth/start`,
    { method: 'POST' },
  );
}

export async function completeSlackChannel(
  integrationId: string,
  channelId: string,
  channelName?: string,
): Promise<IntegrationDetailDto> {
  return apiRequest<IntegrationDetailDto>(`/integrations/${integrationId}/slack/complete`, {
    method: 'POST',
    body: { channelId, channelName },
  });
}
