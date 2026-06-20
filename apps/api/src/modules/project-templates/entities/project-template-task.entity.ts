import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectTemplateSection } from './project-template-section.entity';
import { ProjectTemplate } from './project-template.entity';

@Entity({ tableName: 'project_template_tasks' })
export class ProjectTemplateTask {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => ProjectTemplate, { fieldName: 'template_id' })
  template!: ProjectTemplate;

  @ManyToOne(() => ProjectTemplateSection, { fieldName: 'template_section_id' })
  templateSection!: ProjectTemplateSection;

  @Property({ type: 'text' })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ type: 'double' })
  position!: number;
}
