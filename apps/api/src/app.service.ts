import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import {
  formatDatabaseHealthError,
  runDatabaseHealthChecks,
  type DatabaseHealthResult,
} from './config/validate-database';

@Injectable()
export class AppService {
  constructor(private readonly entityManager: EntityManager) {}

  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  async getDbHealth(): Promise<DatabaseHealthResult> {
    const result = await runDatabaseHealthChecks(this.entityManager);
    if (result.status === 'error') {
      return {
        ...result,
        checks: [
          ...result.checks,
          {
            name: 'summary',
            status: 'error',
            message: formatDatabaseHealthError(result),
          },
        ],
      };
    }
    return result;
  }
}
