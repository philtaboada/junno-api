import { Migration } from '@mikro-orm/migrations';

export class Migration20250618190000 extends Migration {
  override up(): void {
    this.addSql(`alter table "team_invitations" alter column "email" drop not null;`);
  }

  override down(): void {
    this.addSql(`delete from "team_invitations" where "email" is null;`);
    this.addSql(`alter table "team_invitations" alter column "email" set not null;`);
  }
}
