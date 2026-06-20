import { Migration } from '@mikro-orm/migrations';

export class Migration20250619000000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "password_reset_tokens" (
        "id" uuid not null default gen_random_uuid(),
        "user_id" uuid not null,
        "token_hash" varchar(255) not null,
        "expires_at" timestamptz not null,
        "used_at" timestamptz null,
        "created_at" timestamptz not null,
        constraint "password_reset_tokens_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "password_reset_tokens" add constraint "password_reset_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "password_reset_tokens_token_hash_unique" on "password_reset_tokens" ("token_hash");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "password_reset_tokens" cascade;`);
  }
}
