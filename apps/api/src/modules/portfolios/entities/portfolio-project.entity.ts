import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { Project } from '../../projects/entities/project.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Portfolio } from './portfolio.entity';

@Entity({ tableName: 'portfolio_projects' })
@Unique({ properties: ['portfolio', 'project'] })
export class PortfolioProject {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Portfolio, { fieldName: 'portfolio_id' })
  portfolio!: Portfolio;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Property({ type: 'double' })
  position = 0;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
