import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { AutomationJobPayload } from './automation-job.types';
import { AUTOMATION_QUEUE_NAME } from './automation.constants';

type RedisConnectionOptions = {
  readonly url: string;
  readonly maxRetriesPerRequest: null;
};

@Injectable()
export class AutomationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(AutomationQueueService.name);
  private queue: Queue<AutomationJobPayload> | null = null;

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    return this.queue !== null;
  }

  async enqueue(payload: AutomationJobPayload): Promise<void> {
    const queue = await this.getQueue();
    if (!queue) {
      this.logger.warn('Automation queue unavailable; skipping job');
      return;
    }
    await queue.add('evaluate-rules', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  private async getQueue(): Promise<Queue<AutomationJobPayload> | null> {
    if (this.queue) {
      return this.queue;
    }
    const connection = this.buildConnection();
    if (!connection) {
      return null;
    }
    try {
      this.queue = new Queue<AutomationJobPayload>(AUTOMATION_QUEUE_NAME, {
        connection,
      });
      return this.queue;
    } catch (error) {
      this.logger.warn(
        `Automation queue unavailable: ${error instanceof Error ? error.message : String(error)}`,
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
