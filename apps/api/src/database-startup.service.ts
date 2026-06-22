import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import {
  formatDatabaseHealthError,
  runDatabaseHealthChecks,
} from './config/validate-database';

@Injectable()
export class DatabaseStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseStartupService.name);

  constructor(private readonly entityManager: EntityManager) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.SKIP_DATABASE_VALIDATION === 'true') {
      this.logger.warn('Database validation skipped (SKIP_DATABASE_VALIDATION=true)');
      return;
    }
    const result = await runDatabaseHealthChecks(this.entityManager);
    if (result.status === 'ok') {
      this.logger.log('Database validation passed');
      return;
    }
    const details = formatDatabaseHealthError(result);
    throw new Error(
      `Database validation failed: ${details}. ` +
        'Check Railway → DATABASE_URL (Supabase session pooler :5432) and run migrations.',
    );
  }
}
