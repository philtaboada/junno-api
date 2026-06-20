import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum ActivityEventType {
  TEAM_MEMBER_JOINED = 'team_member_joined',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMMENT_ADDED = 'task_comment_added',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_CHANGED = 'task_due_changed',
  TASK_ADDED_TO_PROJECT = 'task_added_to_project',
  AUTOMATION_NOTIFICATION = 'automation_notification',
}

@Entity({ tableName: 'activity_events' })
export class ActivityEvent {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, { fieldName: 'recipient_user_id' })
  recipientUser!: User;

  @ManyToOne(() => User, { fieldName: 'actor_user_id', nullable: true })
  actorUser?: User;

  @Enum({ items: () => ActivityEventType })
  type!: ActivityEventType;

  @Property({ type: 'json', default: '{}' })
  payload: Record<string, unknown> = {};

  @Property({ fieldName: 'read_at', nullable: true, type: 'Date' })
  readAt?: Date | null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt = new Date();
}
