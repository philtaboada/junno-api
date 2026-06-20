import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Project } from '../../projects/entities/project.entity';
import { Section } from '../../projects/entities/section.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Task } from './task.entity';

@Entity({ tableName: 'task_memberships' })
export class TaskMembership {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Task, { fieldName: 'task_id' })
  task!: Task;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @ManyToOne(() => Section, { fieldName: 'section_id', nullable: true })
  section: Section | null = null;

  @Property({ type: 'double' })
  position!: number;
}
