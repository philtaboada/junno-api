export type InboxEventType =
  | 'team_member_joined'
  | 'task_assigned'
  | 'task_comment_added'
  | 'task_completed'
  | 'task_due_changed'
  | 'task_added_to_project'
  | 'automation_notification';

export interface InboxEventDto {
  readonly id: string;
  readonly type: InboxEventType;
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly actorName: string | null;
  readonly payload: Record<string, unknown>;
}

export interface MarkAllInboxEventsReadResponseDto {
  readonly success: true;
  readonly updatedCount: number;
}

export interface InboxUnreadCountDto {
  readonly count: number;
}
