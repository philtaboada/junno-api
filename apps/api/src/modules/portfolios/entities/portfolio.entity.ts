import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { ProjectColor } from '../../projects/entities/project.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Goal } from './goal.entity';
import { PortfolioProject } from './portfolio-project.entity';

@Entity({ tableName: 'portfolios' })
export class Portfolio {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @Property({ type: 'string' })
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description: string | null = null;

  @Enum({ items: () => ProjectColor, nullable: true })
  color: ProjectColor | null = null;

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

  @OneToMany(() => PortfolioProject, (portfolioProject) => portfolioProject.portfolio)
  projects = new Collection<PortfolioProject>(this);

  @OneToMany(() => Goal, (goal) => goal.portfolio)
  goals = new Collection<Goal>(this);
}
