import type { IntegrationEventType } from '@pm/contracts';

export const INTEGRATIONS_QUEUE_NAME = 'integrations';

export type IntegrationJobPayload = {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly actorUserId: string;
  readonly eventType: IntegrationEventType;
  readonly occurredAt: string;
};
