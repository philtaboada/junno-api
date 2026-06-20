import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectTemplate } from './project-template.entity';

@Entity({ tableName: 'project_template_sections' })
export class ProjectTemplateSection {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => ProjectTemplate, { fieldName: 'template_id' })
  template!: ProjectTemplate;

  @Property({ type: 'text' })
  name!: string;

  @Property({ type: 'double' })
  position!: number;
}
