import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { Worker } from 'bullmq';
import type { IntegrationJobPayload } from './integration-job.types';
import { INTEGRATIONS_QUEUE_NAME } from './integration-job.types';
import { IntegrationDeliveryService } from './integration-delivery.service';
import { isBackgroundWorkerEnabled } from '../../config/worker-env';
import { IntegrationPayloadService } from './integration-payload.service';
import { ProjectIntegration } from './entities/project-integration.entity';

type RedisConnectionOptions = {
  readonly url: string;
  readonly maxRetriesPerRequest: null;
};

@Injectable()
export class IntegrationProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationProcessorService.name);
  private worker: Worker<IntegrationJobPayload> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    private readonly integrationPayloadService: IntegrationPayloadService,
    private readonly integrationDeliveryService: IntegrationDeliveryService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundWorkerEnabled(this.configService, 'INTEGRATIONS_WORKER_ENABLED')) {
      return;
    }
    const connection = this.buildConnection();
    if (!connection) {
      this.logger.warn('REDIS_URL missing; integrations worker disabled');
      return;
    }
    try {
      this.worker = new Worker<IntegrationJobPayload>(
        INTEGRATIONS_QUEUE_NAME,
        async (job) => this.processJob(job.data),
        { connection },
      );
      this.worker.on('failed', (job, error) => {
        this.logger.warn(
          `Integration job ${job?.id ?? 'unknown'} failed: ${error.message}`,
        );
      });
      this.logger.log('Integrations worker started');
    } catch (error) {
      this.logger.warn(
        `Integrations worker unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async processJob(payload: IntegrationJobPayload): Promise<void> {
    const em = this.entityManager.fork();
    const integrations = await em.find(ProjectIntegration, {
      workspace: payload.workspaceId,
      project: payload.projectId,
      isActive: true,
    });
    if (integrations.length === 0) {
      return;
    }
    const event = this.integrationPayloadService.buildEventPayload(payload);
    for (const integration of integrations) {
      if (!integration.events.includes(payload.eventType)) {
        continue;
      }
      await this.integrationDeliveryService.deliverIntegration(integration, event);
    }
  }

  private buildConnection(): RedisConnectionOptions | null {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null;
    }
    return { url: redisUrl, maxRetriesPerRequest: null };
  }
}
