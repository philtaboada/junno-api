import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { TeamAccessRole } from './team-member.entity';
import { Team } from './team.entity';

@Entity({ tableName: 'team_invitations' })
export class TeamInvitation {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Team, { fieldName: 'team_id' })
  team!: Team;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @Property({ type: 'citext', nullable: true })
  email: string | null = null;

  @Enum({ items: () => TeamAccessRole })
  role: TeamAccessRole = TeamAccessRole.EDITOR;

  @ManyToOne(() => User, { fieldName: 'invited_by_id' })
  invitedBy!: User;

  @Property({ fieldName: 'token_hash', type: 'string' })
  @Unique()
  tokenHash!: string;

  @Property({ fieldName: 'expires_at', type: 'Date' })
  expiresAt!: Date;

  @Property({ fieldName: 'accepted_at', nullable: true, type: 'Date' })
  acceptedAt: Date | null = null;

  @Property({ fieldName: 'revoked_at', nullable: true, type: 'Date' })
  revokedAt: Date | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
