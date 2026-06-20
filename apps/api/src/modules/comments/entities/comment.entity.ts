import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity({ tableName: 'comments' })
export class Comment {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Task, { fieldName: 'task_id' })
  task!: Task;

  @ManyToOne(() => User, { fieldName: 'author_id' })
  author!: User;

  @Property({ type: 'text' })
  body!: string;

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
