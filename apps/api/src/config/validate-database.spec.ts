import { validateDatabaseUrl } from './validate-database';

describe('validateDatabaseUrl', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should accept a valid Supabase session pooler URL', () => {
    process.env.NODE_ENV = 'production';
    expect(() =>
      validateDatabaseUrl(
        'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
      ),
    ).not.toThrow();
  });

  it('should reject Supabase transaction pooler port 6543', () => {
    process.env.NODE_ENV = 'production';
    expect(() =>
      validateDatabaseUrl(
        'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
      ),
    ).toThrow(/transaction pooler/);
  });
});
