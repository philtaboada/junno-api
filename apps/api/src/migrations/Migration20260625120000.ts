import { Migration } from '@mikro-orm/migrations';

export class Migration20260625120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "dashboards" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "team_id" uuid null,
        "name" text not null default 'Dashboard',
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "dashboards_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "dashboards"
      add constraint "dashboards_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "dashboards"
      add constraint "dashboards_team_id_foreign"
      foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "dashboards"
      add constraint "dashboards_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "dashboards_workspace_unique"
      on "dashboards" ("workspace_id")
      where "team_id" is null;
    `);
    this.addSql(`
      create unique index "dashboards_team_unique"
      on "dashboards" ("workspace_id", "team_id")
      where "team_id" is not null;
    `);

    this.addSql(`
      create table "dashboard_widgets" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "dashboard_id" uuid not null,
        "type" text not null,
        "title" text not null,
        "config" jsonb not null default '{}',
        "position" int not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "dashboard_widgets_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "dashboard_widgets"
      add constraint "dashboard_widgets_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "dashboard_widgets"
      add constraint "dashboard_widgets_dashboard_id_foreign"
      foreign key ("dashboard_id") references "dashboards" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "dashboard_widgets_dashboard_id_index"
      on "dashboard_widgets" ("dashboard_id");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "dashboard_widgets" cascade;`);
    this.addSql(`drop table if exists "dashboards" cascade;`);
  }
}
