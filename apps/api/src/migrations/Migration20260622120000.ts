import { Migration } from '@mikro-orm/migrations';

export class Migration20260622120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "automation_rules" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "project_id" uuid not null,
        "name" text not null,
        "enabled" boolean not null default true,
        "trigger_type" varchar(64) not null,
        "trigger_config" jsonb not null default '{}',
        "action_type" varchar(64) not null,
        "action_config" jsonb not null default '{}',
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "automation_rules_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "automation_rules"
      add constraint "automation_rules_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "automation_rules"
      add constraint "automation_rules_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "automation_rules"
      add constraint "automation_rules_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "automation_rules_project_id_enabled_index"
      on "automation_rules" ("project_id", "enabled");
    `);

    this.addSql(`
      create table "automation_runs" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "rule_id" uuid not null,
        "task_id" uuid null,
        "status" varchar(32) not null,
        "trigger_payload" jsonb not null default '{}',
        "error_message" text null,
        "created_at" timestamptz not null default now(),
        "completed_at" timestamptz null,
        constraint "automation_runs_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "automation_runs"
      add constraint "automation_runs_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "automation_runs"
      add constraint "automation_runs_rule_id_foreign"
      foreign key ("rule_id") references "automation_rules" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "automation_runs"
      add constraint "automation_runs_task_id_foreign"
      foreign key ("task_id") references "tasks" ("id") on update cascade on delete set null;
    `);
    this.addSql(`
      create index "automation_runs_rule_id_created_at_index"
      on "automation_runs" ("rule_id", "created_at");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "automation_runs" cascade;`);
    this.addSql(`drop table if exists "automation_rules" cascade;`);
  }
}
