import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { CustomFieldDefinition } from '../../projects/entities/custom-field-definition.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity({ tableName: 'my_tasks_list_columns' })
export class MyTasksListColumn {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

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
