const REQUIRED_ENV_KEYS = [
  'JWT_ACCESS_SECRET',
  'DATABASE_URL',
] as const;

/**
 * Validates required environment variables before Nest bootstraps.
 * Fails fast with an actionable message (Railway / production misconfiguration).
 */
export function validateRequiredEnv(): void {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  if (missingKeys.length === 0) {
    return;
  }
  throw new Error(
    `Missing required environment variables: ${missingKeys.join(', ')}. ` +
      'Set them in Railway → your API service → Variables (not only Shared Variables), then redeploy.',
  );
}
