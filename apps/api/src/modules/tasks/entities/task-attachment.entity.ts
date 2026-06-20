import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Task } from './task.entity';

@Entity({ tableName: 'task_attachments' })
export class TaskAttachment {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Task, { fieldName: 'task_id' })
  task!: Task;

  @ManyToOne(() => User, { fieldName: 'uploaded_by_id' })
  uploadedBy!: User;

  @Property({ fieldName: 'file_name', type: 'string' })
  fileName!: string;

  @Property({ fieldName: 'mime_type', type: 'string' })
  mimeType!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: bigint;

  @Property({ fieldName: 'storage_key', type: 'string' })
  storageKey!: string;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
