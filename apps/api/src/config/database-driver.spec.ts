import { resolveDatabaseConfig } from './database-driver';

describe('resolveDatabaseConfig', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('keeps Supabase URL unchanged in production', () => {
    process.env.NODE_ENV = 'production';
    const url =
      'postgresql://postgres.ref:secret@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require';

    expect(resolveDatabaseConfig(url)).toEqual({ clientUrl: url });
  });

  it('adds libpq compatibility for Supabase in local development', () => {
    process.env.NODE_ENV = 'development';
    const url =
      'postgresql://postgres.ref:secret@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require';

    expect(resolveDatabaseConfig(url)).toEqual({
      clientUrl:
        'postgresql://postgres.ref:secret@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true',
    });
  });

  it('leaves localhost URLs untouched in development', () => {
    process.env.NODE_ENV = 'development';
    const url = 'postgresql://pm:pm_dev_password@localhost:5432/project_management';

    expect(resolveDatabaseConfig(url)).toEqual({ clientUrl: url });
  });
});
