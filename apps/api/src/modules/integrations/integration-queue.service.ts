import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { IntegrationJobPayload } from './integration-job.types';
import { INTEGRATIONS_QUEUE_NAME } from './integration-job.types';

type RedisConnectionOptions = {
  readonly url: string;
  readonly maxRetriesPerRequest: null;
};

@Injectable()
export class IntegrationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(IntegrationQueueService.name);
  private queue: Queue<IntegrationJobPayload> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async enqueue(payload: IntegrationJobPayload): Promise<void> {
    const queue = await this.getQueue();
    if (!queue) {
      this.logger.warn('Integrations queue unavailable; skipping job');
      return;
    }
    await queue.add('deliver-event', payload, {
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  private async getQueue(): Promise<Queue<IntegrationJobPayload> | null> {
    if (this.queue) {
      return this.queue;
    }
    const connection = this.buildConnection();
    if (!connection) {
      return null;
    }
    try {
      this.queue = new Queue<IntegrationJobPayload>(INTEGRATIONS_QUEUE_NAME, {
        connection,
      });
      return this.queue;
    } catch (error) {
      this.logger.warn(
        `Integrations queue unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
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
