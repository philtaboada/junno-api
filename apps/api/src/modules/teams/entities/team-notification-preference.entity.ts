import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Team } from './team.entity';

@Entity({ tableName: 'team_notification_preferences' })
@Unique({ properties: ['team', 'user'] })
export class TeamNotificationPreference {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Team, { fieldName: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Property({ fieldName: 'notify_on_invite', default: true })
  notifyOnInvite = true;

  @Property({ fieldName: 'notify_on_join', default: true })
  notifyOnJoin = true;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt = new Date();

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    type: 'Date',
  })
  updatedAt = new Date();
}
