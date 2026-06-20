import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { DashboardWidget } from './dashboard-widget.entity';

@Entity({ tableName: 'dashboards' })
export class Dashboard {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Team, { fieldName: 'team_id', nullable: true })
  team: Team | null = null;

  @Property({ type: 'string' })
  name = 'Dashboard';

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

  @OneToMany(() => DashboardWidget, (widget) => widget.dashboard)
  widgets = new Collection<DashboardWidget>(this);
}
