import { Migration } from '@mikro-orm/migrations';

export class Migration20250618180000 extends Migration {
  override up(): void {
    this.addSql(`
      alter table "team_members"
      add column "role" text check ("role" in ('editor', 'commenter', 'viewer')) not null default 'editor';
    `);
    this.addSql(`
      alter table "team_invitations"
      add column "role" text check ("role" in ('editor', 'commenter', 'viewer')) not null default 'editor';
    `);
  }

  override down(): void {
    this.addSql(`alter table "team_invitations" drop column if exists "role";`);
    this.addSql(`alter table "team_members" drop column if exists "role";`);
  }
}
