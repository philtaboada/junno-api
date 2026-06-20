import { Migration } from '@mikro-orm/migrations';

export class Migration20250625120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "custom_field_definitions" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "project_id" uuid not null,
        "name" text not null,
        "type" text not null,
        "settings" jsonb not null default '{}',
        "position" int not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "custom_field_definitions_pkey" primary key ("id"),
        constraint "custom_field_definitions_type_check" check (
          "type" in ('select', 'multiselect', 'date', 'people', 'text', 'number', 'timer')
        )
      );
    `);
    this.addSql(`
      alter table "custom_field_definitions"
      add constraint "custom_field_definitions_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "custom_field_definitions"
      add constraint "custom_field_definitions_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "custom_field_definitions_project_name_unique"
      on "custom_field_definitions" ("project_id", "name");
    `);

    this.addSql(`
      create table "custom_field_values" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "task_id" uuid not null,
        "field_definition_id" uuid not null,
        "value" jsonb not null default '{}',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "custom_field_values_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "custom_field_values"
      add constraint "custom_field_values_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "custom_field_values"
      add constraint "custom_field_values_task_id_foreign"
      foreign key ("task_id") references "tasks" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "custom_field_values"
      add constraint "custom_field_values_field_definition_id_foreign"
      foreign key ("field_definition_id") references "custom_field_definitions" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "custom_field_values_task_field_unique"
      on "custom_field_values" ("task_id", "field_definition_id");
    `);

    this.addSql(`
      alter table "project_list_columns" add column "custom_field_id" uuid null;
    `);
    this.addSql(`
      alter table "project_list_columns"
      add constraint "project_list_columns_custom_field_id_foreign"
      foreign key ("custom_field_id") references "custom_field_definitions" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      delete from "project_list_columns"
      where "field_key" in ('description', 'priority');
    `);
    this.addSql(`
      alter table "project_list_columns" alter column "field_key" drop not null;
    `);
    this.addSql(`
      alter table "project_list_columns" drop constraint if exists "project_list_columns_field_key_check";
    `);
    this.addSql(`
      alter table "project_list_columns" add constraint "project_list_columns_field_key_check" check (
        "field_key" is null or "field_key" in ('name', 'due_at', 'assignee')
      );
    `);
    this.addSql(`
      alter table "project_list_columns" add constraint "project_list_columns_target_check" check (
        ("field_key" is not null and "custom_field_id" is null)
        or ("field_key" is null and "custom_field_id" is not null)
      );
    `);
    this.addSql(`
      drop index if exists "project_list_columns_project_field_key_unique";
    `);
    this.addSql(`
      create unique index "project_list_columns_project_field_key_unique"
      on "project_list_columns" ("project_id", "field_key")
      where "field_key" is not null;
    `);
    this.addSql(`
      create unique index "project_list_columns_project_custom_field_unique"
      on "project_list_columns" ("project_id", "custom_field_id")
      where "custom_field_id" is not null;
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "custom_field_values" cascade;`);
    this.addSql(`drop table if exists "custom_field_definitions" cascade;`);
    this.addSql(`alter table "project_list_columns" drop constraint if exists "project_list_columns_custom_field_id_foreign";`);
    this.addSql(`alter table "project_list_columns" drop column if exists "custom_field_id";`);
  }
}
