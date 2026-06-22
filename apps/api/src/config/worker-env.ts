import type { ConfigService } from '@nestjs/config';

/**
 * BullMQ workers poll Redis continuously — keep them off in MVP unless explicitly enabled.
 */
export function isBackgroundWorkerEnabled(
  configService: ConfigService,
  envKey: 'AUTOMATION_WORKER_ENABLED' | 'INTEGRATIONS_WORKER_ENABLED',
): boolean {
  return configService.get<string>(envKey) === 'true';
}
