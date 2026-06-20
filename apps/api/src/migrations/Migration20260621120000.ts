import { Migration } from '@mikro-orm/migrations';

export class Migration20260621120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "task_attachments" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "task_id" uuid not null,
        "uploaded_by_id" uuid not null,
        "file_name" text not null,
        "mime_type" text not null,
        "size_bytes" bigint not null,
        "storage_key" text not null,
        "created_at" timestamptz not null default now(),
        constraint "task_attachments_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "task_attachments"
      add constraint "task_attachments_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "task_attachments"
      add constraint "task_attachments_task_id_foreign"
      foreign key ("task_id") references "tasks" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "task_attachments"
      add constraint "task_attachments_uploaded_by_id_foreign"
      foreign key ("uploaded_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "task_attachments_task_id_index" on "task_attachments" ("task_id");
    `);

    this.addSql(`
      create table "task_dependencies" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "predecessor_task_id" uuid not null,
        "successor_task_id" uuid not null,
        "type" text not null default 'finish_to_start',
        "created_at" timestamptz not null default now(),
        constraint "task_dependencies_pkey" primary key ("id"),
        constraint "task_dependencies_type_check" check ("type" in ('finish_to_start'))
      );
    `);
    this.addSql(`
      alter table "task_dependencies"
      add constraint "task_dependencies_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "task_dependencies"
      add constraint "task_dependencies_predecessor_task_id_foreign"
      foreign key ("predecessor_task_id") references "tasks" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "task_dependencies"
      add constraint "task_dependencies_successor_task_id_foreign"
      foreign key ("successor_task_id") references "tasks" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "task_dependencies_predecessor_successor_unique"
      on "task_dependencies" ("predecessor_task_id", "successor_task_id");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "task_dependencies" cascade;`);
    this.addSql(`drop table if exists "task_attachments" cascade;`);
  }
}
