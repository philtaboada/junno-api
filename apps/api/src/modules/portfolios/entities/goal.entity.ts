import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Portfolio } from './portfolio.entity';

export enum GoalMetricType {
  TASKS_COMPLETION_PERCENT = 'tasks_completion_percent',
  CUSTOM_FIELD_ROLLUP = 'custom_field_rollup',
}

@Entity({ tableName: 'goals' })
export class Goal {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Portfolio, { fieldName: 'portfolio_id' })
  portfolio!: Portfolio;

  @Property({ type: 'string' })
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description: string | null = null;

  @Enum({ items: () => GoalMetricType, fieldName: 'metric_type' })
  metricType!: GoalMetricType;

  @Property({ fieldName: 'metric_config', type: 'json', default: '{}' })
  metricConfig: Record<string, unknown> = {};

  @Property({ fieldName: 'target_value', nullable: true, type: 'double' })
  targetValue: number | null = null;

  @Property({ fieldName: 'due_at', nullable: true, type: 'Date' })
  dueAt: Date | null = null;

  @ManyToOne(() => User, { fieldName: 'created_by_id' })
  createdBy!: User;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    type: 'Date',
  })
  updatedAt?: Date;
}
