import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  GoalCustomFieldRollupMetricConfigDto,
  GoalMetricSnapshotDto,
  GoalStatus,
  GoalSummaryDto,
  PortfolioDetailDto,
  PortfolioProjectDto,
  PortfolioSummaryDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldValue } from '../projects/entities/custom-field-value.entity';
import {
  Project,
  ProjectColor,
} from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { GoalMetricSnapshot } from './entities/goal-metric-snapshot.entity';
import { Goal, GoalMetricType } from './entities/goal.entity';
import { PortfolioProject } from './entities/portfolio-project.entity';
import { Portfolio } from './entities/portfolio.entity';
import {
  AddPortfolioProjectDto,
  CreatePortfolioDto,
  UpdatePortfolioDto,
} from './dto/portfolio.dto';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

type GoalMetricContext = {
  readonly workspaceId: string;
  readonly portfolioId: string;
  readonly metricType: GoalMetricType;
  readonly metricConfig: Record<string, unknown>;
};

@Injectable()
export class PortfoliosService {
  constructor(private readonly entityManager: EntityManager) {}

  async listForWorkspace(workspaceId: string): Promise<PortfolioSummaryDto[]> {
    const portfolios = await this.entityManager.find(
      Portfolio,
      { workspace: workspaceId },
      { orderBy: { createdAt: 'DESC' } },
    );
    const summaries: PortfolioSummaryDto[] = [];
    for (const portfolio of portfolios) {
      summaries.push(await this.buildPortfolioSummary(portfolio));
    }
    return summaries;
  }

  async getForWorkspace(
    workspaceId: string,
    portfolioId: string,
  ): Promise<PortfolioDetailDto> {
    const portfolio = await this.findPortfolioInWorkspace(workspaceId, portfolioId);
    const summary = await this.buildPortfolioSummary(portfolio);
    const portfolioProjects = await this.entityManager.find(
      PortfolioProject,
      { portfolio: portfolio.id },
      {
        populate: ['project'],
        orderBy: { position: 'ASC' },
      },
    );
    const goals = await this.entityManager.find(
      Goal,
      { portfolio: portfolio.id },
      { orderBy: { createdAt: 'DESC' } },
    );
    const goalSummaries: GoalSummaryDto[] = [];
    for (const goal of goals) {
      goalSummaries.push(await this.buildGoalSummary(goal));
    }
    return {
      ...summary,
      projects: portfolioProjects.map((item) => this.mapPortfolioProject(item)),
      goals: goalSummaries,
    };
  }

  async create(
    context: WorkspaceContext,
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<PortfolioDetailDto> {
    const portfolio = this.entityManager.create(Portfolio, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      name: createPortfolioDto.name.trim(),
      description: createPortfolioDto.description?.trim() ?? null,
      color: (createPortfolioDto.color as ProjectColor | undefined) ?? null,
      createdBy: this.entityManager.getReference(User, context.user.id),
    });
    await this.entityManager.flush();
    return this.getForWorkspace(context.workspace.id, portfolio.id);
  }

  async update(
    context: WorkspaceContext,
    portfolioId: string,
    updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<PortfolioDetailDto> {
    const portfolio = await this.findPortfolioInWorkspace(
      context.workspace.id,
      portfolioId,
    );
    if (updatePortfolioDto.name !== undefined) {
      portfolio.name = updatePortfolioDto.name.trim();
    }
    if (updatePortfolioDto.description !== undefined) {
      portfolio.description = updatePortfolioDto.description?.trim() ?? null;
    }
    if (updatePortfolioDto.color !== undefined) {
      portfolio.color = updatePortfolioDto.color as ProjectColor | null;
    }
    await this.entityManager.flush();
    return this.getForWorkspace(context.workspace.id, portfolio.id);
  }

  async remove(context: WorkspaceContext, portfolioId: string): Promise<void> {
    const portfolio = await this.findPortfolioInWorkspace(
      context.workspace.id,
      portfolioId,
    );
    await this.entityManager.remove(portfolio);
    await this.entityManager.flush();
  }

  async addProject(
    context: WorkspaceContext,
    portfolioId: string,
    addPortfolioProjectDto: AddPortfolioProjectDto,
  ): Promise<PortfolioDetailDto> {
    const portfolio = await this.findPortfolioInWorkspace(
      context.workspace.id,
      portfolioId,
    );
    const project = await this.entityManager.findOne(Project, {
      id: addPortfolioProjectDto.projectId,
      workspace: context.workspace.id,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    const existing = await this.entityManager.findOne(PortfolioProject, {
      portfolio: portfolio.id,
      project: project.id,
    });
    if (existing) {
      throw new BadRequestException('El proyecto ya está en el portfolio');
    }
    const lastItem = await this.entityManager.findOne(
      PortfolioProject,
      { portfolio: portfolio.id },
      { orderBy: { position: 'DESC' } },
    );
    const portfolioProject = this.entityManager.create(PortfolioProject, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      portfolio: this.entityManager.getReference(Portfolio, portfolio.id),
      project: this.entityManager.getReference(Project, project.id),
      position: (lastItem?.position ?? 0) + 1,
    });
    await this.entityManager.flush();
    return this.getForWorkspace(context.workspace.id, portfolio.id);
  }

  async removeProject(
    context: WorkspaceContext,
    portfolioId: string,
    projectId: string,
  ): Promise<PortfolioDetailDto> {
    const portfolio = await this.findPortfolioInWorkspace(
      context.workspace.id,
      portfolioId,
    );
    const portfolioProject = await this.entityManager.findOne(PortfolioProject, {
      portfolio: portfolio.id,
      project: projectId,
    });
    if (!portfolioProject) {
      throw new NotFoundException('Proyecto no encontrado en el portfolio');
    }
    await this.entityManager.remove(portfolioProject);
    await this.entityManager.flush();
    return this.getForWorkspace(context.workspace.id, portfolio.id);
  }

  async listGoals(
    workspaceId: string,
    portfolioId: string,
  ): Promise<GoalSummaryDto[]> {
    await this.findPortfolioInWorkspace(workspaceId, portfolioId);
    const goals = await this.entityManager.find(
      Goal,
      { portfolio: portfolioId },
      { orderBy: { createdAt: 'DESC' } },
    );
    const summaries: GoalSummaryDto[] = [];
    for (const goal of goals) {
      summaries.push(await this.buildGoalSummary(goal));
    }
    return summaries;
  }

  async createGoal(
    context: WorkspaceContext,
    portfolioId: string,
    createGoalDto: CreateGoalDto,
  ): Promise<GoalSummaryDto> {
    const portfolio = await this.findPortfolioInWorkspace(
      context.workspace.id,
      portfolioId,
    );
    this.assertValidGoalInput(createGoalDto.metricType, createGoalDto.metricConfig);
    if (createGoalDto.metricType === GoalMetricType.CUSTOM_FIELD_ROLLUP) {
      await this.assertCustomFieldMetricConfig(
        context.workspace.id,
        portfolioId,
        createGoalDto.metricConfig!,
      );
    }
    const goal = this.entityManager.create(Goal, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      portfolio: this.entityManager.getReference(Portfolio, portfolio.id),
      name: createGoalDto.name.trim(),
      description: createGoalDto.description?.trim() ?? null,
      metricType: createGoalDto.metricType,
      metricConfig: this.serializeMetricConfig(createGoalDto.metricConfig),
      targetValue: this.resolveTargetValue(
        createGoalDto.metricType,
        createGoalDto.targetValue,
      ),
      dueAt: createGoalDto.dueAt ? new Date(createGoalDto.dueAt) : null,
      createdBy: this.entityManager.getReference(User, context.user.id),
    });
    await this.entityManager.flush();
    return this.buildGoalSummary(goal);
  }

  async getGoal(workspaceId: string, goalId: string): Promise<GoalSummaryDto & {
    metricConfig: GoalCustomFieldRollupMetricConfigDto | null;
    snapshots: GoalMetricSnapshotDto[];
  }> {
    const goal = await this.findGoalInWorkspace(workspaceId, goalId);
    const summary = await this.buildGoalSummary(goal);
    const snapshots = await this.entityManager.find(
      GoalMetricSnapshot,
      { goal: goal.id },
      { orderBy: { recordedAt: 'DESC' }, limit: 30 },
    );
    return {
      ...summary,
      metricConfig: this.parseMetricConfig(goal),
      snapshots: snapshots.map((snapshot) => this.mapSnapshot(snapshot)),
    };
  }

  async updateGoal(
    context: WorkspaceContext,
    goalId: string,
    updateGoalDto: UpdateGoalDto,
  ): Promise<GoalSummaryDto> {
    const goal = await this.findGoalInWorkspace(context.workspace.id, goalId);
    if (updateGoalDto.name !== undefined) {
      goal.name = updateGoalDto.name.trim();
    }
    if (updateGoalDto.description !== undefined) {
      goal.description = updateGoalDto.description?.trim() ?? null;
    }
    if (updateGoalDto.targetValue !== undefined) {
      goal.targetValue = updateGoalDto.targetValue;
    }
    if (updateGoalDto.dueAt !== undefined) {
      goal.dueAt = updateGoalDto.dueAt ? new Date(updateGoalDto.dueAt) : null;
    }
    if (updateGoalDto.metricConfig !== undefined) {
      if (goal.metricType !== GoalMetricType.CUSTOM_FIELD_ROLLUP) {
        throw new BadRequestException('Este goal no admite metricConfig');
      }
      if (updateGoalDto.metricConfig) {
        await this.assertCustomFieldMetricConfig(
          context.workspace.id,
          goal.portfolio.id,
          updateGoalDto.metricConfig,
        );
      }
      goal.metricConfig = this.serializeMetricConfig(updateGoalDto.metricConfig);
    }
    await this.entityManager.flush();
    return this.buildGoalSummary(goal);
  }

  async removeGoal(context: WorkspaceContext, goalId: string): Promise<void> {
    const goal = await this.findGoalInWorkspace(context.workspace.id, goalId);
    await this.entityManager.remove(goal);
    await this.entityManager.flush();
  }

  async recordGoalSnapshot(
    context: WorkspaceContext,
    goalId: string,
  ): Promise<GoalMetricSnapshotDto> {
    const goal = await this.findGoalInWorkspace(context.workspace.id, goalId);
    const currentValue = await this.computeGoalMetric({
      workspaceId: context.workspace.id,
      portfolioId: goal.portfolio.id,
      metricType: goal.metricType,
      metricConfig: goal.metricConfig,
    });
    const snapshot = this.entityManager.create(GoalMetricSnapshot, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      goal: this.entityManager.getReference(Goal, goal.id),
      value: currentValue,
    });
    await this.entityManager.flush();
    return this.mapSnapshot(snapshot);
  }

  async listGoalSnapshots(
    workspaceId: string,
    goalId: string,
  ): Promise<GoalMetricSnapshotDto[]> {
    await this.findGoalInWorkspace(workspaceId, goalId);
    const snapshots = await this.entityManager.find(
      GoalMetricSnapshot,
      { goal: goalId },
      { orderBy: { recordedAt: 'DESC' }, limit: 90 },
    );
    return snapshots.map((snapshot) => this.mapSnapshot(snapshot));
  }

  private async findPortfolioInWorkspace(
    workspaceId: string,
    portfolioId: string,
  ): Promise<Portfolio> {
    const portfolio = await this.entityManager.findOne(Portfolio, {
      id: portfolioId,
      workspace: workspaceId,
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio no encontrado');
    }
    return portfolio;
  }

  private async findGoalInWorkspace(
    workspaceId: string,
    goalId: string,
  ): Promise<Goal> {
    const goal = await this.entityManager.findOne(
      Goal,
      { id: goalId, workspace: workspaceId },
      { populate: ['portfolio'] },
    );
    if (!goal) {
      throw new NotFoundException('Goal no encontrado');
    }
    return goal;
  }

  private async buildPortfolioSummary(portfolio: Portfolio): Promise<PortfolioSummaryDto> {
    const projectCount = await this.entityManager.count(PortfolioProject, {
      portfolio: portfolio.id,
    });
    const goalCount = await this.entityManager.count(Goal, {
      portfolio: portfolio.id,
    });
    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      color: portfolio.color,
      projectCount,
      goalCount,
      createdAt: portfolio.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private mapPortfolioProject(item: PortfolioProject): PortfolioProjectDto {
    return {
      id: item.id,
      projectId: item.project.id,
      projectName: item.project.name,
      projectColor: item.project.color,
      projectStatus: item.project.status,
      position: item.position,
    };
  }

  private async buildGoalSummary(goal: Goal): Promise<GoalSummaryDto> {
    const currentValue = await this.computeGoalMetric({
      workspaceId: goal.workspace.id,
      portfolioId: goal.portfolio.id,
      metricType: goal.metricType,
      metricConfig: goal.metricConfig,
    });
    const targetValue = this.resolveTargetValue(goal.metricType, goal.targetValue);
    const progressPercent = this.computeProgressPercent(currentValue, targetValue);
    return {
      id: goal.id,
      portfolioId: goal.portfolio.id,
      name: goal.name,
      description: goal.description,
      metricType: goal.metricType,
      targetValue: goal.targetValue,
      currentValue,
      progressPercent,
      status: this.computeGoalStatus(currentValue, targetValue),
      dueAt: goal.dueAt?.toISOString() ?? null,
      createdAt: goal.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private mapSnapshot(snapshot: GoalMetricSnapshot): GoalMetricSnapshotDto {
    return {
      id: snapshot.id,
      value: snapshot.value,
      recordedAt: snapshot.recordedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private parseMetricConfig(
    goal: Goal,
  ): GoalCustomFieldRollupMetricConfigDto | null {
    if (goal.metricType !== GoalMetricType.CUSTOM_FIELD_ROLLUP) {
      return null;
    }
    const config = goal.metricConfig;
    const customFieldDefinitionId =
      typeof config.customFieldDefinitionId === 'string'
        ? config.customFieldDefinitionId
        : '';
    const aggregation =
      config.aggregation === 'avg' || config.aggregation === 'sum'
        ? config.aggregation
        : 'sum';
    if (!customFieldDefinitionId) {
      return null;
    }
    return { customFieldDefinitionId, aggregation };
  }

  private serializeMetricConfig(
    metricConfig?: GoalCustomFieldRollupMetricConfigDto | null,
  ): Record<string, unknown> {
    if (!metricConfig) {
      return {};
    }
    return {
      customFieldDefinitionId: metricConfig.customFieldDefinitionId,
      aggregation: metricConfig.aggregation,
    };
  }

  private assertValidGoalInput(
    metricType: GoalMetricType,
    metricConfig?: GoalCustomFieldRollupMetricConfigDto,
  ): void {
    if (metricType === GoalMetricType.CUSTOM_FIELD_ROLLUP && !metricConfig) {
      throw new BadRequestException(
        'metricConfig es obligatorio para custom_field_rollup',
      );
    }
  }

  private async assertCustomFieldMetricConfig(
    workspaceId: string,
    portfolioId: string,
    metricConfig: GoalCustomFieldRollupMetricConfigDto,
  ): Promise<void> {
    const fieldDefinition = await this.entityManager.findOne(CustomFieldDefinition, {
      id: metricConfig.customFieldDefinitionId,
      workspace: workspaceId,
    });
    if (!fieldDefinition) {
      throw new NotFoundException('Campo personalizado no encontrado');
    }
    if (fieldDefinition.type !== 'number') {
      throw new BadRequestException('Solo campos numéricos admiten rollup');
    }
    const portfolioProject = await this.entityManager.findOne(PortfolioProject, {
      portfolio: portfolioId,
      project: fieldDefinition.project.id,
    });
    if (!portfolioProject) {
      throw new BadRequestException(
        'El campo pertenece a un proyecto que no está en el portfolio',
      );
    }
  }

  private resolveTargetValue(
    metricType: GoalMetricType,
    targetValue?: number | null,
  ): number {
    if (metricType === GoalMetricType.TASKS_COMPLETION_PERCENT) {
      return targetValue ?? 100;
    }
    return targetValue && targetValue > 0 ? targetValue : 1;
  }

  private computeProgressPercent(currentValue: number, targetValue: number): number {
    if (targetValue <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((currentValue / targetValue) * 10000) / 100);
  }

  private computeGoalStatus(currentValue: number, targetValue: number): GoalStatus {
    const ratio = targetValue > 0 ? currentValue / targetValue : 0;
    if (ratio >= 1) {
      return 'achieved';
    }
    if (ratio >= 0.7) {
      return 'on_track';
    }
    if (ratio >= 0.4) {
      return 'at_risk';
    }
    return 'off_track';
  }

  private async computeGoalMetric(context: GoalMetricContext): Promise<number> {
    const tasks = await this.loadPortfolioTasks(context.portfolioId);
    if (context.metricType === GoalMetricType.TASKS_COMPLETION_PERCENT) {
      if (tasks.length === 0) {
        return 0;
      }
      const completedCount = tasks.filter((task) => task.completedAt !== null).length;
      return Math.round((completedCount / tasks.length) * 10000) / 100;
    }
    const metricConfig = context.metricConfig;
    const customFieldDefinitionId =
      typeof metricConfig.customFieldDefinitionId === 'string'
        ? metricConfig.customFieldDefinitionId
        : null;
    const aggregation = metricConfig.aggregation === 'avg' ? 'avg' : 'sum';
    if (!customFieldDefinitionId || tasks.length === 0) {
      return 0;
    }
    const values = await this.entityManager.find(CustomFieldValue, {
      task: { $in: tasks.map((task) => task.id) },
      fieldDefinition: customFieldDefinitionId,
    });
    const numbers = values
      .map((item) => {
        const rawValue = item.value as Record<string, unknown>;
        return typeof rawValue.number === 'number' ? rawValue.number : null;
      })
      .filter((value): value is number => value !== null);
    if (numbers.length === 0) {
      return 0;
    }
    if (aggregation === 'avg') {
      const total = numbers.reduce((sum, value) => sum + value, 0);
      return Math.round((total / numbers.length) * 100) / 100;
    }
    return Math.round(numbers.reduce((sum, value) => sum + value, 0) * 100) / 100;
  }

  private async loadPortfolioTasks(portfolioId: string): Promise<Task[]> {
    const portfolioProjects = await this.entityManager.find(PortfolioProject, {
      portfolio: portfolioId,
    });
    const projectIds = portfolioProjects.map((item) => item.project.id);
    if (projectIds.length === 0) {
      return [];
    }
    const memberships = await this.entityManager.find(
      TaskMembership,
      { project: { $in: projectIds } },
      { populate: ['task'] },
    );
    const uniqueTasks = new Map<string, Task>();
    for (const membership of memberships) {
      uniqueTasks.set(membership.task.id, membership.task);
    }
    return [...uniqueTasks.values()];
  }
}
