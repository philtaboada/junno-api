import { Injectable } from '@nestjs/common';
import type { AutomationTriggerType } from '@pm/contracts';
import type { AutomationJobPayload } from './automation-job.types';
import { AutomationQueueService } from './automation-queue.service';

type TaskAutomationEventParams = {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly actorUserId: string;
  readonly assigneeUserId?: string | null;
  readonly dueAt?: string | null;
};

@Injectable()
export class AutomationTriggerService {
  constructor(private readonly automationQueueService: AutomationQueueService) {}

  enqueueTaskCompleted(params: TaskAutomationEventParams): void {
    void this.enqueue('task_completed', params);
  }

  enqueueTaskAssigned(params: TaskAutomationEventParams): void {
    void this.enqueue('task_assigned', params);
  }

  enqueueTaskDueChanged(params: TaskAutomationEventParams): void {
    void this.enqueue('task_due_changed', params);
  }

  private async enqueue(
    triggerType: AutomationTriggerType,
    params: TaskAutomationEventParams,
  ): Promise<void> {
    const payload: AutomationJobPayload = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      projectName: params.projectName,
      taskId: params.taskId,
      taskName: params.taskName,
      triggerType,
      actorUserId: params.actorUserId,
      assigneeUserId: params.assigneeUserId ?? null,
      dueAt: params.dueAt ?? null,
    };
    await this.automationQueueService.enqueue(payload);
  }
}
