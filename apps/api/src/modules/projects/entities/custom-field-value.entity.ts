import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { Task } from '../../tasks/entities/task.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { CustomFieldDefinition } from './custom-field-definition.entity';

@Entity({ tableName: 'custom_field_values' })
@Unique({ properties: ['task', 'fieldDefinition'] })
export class CustomFieldValue {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Task, { fieldName: 'task_id' })
  task!: Task;

  @ManyToOne(() => CustomFieldDefinition, { fieldName: 'field_definition_id' })
  fieldDefinition!: CustomFieldDefinition;

  @Property({ type: 'json', default: '{}' })
  value: Record<string, unknown> = {};

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
