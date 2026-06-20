import { Migration } from '@mikro-orm/migrations';

export class Migration20260618120000 extends Migration {
  override up(): void {
    this.addSql(`
      alter table "tasks"
      add column "start_at" timestamptz null,
      add column "start_has_time" boolean not null default false;
    `);
  }

  override down(): void {
    this.addSql(`
      alter table "tasks"
      drop column "start_at",
      drop column "start_has_time";
    `);
  }
}
