import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Team } from './team.entity';

export enum TeamAccessRole {
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

@Entity({ tableName: 'team_members' })
@Unique({ properties: ['team', 'user'] })
export class TeamMember {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Team, { fieldName: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Enum({ items: () => TeamAccessRole })
  role: TeamAccessRole = TeamAccessRole.EDITOR;

  @Property({ fieldName: 'joined_at', onCreate: () => new Date(), type: 'Date' })
  joinedAt?: Date;
}
