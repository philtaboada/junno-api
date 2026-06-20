import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { WorkspaceMember } from './workspace-member.entity';

export enum WorkspaceType {
  PERSONAL = 'personal',
  ORGANIZATION = 'organization',
}

@Entity({ tableName: 'workspaces' })
export class Workspace {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Enum({ items: () => WorkspaceType })
  type: WorkspaceType = WorkspaceType.PERSONAL;

  @Property({ fieldName: 'email_domain', nullable: true, type: 'string' })
  emailDomain: string | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members = new Collection<WorkspaceMember>(this);
}
