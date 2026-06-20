import { Migration } from '@mikro-orm/migrations';

export class Migration20250620120000 extends Migration {
  override up(): void {
    this.addSql(`
      create table "team_notification_preferences" (
        "id" uuid not null default gen_random_uuid(),
        "team_id" uuid not null,
        "user_id" uuid not null,
        "notify_on_invite" boolean not null default true,
        "notify_on_join" boolean not null default true,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "team_notification_preferences_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "team_notification_preferences" add constraint "team_notification_preferences_team_id_foreign" foreign key ("team_id") references "teams" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "team_notification_preferences" add constraint "team_notification_preferences_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create unique index "team_notification_preferences_team_id_user_id_unique" on "team_notification_preferences" ("team_id", "user_id");`,
    );
    this.addSql(`
      create table "activity_events" (
        "id" uuid not null default gen_random_uuid(),
        "workspace_id" uuid not null,
        "recipient_user_id" uuid not null,
        "actor_user_id" uuid null,
        "type" varchar(64) not null,
        "payload" jsonb not null default '{}',
        "read_at" timestamptz null,
        "created_at" timestamptz not null,
        constraint "activity_events_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "activity_events" add constraint "activity_events_workspace_id_foreign" foreign key ("workspace_id") references "workspaces" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "activity_events" add constraint "activity_events_recipient_user_id_foreign" foreign key ("recipient_user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "activity_events" add constraint "activity_events_actor_user_id_foreign" foreign key ("actor_user_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "activity_events_recipient_user_id_created_at_index" on "activity_events" ("recipient_user_id", "created_at");`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "activity_events" cascade;`);
    this.addSql(`drop table if exists "team_notification_preferences" cascade;`);
  }
}
