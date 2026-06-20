import { Migration } from '@mikro-orm/migrations';

export class Migration20250618230000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "users" (
        "id" uuid not null default gen_random_uuid(),
        "email" citext not null,
        "password_hash" varchar(255) not null,
        "name" varchar(255) not null,
        "email_verified_at" timestamptz null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "users_pkey" primary key ("id")
      );
    `);
    this.addSql(`create unique index "users_email_unique" on "users" ("email");`);

    this.addSql(`
      create table "workspaces" (
        "id" uuid not null default gen_random_uuid(),
        "name" varchar(255) not null,
        "type" text check ("type" in ('personal', 'organization')) not null default 'personal',
        "email_domain" varchar(255) null,
        "created_at" timestamptz not null,
        constraint "workspaces_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      create table "workspace_members" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "user_id" uuid not null,
        "role" text check ("role" in ('admin', 'member', 'guest')) not null default 'member',
        "joined_at" timestamptz not null,
        constraint "workspace_members_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "workspace_members" add constraint "workspace_members_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "workspace_members" add constraint "workspace_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "workspace_members_workspace_id_user_id_unique" on "workspace_members" ("workspace_id", "user_id");`,
    );

    this.addSql(`
      create table "refresh_tokens" (
        "id" uuid not null default gen_random_uuid(),
        "user_id" uuid not null,
        "token_hash" varchar(255) not null,
        "expires_at" timestamptz not null,
        "revoked_at" timestamptz null,
        "created_at" timestamptz not null,
        constraint "refresh_tokens_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "refresh_tokens_token_hash_unique" on "refresh_tokens" ("token_hash");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "refresh_tokens" cascade;`);
    this.addSql(`drop table if exists "workspace_members" cascade;`);
    this.addSql(`drop table if exists "workspaces" cascade;`);
    this.addSql(`drop table if exists "users" cascade;`);
  }
}
