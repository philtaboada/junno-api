import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Task } from '../../tasks/entities/task.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { AutomationRule } from './automation-rule.entity';

export enum AutomationRunStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity({ tableName: 'automation_runs' })
export class AutomationRun {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => AutomationRule, { fieldName: 'rule_id' })
  rule!: AutomationRule;

  @ManyToOne(() => Task, { fieldName: 'task_id', nullable: true })
  task?: Task | null;

  @Enum({ items: () => AutomationRunStatus })
  status!: AutomationRunStatus;

  @Property({ type: 'json', fieldName: 'trigger_payload', default: '{}' })
  triggerPayload: Record<string, unknown> = {};

  @Property({ fieldName: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt = new Date();

  @Property({ fieldName: 'completed_at', nullable: true, type: 'Date' })
  completedAt?: Date | null;
}
