import type { EntityManager } from '@mikro-orm/core';

export type DatabaseHealthCheck = {
  name: string;
  status: 'ok' | 'error';
  message?: string;
};

export type DatabaseHealthResult = {
  status: 'ok' | 'error';
  checks: DatabaseHealthCheck[];
};

/**
 * Validates DATABASE_URL shape before Nest bootstraps (sync, no network).
 */
export function validateDatabaseUrl(databaseUrl: string): void {
  const issues: string[] = [];
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    issues.push('DATABASE_URL must use the postgresql:// scheme.');
  }
  if (databaseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    issues.push('DATABASE_URL points to localhost in production.');
  }
  if (databaseUrl.includes('pooler.supabase.com') && databaseUrl.includes(':6543/')) {
    issues.push(
      'DATABASE_URL uses Supabase transaction pooler (port 6543). ' +
        'Use session pooler port 5432 with MikroORM on Railway.',
    );
  }
  if (
    databaseUrl.includes('supabase.com') &&
    !databaseUrl.includes('sslmode=') &&
    process.env.NODE_ENV === 'production'
  ) {
    issues.push('DATABASE_URL should include ?sslmode=require for Supabase in production.');
  }
  if (issues.length === 0) {
    return;
  }
  throw new Error(`Invalid DATABASE_URL: ${issues.join(' ')}`);
}

/**
 * Runs live checks against PostgreSQL (connection + required auth tables).
 */
export async function runDatabaseHealthChecks(
  entityManager: EntityManager,
): Promise<DatabaseHealthResult> {
  const checks: DatabaseHealthCheck[] = [];
  try {
    await entityManager.getConnection().execute('select 1 as ok');
    checks.push({ name: 'connection', status: 'ok' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    checks.push({ name: 'connection', status: 'error', message });
    return { status: 'error', checks };
  }
  const schemaChecks: Array<{ name: string; sql: string }> = [
    { name: 'schema.users', sql: 'select 1 from users limit 1' },
    { name: 'schema.workspaces', sql: 'select 1 from workspaces limit 1' },
    { name: 'schema.migrations', sql: 'select 1 from mikro_orm_migrations limit 1' },
  ];
  for (const schemaCheck of schemaChecks) {
    try {
      await entityManager.getConnection().execute(schemaCheck.sql);
      checks.push({ name: schemaCheck.name, status: 'ok' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown schema error';
      checks.push({ name: schemaCheck.name, status: 'error', message });
    }
  }
  const hasError = checks.some((check) => check.status === 'error');
  return { status: hasError ? 'error' : 'ok', checks };
}

export function formatDatabaseHealthError(result: DatabaseHealthResult): string {
  return result.checks
    .filter((check) => check.status === 'error')
    .map((check) => `${check.name}: ${check.message ?? 'failed'}`)
    .join('; ');
}
