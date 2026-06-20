import { Migration } from '@mikro-orm/migrations';

export class Migration20250622120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "tasks" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "name" varchar(255) not null,
        "description" text null,
        "assignee_id" uuid null,
        "due_at" timestamptz null,
        "due_has_time" boolean not null default false,
        "completed_at" timestamptz null,
        "parent_task_id" uuid null,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "tasks_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "tasks" add constraint "tasks_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "tasks" add constraint "tasks_assignee_id_foreign" foreign key ("assignee_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "tasks" add constraint "tasks_parent_task_id_foreign" foreign key ("parent_task_id") references "tasks" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "tasks" add constraint "tasks_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete restrict;`,
    );
    this.addSql(`create index "tasks_workspace_id_index" on "tasks" ("workspace_id");`);
    this.addSql(`create index "tasks_assignee_id_index" on "tasks" ("assignee_id");`);
    this.addSql(`create index "tasks_parent_task_id_index" on "tasks" ("parent_task_id");`);
    this.addSql(`
      create table "task_memberships" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "task_id" uuid not null,
        "project_id" uuid not null,
        "section_id" uuid null,
        "position" double precision not null,
        constraint "task_memberships_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "task_memberships" add constraint "task_memberships_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "task_memberships" add constraint "task_memberships_task_id_foreign" foreign key ("task_id") references "tasks" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "task_memberships" add constraint "task_memberships_project_id_foreign" foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "task_memberships" add constraint "task_memberships_section_id_foreign" foreign key ("section_id") references "sections" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create unique index "task_memberships_task_id_project_id_unique" on "task_memberships" ("task_id", "project_id");`,
    );
    this.addSql(
      `create index "task_memberships_project_id_index" on "task_memberships" ("project_id");`,
    );
    this.addSql(`
      create table "comments" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "task_id" uuid not null,
        "author_id" uuid not null,
        "body" text not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "comments_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "comments" add constraint "comments_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "comments" add constraint "comments_task_id_foreign" foreign key ("task_id") references "tasks" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "comments" add constraint "comments_author_id_foreign" foreign key ("author_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(`create index "comments_task_id_index" on "comments" ("task_id");`);
  }

  override down(): void {
    this.addSql(`drop table if exists "comments" cascade;`);
    this.addSql(`drop table if exists "task_memberships" cascade;`);
    this.addSql(`drop table if exists "tasks" cascade;`);
  }
}
