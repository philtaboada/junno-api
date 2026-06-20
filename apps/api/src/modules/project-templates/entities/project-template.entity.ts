import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity({ tableName: 'project_templates' })
export class ProjectTemplate {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Project, { fieldName: 'source_project_id', nullable: true })
  sourceProject?: Project | null;

  @Property({ type: 'text' })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ fieldName: 'has_tasks', default: false })
  hasTasks = false;

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
