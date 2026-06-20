import { Migration } from '@mikro-orm/migrations';

export class Migration20260619120000 extends Migration {
  override up(): void {
    this.addSql(`
      alter table "my_tasks_list_columns" add column "custom_field_id" uuid null;
    `);
    this.addSql(`
      alter table "my_tasks_list_columns"
      add constraint "my_tasks_list_columns_custom_field_id_foreign"
      foreign key ("custom_field_id") references "custom_field_definitions" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" alter column "field_key" drop not null;
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" drop constraint if exists "my_tasks_list_columns_field_key_check";
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" add constraint "my_tasks_list_columns_field_key_check" check (
        "field_key" is null or "field_key" in ('name', 'due_at', 'assignee', 'description', 'priority')
      );
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" add constraint "my_tasks_list_columns_target_check" check (
        ("field_key" is not null and "custom_field_id" is null)
        or ("field_key" is null and "custom_field_id" is not null)
      );
    `);
    this.addSql(`
      drop index if exists "my_tasks_list_columns_user_field_key_unique";
    `);
    this.addSql(`
      create unique index "my_tasks_list_columns_user_field_key_unique"
      on "my_tasks_list_columns" ("workspace_id", "user_id", "field_key")
      where "field_key" is not null;
    `);
    this.addSql(`
      create unique index "my_tasks_list_columns_user_custom_field_unique"
      on "my_tasks_list_columns" ("workspace_id", "user_id", "custom_field_id")
      where "custom_field_id" is not null;
    `);
  }

  override down(): void {
    this.addSql(`
      drop index if exists "my_tasks_list_columns_user_custom_field_unique";
    `);
    this.addSql(`
      drop index if exists "my_tasks_list_columns_user_field_key_unique";
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" drop constraint if exists "my_tasks_list_columns_target_check";
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" drop constraint if exists "my_tasks_list_columns_field_key_check";
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" alter column "field_key" set not null;
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" add constraint "my_tasks_list_columns_field_key_check" check (
        "field_key" in ('name', 'due_at', 'assignee', 'description', 'priority')
      );
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" drop constraint if exists "my_tasks_list_columns_custom_field_id_foreign";
    `);
    this.addSql(`
      alter table "my_tasks_list_columns" drop column if exists "custom_field_id";
    `);
    this.addSql(`
      create unique index "my_tasks_list_columns_user_field_key_unique"
      on "my_tasks_list_columns" ("workspace_id", "user_id", "field_key");
    `);
  }
}
