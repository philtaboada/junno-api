import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum AutomationTriggerType {
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE_CHANGED = 'task_due_changed',
}

export enum AutomationActionType {
  ASSIGN_USER = 'assign_user',
  MOVE_TO_SECTION = 'move_to_section',
  ADD_COMMENT = 'add_comment',
  SEND_INBOX_NOTIFICATION = 'send_inbox_notification',
}

@Entity({ tableName: 'automation_rules' })
export class AutomationRule {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Property({ type: 'text' })
  name!: string;

  @Property({ default: true })
  enabled = true;

  @Enum({ items: () => AutomationTriggerType, fieldName: 'trigger_type' })
  triggerType!: AutomationTriggerType;

  @Property({ type: 'json', fieldName: 'trigger_config', default: '{}' })
  triggerConfig: Record<string, unknown> = {};

  @Enum({ items: () => AutomationActionType, fieldName: 'action_type' })
  actionType!: AutomationActionType;

  @Property({ type: 'json', fieldName: 'action_config', default: '{}' })
  actionConfig: Record<string, unknown> = {};

  @ManyToOne(() => User, { fieldName: 'created_by_id' })
  createdBy!: User;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt = new Date();

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    type: 'Date',
  })
  updatedAt = new Date();
}
