import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from './user.entity';

@Entity({ tableName: 'password_reset_tokens' })
export class PasswordResetToken {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Property({ fieldName: 'token_hash', type: 'string' })
  @Unique()
  tokenHash!: string;

  @Property({ fieldName: 'expires_at', type: 'Date' })
  expiresAt!: Date;

  @Property({ fieldName: 'used_at', nullable: true, type: 'Date' })
  usedAt: Date | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
