import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CustomFieldDefinition } from '../../projects/entities/custom-field-definition.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectForm } from './project-form.entity';

export enum FormFieldType {
  TASK_NAME = 'task_name',
  TASK_DESCRIPTION = 'task_description',
  DUE_AT = 'due_at',
  CUSTOM_FIELD = 'custom_field',
}

@Entity({ tableName: 'form_fields' })
export class FormField {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => ProjectForm, { fieldName: 'form_id' })
  form!: ProjectForm;

  @Enum({ items: () => FormFieldType })
  type!: FormFieldType;

  @Property({ type: 'string' })
  label!: string;

  @Property({ type: 'boolean' })
  required = false;

  @Property({ type: 'int' })
  position = 0;

  @ManyToOne(() => CustomFieldDefinition, {
    fieldName: 'custom_field_definition_id',
    nullable: true,
  })
  customFieldDefinition: CustomFieldDefinition | null = null;

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
