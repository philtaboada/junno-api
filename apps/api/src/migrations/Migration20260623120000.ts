import { Migration } from '@mikro-orm/migrations';

export class Migration20260623120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "project_templates" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "source_project_id" uuid null,
        "name" text not null,
        "description" text null,
        "has_tasks" boolean not null default false,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "project_templates_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_templates"
      add constraint "project_templates_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_templates"
      add constraint "project_templates_source_project_id_foreign"
      foreign key ("source_project_id") references "projects" ("id") on update cascade on delete set null;
    `);
    this.addSql(`
      alter table "project_templates"
      add constraint "project_templates_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "project_templates_workspace_id_index"
      on "project_templates" ("workspace_id");
    `);

    this.addSql(`
      create table "project_template_sections" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "template_id" uuid not null,
        "name" text not null,
        "position" double precision not null,
        constraint "project_template_sections_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_template_sections"
      add constraint "project_template_sections_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_template_sections"
      add constraint "project_template_sections_template_id_foreign"
      foreign key ("template_id") references "project_templates" ("id") on update cascade on delete cascade;
    `);

    this.addSql(`
      create table "project_template_custom_fields" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "template_id" uuid not null,
        "name" text not null,
        "type" text not null,
        "settings" jsonb not null default '{}',
        "position" int not null,
        constraint "project_template_custom_fields_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_template_custom_fields"
      add constraint "project_template_custom_fields_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_template_custom_fields"
      add constraint "project_template_custom_fields_template_id_foreign"
      foreign key ("template_id") references "project_templates" ("id") on update cascade on delete cascade;
    `);

    this.addSql(`
      create table "project_template_tasks" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "template_id" uuid not null,
        "template_section_id" uuid not null,
        "name" text not null,
        "description" text null,
        "position" double precision not null,
        constraint "project_template_tasks_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_template_tasks"
      add constraint "project_template_tasks_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_template_tasks"
      add constraint "project_template_tasks_template_id_foreign"
      foreign key ("template_id") references "project_templates" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_template_tasks"
      add constraint "project_template_tasks_template_section_id_foreign"
      foreign key ("template_section_id") references "project_template_sections" ("id") on update cascade on delete cascade;
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "project_template_tasks" cascade;`);
    this.addSql(`drop table if exists "project_template_custom_fields" cascade;`);
    this.addSql(`drop table if exists "project_template_sections" cascade;`);
    this.addSql(`drop table if exists "project_templates" cascade;`);
  }
}
