import { Migration } from '@mikro-orm/migrations';

export class Migration20260624120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "portfolios" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "name" text not null,
        "description" text null,
        "color" text null,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "portfolios_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "portfolios"
      add constraint "portfolios_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "portfolios"
      add constraint "portfolios_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "portfolios_workspace_id_index" on "portfolios" ("workspace_id");
    `);

    this.addSql(`
      create table "portfolio_projects" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "portfolio_id" uuid not null,
        "project_id" uuid not null,
        "position" double precision not null default 0,
        "created_at" timestamptz not null default now(),
        constraint "portfolio_projects_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "portfolio_projects"
      add constraint "portfolio_projects_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "portfolio_projects"
      add constraint "portfolio_projects_portfolio_id_foreign"
      foreign key ("portfolio_id") references "portfolios" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "portfolio_projects"
      add constraint "portfolio_projects_project_id_foreign"
      foreign key ("project_id") references "projects" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create unique index "portfolio_projects_portfolio_id_project_id_unique"
      on "portfolio_projects" ("portfolio_id", "project_id");
    `);
    this.addSql(`
      create index "portfolio_projects_portfolio_id_index"
      on "portfolio_projects" ("portfolio_id");
    `);

    this.addSql(`
      create table "goals" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "portfolio_id" uuid not null,
        "name" text not null,
        "description" text null,
        "metric_type" text not null,
        "metric_config" jsonb not null default '{}',
        "target_value" double precision null,
        "due_at" timestamptz null,
        "created_by_id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "goals_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "goals"
      add constraint "goals_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "goals"
      add constraint "goals_portfolio_id_foreign"
      foreign key ("portfolio_id") references "portfolios" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "goals"
      add constraint "goals_created_by_id_foreign"
      foreign key ("created_by_id") references "users" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "goals_portfolio_id_index" on "goals" ("portfolio_id");
    `);

    this.addSql(`
      create table "goal_metric_snapshots" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "goal_id" uuid not null,
        "value" double precision not null,
        "recorded_at" timestamptz not null default now(),
        constraint "goal_metric_snapshots_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      alter table "goal_metric_snapshots"
      add constraint "goal_metric_snapshots_workspace_id_foreign"
      foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      alter table "goal_metric_snapshots"
      add constraint "goal_metric_snapshots_goal_id_foreign"
      foreign key ("goal_id") references "goals" ("id") on update cascade on delete cascade;
    `);
    this.addSql(`
      create index "goal_metric_snapshots_goal_id_index"
      on "goal_metric_snapshots" ("goal_id");
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "goal_metric_snapshots" cascade;`);
    this.addSql(`drop table if exists "goals" cascade;`);
    this.addSql(`drop table if exists "portfolio_projects" cascade;`);
    this.addSql(`drop table if exists "portfolios" cascade;`);
  }
}
