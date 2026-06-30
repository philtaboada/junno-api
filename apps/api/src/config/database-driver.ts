type ResolvedDatabaseConfig = {
  clientUrl: string;
};

const LOCAL_DATABASE_URL =
  'postgresql://pm:pm_dev_password@localhost:5432/project_management';

/**
 * pg v8 treats `sslmode=require` as verify-full, which often fails against
 * Supabase from a local Node runtime. Production (Railway) keeps the URL as-is.
 */
export function resolveDatabaseConfig(
  databaseUrl = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
): ResolvedDatabaseConfig {
  const isLocalDev = process.env.NODE_ENV !== 'production';
  const usesSupabase = databaseUrl.includes('supabase.com');

  if (!isLocalDev || !usesSupabase) {
    return { clientUrl: databaseUrl };
  }

  const url = new URL(databaseUrl);
  url.searchParams.set('uselibpqcompat', 'true');
  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }

  return { clientUrl: url.toString() };
}
