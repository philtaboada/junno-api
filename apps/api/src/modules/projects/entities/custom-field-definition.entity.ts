import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Project } from './project.entity';

@Entity({ tableName: 'custom_field_definitions' })
export class CustomFieldDefinition {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  type!: string;

  @Property({ type: 'json', default: '{}' })
  settings: Record<string, unknown> = {};

  @Property({ type: 'int' })
  position!: number;

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
