import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Dashboard } from './dashboard.entity';

export enum DashboardWidgetType {
  TASKS_BY_ASSIGNEE = 'tasks_by_assignee',
  OVERDUE_COUNT = 'overdue_count',
  CUSTOM_FIELD_BREAKDOWN = 'custom_field_breakdown',
}

@Entity({ tableName: 'dashboard_widgets' })
export class DashboardWidget {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Dashboard, { fieldName: 'dashboard_id' })
  dashboard!: Dashboard;

  @Enum({ items: () => DashboardWidgetType })
  type!: DashboardWidgetType;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'json', default: '{}' })
  config: Record<string, unknown> = {};

  @Property({ type: 'int' })
  position = 0;

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
