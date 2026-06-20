import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from './workspace.entity';

export enum WorkspaceRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

@Entity({ tableName: 'workspace_members' })
@Unique({ properties: ['workspace', 'user'] })
export class WorkspaceMember {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Enum({ items: () => WorkspaceRole })
  role: WorkspaceRole = WorkspaceRole.MEMBER;

  @Property({ fieldName: 'joined_at', onCreate: () => new Date(), type: 'Date' })
  joinedAt?: Date;
}
