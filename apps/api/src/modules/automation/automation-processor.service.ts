import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { Worker } from 'bullmq';
import type { AutomationJobPayload } from './automation-job.types';
import { AUTOMATION_QUEUE_NAME } from './automation.constants';
import { AutomationExecutorService } from './automation-executor.service';
import { toEntityTriggerType } from './automation-config.utils';
import { AutomationRulesService } from './automation-rules.service';
import { isBackgroundWorkerEnabled } from '../../config/worker-env';
import { AutomationRun, AutomationRunStatus } from './entities/automation-run.entity';
import {
  AutomationRule,
  AutomationTriggerType as EntityAutomationTriggerType,
} from './entities/automation-rule.entity';
import { Task } from '../tasks/entities/task.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';

type RedisConnectionOptions = {
  readonly url: string;
  readonly maxRetriesPerRequest: null;
};

@Injectable()
export class AutomationProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationProcessorService.name);
  private worker: Worker<AutomationJobPayload> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    private readonly automationRulesService: AutomationRulesService,
    private readonly automationExecutorService: AutomationExecutorService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundWorkerEnabled(this.configService, 'AUTOMATION_WORKER_ENABLED')) {
      return;
    }
    const connection = this.buildConnection();
    if (!connection) {
      this.logger.warn('REDIS_URL missing; automation worker disabled');
      return;
    }
    try {
      this.worker = new Worker<AutomationJobPayload>(
        AUTOMATION_QUEUE_NAME,
        async (job) => this.processJob(job.data),
        { connection },
      );
      this.worker.on('failed', (job, error) => {
        this.logger.warn(
          `Automation job ${job?.id ?? 'unknown'} failed: ${error.message}`,
        );
      });
      this.logger.log('Automation worker started');
    } catch (error) {
      this.logger.warn(
        `Automation worker unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async processJob(payload: AutomationJobPayload): Promise<void> {
    const rules = await this.automationRulesService.findEnabledRulesForTrigger(
      payload.workspaceId,
      payload.projectId,
      toEntityTriggerType(payload.triggerType),
    );
    if (rules.length === 0) {
      return;
    }
    for (const rule of rules) {
      await this.runRule(rule, payload);
    }
  }

  private async runRule(
    rule: AutomationRule,
    payload: AutomationJobPayload,
  ): Promise<void> {
    const em = this.entityManager.fork();
    const workspace = em.getReference(Workspace, payload.workspaceId);
    const managedRule = await em.findOneOrFail(
      AutomationRule,
      rule.id,
      { populate: ['createdBy'] },
    );
    const task = await em.findOne(Task, {
      id: payload.taskId,
      workspace: payload.workspaceId,
    });
    const run = em.create(AutomationRun, {
      workspace,
      rule: managedRule,
      task: task ?? null,
      status: AutomationRunStatus.SUCCESS,
      triggerPayload: { ...payload },
      createdAt: new Date(),
    });
    await em.flush();
    try {
      await this.automationExecutorService.executeRule(em, managedRule, payload);
      run.status = AutomationRunStatus.SUCCESS;
      run.completedAt = new Date();
      await em.flush();
    } catch (error) {
      run.status = AutomationRunStatus.FAILED;
      run.errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      run.completedAt = new Date();
      await em.flush();
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
