import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Task } from './task.entity';

export enum TaskDependencyType {
  FINISH_TO_START = 'finish_to_start',
}

@Entity({ tableName: 'task_dependencies' })
export class TaskDependency {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Task, { fieldName: 'predecessor_task_id' })
  predecessorTask!: Task;

  @ManyToOne(() => Task, { fieldName: 'successor_task_id' })
  successorTask!: Task;

  @Enum({ items: () => TaskDependencyType })
  type: TaskDependencyType = TaskDependencyType.FINISH_TO_START;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
