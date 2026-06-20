import { Migration } from '@mikro-orm/migrations';

export class Migration20250624120000 extends Migration {
  override up(): void {
    this.addSql(`
      alter table "tasks"
      add column "priority" text null,
      add constraint "tasks_priority_check" check (
        "priority" is null or "priority" in ('low', 'medium', 'high')
      );
    `);
    this.addSql(`
      create table "my_tasks_list_columns" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "user_id" uuid not null,
        "field_key" text not null,
        "position" int not null,
        "visible" boolean not null default true,
        "width" int null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "my_tasks_list_columns_pkey" primary key ("id"),
        constraint "my_tasks_list_columns_field_key_check" check (
          "field_key" in ('name', 'due_at', 'assignee', 'description', 'priority')
        )
      );
    `);
    this.addSql(`
      alter table "my_tasks_list_columns"
      add constraint "my_tasks_list_columns_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "my_tasks_list_columns"
      add constraint "my_tasks_list_columns_user_id_foreign"
      foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "my_tasks_list_columns_user_field_key_unique"
      on "my_tasks_list_columns" ("workspace_id", "user_id", "field_key");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "my_tasks_list_columns" cascade;`);
    this.addSql(`alter table "tasks" drop constraint if exists "tasks_priority_check";`);
    this.addSql(`alter table "tasks" drop column if exists "priority";`);
  }
}
