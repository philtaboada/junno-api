import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Goal } from './goal.entity';

@Entity({ tableName: 'goal_metric_snapshots' })
export class GoalMetricSnapshot {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Goal, { fieldName: 'goal_id' })
  goal!: Goal;

  @Property({ type: 'double' })
  value!: number;

  @Property({ fieldName: 'recorded_at', onCreate: () => new Date(), type: 'Date' })
  recordedAt?: Date;
}
