import { Injectable } from '@nestjs/common';
import { ActivityEventsService } from './activity-events.service';
import { ActivityEventType } from './entities/activity-event.entity';

type TaskInboxPayload = {
  readonly taskId: string;
  readonly taskName: string;
  readonly projectId?: string;
  readonly projectName?: string;
  readonly commentId?: string;
  readonly commentPreview?: string;
};

@Injectable()
export class TaskInboxEventsService {
  constructor(private readonly activityEventsService: ActivityEventsService) {}

  async notifyTaskAssigned(params: {
    workspaceId: string;
    actorUserId: string;
    assigneeUserId: string | null;
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
  }): Promise<void> {
    if (!params.assigneeUserId || params.assigneeUserId === params.actorUserId) {
      return;
    }
    await this.createTaskEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.assigneeUserId,
      actorUserId: params.actorUserId,
      type: ActivityEventType.TASK_ASSIGNED,
      payload: {
        taskId: params.taskId,
        taskName: params.taskName,
        projectId: params.projectId,
        projectName: params.projectName,
      },
    });
  }

  async notifyTaskCommentAdded(params: {
    workspaceId: string;
    actorUserId: string;
    assigneeUserId: string | null;
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
    commentId: string;
    commentPreview: string;
  }): Promise<void> {
    if (!params.assigneeUserId || params.assigneeUserId === params.actorUserId) {
      return;
    }
    await this.createTaskEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.assigneeUserId,
      actorUserId: params.actorUserId,
      type: ActivityEventType.TASK_COMMENT_ADDED,
      payload: {
        taskId: params.taskId,
        taskName: params.taskName,
        projectId: params.projectId,
        projectName: params.projectName,
        commentId: params.commentId,
        commentPreview: params.commentPreview,
      },
    });
  }

  async notifyTaskCompleted(params: {
    workspaceId: string;
    actorUserId: string;
    assigneeUserId: string | null;
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
  }): Promise<void> {
    if (!params.assigneeUserId || params.assigneeUserId === params.actorUserId) {
      return;
    }
    await this.createTaskEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.assigneeUserId,
      actorUserId: params.actorUserId,
      type: ActivityEventType.TASK_COMPLETED,
      payload: {
        taskId: params.taskId,
        taskName: params.taskName,
        projectId: params.projectId,
        projectName: params.projectName,
      },
    });
  }

  async notifyTaskDueChanged(params: {
    workspaceId: string;
    actorUserId: string;
    assigneeUserId: string | null;
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
    dueAt: string | null;
  }): Promise<void> {
    if (!params.assigneeUserId || params.assigneeUserId === params.actorUserId) {
      return;
    }
    await this.createTaskEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.assigneeUserId,
      actorUserId: params.actorUserId,
      type: ActivityEventType.TASK_DUE_CHANGED,
      payload: {
        taskId: params.taskId,
        taskName: params.taskName,
        projectId: params.projectId,
        projectName: params.projectName,
        dueAt: params.dueAt,
      },
    });
  }

  async notifyTaskAddedToProject(params: {
    workspaceId: string;
    actorUserId: string;
    assigneeUserId: string | null;
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
  }): Promise<void> {
    if (!params.assigneeUserId || params.assigneeUserId === params.actorUserId) {
      return;
    }
    await this.createTaskEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.assigneeUserId,
      actorUserId: params.actorUserId,
      type: ActivityEventType.TASK_ADDED_TO_PROJECT,
      payload: {
        taskId: params.taskId,
        taskName: params.taskName,
        projectId: params.projectId,
        projectName: params.projectName,
      },
    });
  }

  private async createTaskEvent(params: {
    workspaceId: string;
    recipientUserId: string;
    actorUserId: string;
    type: ActivityEventType;
    payload: TaskInboxPayload & Record<string, unknown>;
  }): Promise<void> {
    await this.activityEventsService.createEvent({
      workspaceId: params.workspaceId,
      recipientUserId: params.recipientUserId,
      actorUserId: params.actorUserId,
      type: params.type,
      payload: params.payload,
    });
  }
}
