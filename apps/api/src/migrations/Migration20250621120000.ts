import { Migration } from '@mikro-orm/migrations';

export class Migration20250621120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "projects" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "team_id" uuid not null,
        "name" varchar(255) not null,
        "description" text null,
        "color" varchar(32) null,
        "status" varchar(32) not null default 'active',
        "created_by_id" uuid not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "projects_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "projects" add constraint "projects_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "projects" add constraint "projects_team_id_foreign" foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "projects" add constraint "projects_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete restrict;`,
    );
    this.addSql(
      `create index "projects_workspace_id_index" on "projects" ("workspace_id");`,
    );
    this.addSql(
      `create index "projects_team_id_index" on "projects" ("team_id");`,
    );
    this.addSql(`
      create table "sections" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "project_id" uuid not null,
        "name" varchar(255) not null,
        "position" double precision not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "sections_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "sections" add constraint "sections_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "sections" add constraint "sections_project_id_foreign" foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create index "sections_project_id_index" on "sections" ("project_id");`,
    );
    this.addSql(`
      create table "project_members" (
        "id" uuid not null default gen_random_uuid(),
        "project_id" uuid not null,
        "user_id" uuid not null,
        "role" varchar(32) not null default 'editor',
        "joined_at" timestamptz not null,
        constraint "project_members_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "project_members" add constraint "project_members_project_id_foreign" foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "project_members" add constraint "project_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "project_members_project_id_user_id_unique" on "project_members" ("project_id", "user_id");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "project_members" cascade;`);
    this.addSql(`drop table if exists "sections" cascade;`);
    this.addSql(`drop table if exists "projects" cascade;`);
  }
}
