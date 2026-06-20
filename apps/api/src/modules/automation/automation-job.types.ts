import type { AutomationTriggerType } from '@pm/contracts';

export type AutomationJobPayload = {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly triggerType: AutomationTriggerType;
  readonly actorUserId: string;
  readonly assigneeUserId?: string | null;
  readonly dueAt?: string | null;
};
