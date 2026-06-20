import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { TaskMembership } from './task-membership.entity';

@Entity({ tableName: 'tasks' })
export class Task {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @Property({ type: 'string' })
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description: string | null = null;

  @Property({ nullable: true, type: 'string' })
  priority: 'low' | 'medium' | 'high' | null = null;

  @ManyToOne(() => User, { fieldName: 'assignee_id', nullable: true })
  assignee: User | null = null;

  @Property({ fieldName: 'start_at', nullable: true, type: 'Date' })
  startAt: Date | null = null;

  @Property({ fieldName: 'start_has_time', type: 'boolean' })
  startHasTime = false;

  @Property({ fieldName: 'due_at', nullable: true, type: 'Date' })
  dueAt: Date | null = null;

  @Property({ fieldName: 'due_has_time', type: 'boolean' })
  dueHasTime = false;

  @Property({ fieldName: 'completed_at', nullable: true, type: 'Date' })
  completedAt: Date | null = null;

  @ManyToOne(() => Task, { fieldName: 'parent_task_id', nullable: true })
  parentTask: Task | null = null;

  @ManyToOne(() => User, { fieldName: 'created_by_id' })
  createdBy!: User;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    type: 'Date',
  })
  updatedAt?: Date;

  @OneToMany(() => TaskMembership, (membership) => membership.task)
  memberships = new Collection<TaskMembership>(this);
}
