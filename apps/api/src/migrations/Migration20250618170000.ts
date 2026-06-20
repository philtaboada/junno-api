import { Migration } from '@mikro-orm/migrations';

export class Migration20250618170000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "team_invitations" (
        "id" uuid not null default gen_random_uuid(),
        "team_id" uuid not null,
        "workspace_id" uuid not null,
        "email" citext not null,
        "invited_by_id" uuid not null,
        "token_hash" varchar(255) not null,
        "expires_at" timestamptz not null,
        "accepted_at" timestamptz null,
        "revoked_at" timestamptz null,
        "created_at" timestamptz not null,
        constraint "team_invitations_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "team_invitations" add constraint "team_invitations_team_id_foreign" foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "team_invitations" add constraint "team_invitations_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "team_invitations" add constraint "team_invitations_invited_by_id_foreign" foreign key ("invited_by_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "team_invitations_token_hash_unique" on "team_invitations" ("token_hash");`,
    );
    this.addSql(
      `create index "team_invitations_team_id_email_index" on "team_invitations" ("team_id", "email");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "team_invitations" cascade;`);
  }
}
