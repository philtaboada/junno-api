import { Migration } from '@mikro-orm/migrations';

export class Migration20260627120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "project_integrations" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "project_id" uuid not null,
        "type" text not null,
        "name" text not null,
        "events" jsonb not null default '[]',
        "config" jsonb not null default '{}',
        "is_active" boolean not null default true,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "project_integrations_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_integrations"
      add constraint "project_integrations_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_integrations"
      add constraint "project_integrations_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_integrations"
      add constraint "project_integrations_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "project_integrations_project_id_index"
      on "project_integrations" ("project_id");
    `);

    this.addSql(`
      create table "integration_delivery_logs" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "integration_id" uuid not null,
        "event_type" text not null,
        "status" text not null,
        "response_code" int null,
        "error_message" text null,
        "created_at" timestamptz not null default now(),
        constraint "integration_delivery_logs_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "integration_delivery_logs"
      add constraint "integration_delivery_logs_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "integration_delivery_logs"
      add constraint "integration_delivery_logs_integration_id_foreign"
      foreign key ("integration_id") references "project_integrations" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "integration_delivery_logs_integration_id_index"
      on "integration_delivery_logs" ("integration_id");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "integration_delivery_logs" cascade;`);
    this.addSql(`drop table if exists "project_integrations" cascade;`);
  }
}
