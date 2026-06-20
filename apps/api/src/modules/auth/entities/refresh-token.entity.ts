import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from './user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Property({ fieldName: 'token_hash', type: 'string' })
  @Unique()
  tokenHash!: string;

  @Property({ fieldName: 'expires_at', type: 'Date' })
  expiresAt!: Date;

  @Property({ fieldName: 'revoked_at', nullable: true, type: 'Date' })
  revokedAt: Date | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
