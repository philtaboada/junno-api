import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CustomFieldDefinition } from './custom-field-definition.entity';
import { Project } from './project.entity';

@Entity({ tableName: 'project_list_columns' })
export class ProjectListColumn {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Property({ fieldName: 'field_key', nullable: true, type: 'string' })
  fieldKey: string | null = null;

  @ManyToOne(() => CustomFieldDefinition, {
    fieldName: 'custom_field_id',
    nullable: true,
  })
  customField: CustomFieldDefinition | null = null;

  @Property({ type: 'int' })
  position!: number;

  @Property({ type: 'boolean', default: true })
  visible: boolean = true;

  @Property({ nullable: true, type: 'int' })
  width: number | null = null;

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
