import { Injectable } from '@nestjs/common';
import type { IntegrationEventType } from '@pm/contracts';
import type { IntegrationJobPayload } from './integration-job.types';
import { IntegrationQueueService } from './integration-queue.service';

type TaskIntegrationEventParams = {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly actorUserId: string;
};

@Injectable()
export class IntegrationTriggerService {
  constructor(private readonly integrationQueueService: IntegrationQueueService) {}

  enqueueTaskCreated(params: TaskIntegrationEventParams): void {
    void this.enqueue('task.created', params);
  }

  enqueueTaskUpdated(params: TaskIntegrationEventParams): void {
    void this.enqueue('task.updated', params);
  }

  private async enqueue(
    eventType: IntegrationEventType,
    params: TaskIntegrationEventParams,
  ): Promise<void> {
    const payload: IntegrationJobPayload = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      projectName: params.projectName,
      taskId: params.taskId,
      taskName: params.taskName,
      actorUserId: params.actorUserId,
      eventType,
      occurredAt: new Date().toISOString(),
    };
    await this.integrationQueueService.enqueue(payload);
  }
}
