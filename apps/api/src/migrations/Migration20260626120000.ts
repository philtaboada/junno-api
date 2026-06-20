import { Migration } from '@mikro-orm/migrations';

export class Migration20260626120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "project_forms" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "project_id" uuid not null,
        "name" text not null,
        "description" text null,
        "public_slug" text not null,
        "is_public" boolean not null default false,
        "is_active" boolean not null default true,
        "section_id" uuid null,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "project_forms_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "project_forms"
      add constraint "project_forms_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_forms"
      add constraint "project_forms_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "project_forms"
      add constraint "project_forms_section_id_foreign"
      foreign key ("section_id") references "sections" ("id") on update cascade on delete set null;
    `);
    this.addSql(`
      alter table "project_forms"
      add constraint "project_forms_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "project_forms_public_slug_unique"
      on "project_forms" ("public_slug");
    `);
    this.addSql(`
      create index "project_forms_project_id_index"
      on "project_forms" ("project_id");
    `);

    this.addSql(`
      create table "form_fields" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "form_id" uuid not null,
        "type" text not null,
        "label" text not null,
        "required" boolean not null default false,
        "position" int not null default 0,
        "custom_field_definition_id" uuid null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "form_fields_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "form_fields"
      add constraint "form_fields_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "form_fields"
      add constraint "form_fields_form_id_foreign"
      foreign key ("form_id") references "project_forms" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "form_fields"
      add constraint "form_fields_custom_field_definition_id_foreign"
      foreign key ("custom_field_definition_id") references "custom_field_definitions" ("id") on update cascade on delete set null;
    `);
    this.addSql(`
      create index "form_fields_form_id_index" on "form_fields" ("form_id");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "form_fields" cascade;`);
    this.addSql(`drop table if exists "project_forms" cascade;`);
  }
}
