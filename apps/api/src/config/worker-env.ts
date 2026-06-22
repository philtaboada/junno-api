import type { ConfigService } from '@nestjs/config';

/**
 * Workers are on when REDIS_URL is set, unless explicitly disabled with =false.
 */
export function isBackgroundWorkerEnabled(
  configService: ConfigService,
  envKey: 'AUTOMATION_WORKER_ENABLED' | 'INTEGRATIONS_WORKER_ENABLED',
): boolean {
  const explicitValue = configService.get<string>(envKey)?.trim().toLowerCase();
  if (explicitValue === 'false') {
    return false;
  }
  if (explicitValue === 'true') {
    return true;
  }
  return Boolean(configService.get<string>('REDIS_URL')?.trim());
}
