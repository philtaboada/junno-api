import { Migration } from '@mikro-orm/migrations';

export class Migration20250623120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "project_list_columns" (
        "id" uuid not null default gen_random_uuid(),
        "project_id" uuid not null,
        "field_key" text not null,
        "position" int not null,
        "visible" boolean not null default true,
        "width" int null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "project_list_columns_pkey" primary key ("id"),
        constraint "project_list_columns_field_key_check" check (
          "field_key" in ('name', 'due_at', 'assignee', 'description', 'priority')
        )
      );
    `);
    this.addSql(`
      alter table "project_list_columns"
      add constraint "project_list_columns_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "project_list_columns_project_field_key_unique"
      on "project_list_columns" ("project_id", "field_key");
    `);
    this.addSql(`
      insert into "project_list_columns" ("project_id", "field_key", "position", "visible", "width")
      select p.id, seed.field_key, seed.position, seed.visible, seed.width
      from "projects" p
      cross join (
        values
          ('name', 0, true, null::int),
          ('due_at', 1, true, 108),
          ('assignee', 2, true, 72),
          ('description', 3, false, 200),
          ('priority', 4, false, 96)
      ) as seed(field_key, position, visible, width);
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "project_list_columns" cascade;`);
  }
}
