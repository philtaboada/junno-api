import { Migration } from '@mikro-orm/migrations';

export class Migration20250618160000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "teams" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "name" varchar(255) not null,
        "description" text null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "teams_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "teams" add constraint "teams_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create index "teams_workspace_id_index" on "teams" ("workspace_id");`,
    );

    this.addSql(`
      create table "team_members" (
        "id" uuid not null default gen_random_uuid(),
        "team_id" uuid not null,
        "user_id" uuid not null,
        "joined_at" timestamptz not null,
        constraint "team_members_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "team_members" add constraint "team_members_team_id_foreign" foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "team_members" add constraint "team_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "team_members_team_id_user_id_unique" on "team_members" ("team_id", "user_id");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "team_members" cascade;`);
    this.addSql(`drop table if exists "teams" cascade;`);
  }
}
