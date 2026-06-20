import { Collection } from '@mikro-orm/core';
import {
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { RefreshToken } from './refresh-token.entity';
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'citext' })
  @Unique()
  email!: string;

  @Property({ fieldName: 'password_hash', hidden: true, type: 'string' })
  passwordHash!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ fieldName: 'email_verified_at', nullable: true, type: 'Date' })
  emailVerifiedAt: Date | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date(), type: 'Date' })
  updatedAt?: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  memberships = new Collection<WorkspaceMember>(this);

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens = new Collection<RefreshToken>(this);
}
