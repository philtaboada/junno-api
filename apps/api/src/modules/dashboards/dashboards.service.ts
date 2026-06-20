import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CustomFieldBreakdownWidgetDataDto,
  CustomFieldSettingsDto,
  DashboardDetailDto,
  DashboardSummaryDto,
  DashboardWidgetConfigDto,
  DashboardWidgetDataDto,
  DashboardWidgetDto,
  OverdueCountWidgetDataDto,
  TasksByAssigneeWidgetDataDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldValue } from '../projects/entities/custom-field-value.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { Team } from '../teams/entities/team.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  CreateDashboardWidgetDto,
  UpdateDashboardDto,
  UpdateDashboardWidgetDto,
} from './dto/dashboard.dto';
import { DashboardWidget, DashboardWidgetType } from './entities/dashboard-widget.entity';
import { Dashboard } from './entities/dashboard.entity';

type WidgetScope = {
  readonly projectId?: string;
  readonly customFieldDefinitionId?: string;
};

@Injectable()
export class DashboardsService {
  constructor(private readonly entityManager: EntityManager) {}

  async getOrCreateForScope(
    context: WorkspaceContext,
    teamId?: string,
  ): Promise<DashboardDetailDto> {
    const dashboard = await this.findOrCreateDashboard(context, teamId);
    return this.buildDashboardDetail(dashboard);
  }

  async updateDashboard(
    context: WorkspaceContext,
    dashboardId: string,
    updateDashboardDto: UpdateDashboardDto,
  ): Promise<DashboardDetailDto> {
    const dashboard = await this.findDashboardInWorkspace(context.workspace.id, dashboardId);
    if (updateDashboardDto.name !== undefined) {
      dashboard.name = updateDashboardDto.name.trim();
    }
    await this.entityManager.flush();
    return this.buildDashboardDetail(dashboard);
  }

  async addWidget(
    context: WorkspaceContext,
    dashboardId: string,
    createDashboardWidgetDto: CreateDashboardWidgetDto,
  ): Promise<DashboardDetailDto> {
    const dashboard = await this.findDashboardInWorkspace(context.workspace.id, dashboardId);
    this.assertValidWidgetConfig(
      createDashboardWidgetDto.type,
      createDashboardWidgetDto.config ?? {},
    );
    if (createDashboardWidgetDto.type === DashboardWidgetType.CUSTOM_FIELD_BREAKDOWN) {
      await this.assertCustomFieldWidgetConfig(
        context.workspace.id,
        dashboard.team?.id ?? null,
        createDashboardWidgetDto.config ?? {},
      );
    }
    const lastWidget = await this.entityManager.findOne(
      DashboardWidget,
      { dashboard: dashboard.id },
      { orderBy: { position: 'DESC' } },
    );
    const widget = this.entityManager.create(DashboardWidget, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      dashboard: this.entityManager.getReference(Dashboard, dashboard.id),
      type: createDashboardWidgetDto.type,
      title: createDashboardWidgetDto.title.trim(),
      config: createDashboardWidgetDto.config ?? {},
      position: createDashboardWidgetDto.position ?? (lastWidget?.position ?? -1) + 1,
    });
    await this.entityManager.flush();
    return this.buildDashboardDetail(dashboard);
  }

  async updateWidget(
    context: WorkspaceContext,
    dashboardId: string,
    widgetId: string,
    updateDashboardWidgetDto: UpdateDashboardWidgetDto,
  ): Promise<DashboardDetailDto> {
    const dashboard = await this.findDashboardInWorkspace(context.workspace.id, dashboardId);
    const widget = await this.findWidgetInDashboard(dashboard.id, widgetId);
    if (updateDashboardWidgetDto.title !== undefined) {
      widget.title = updateDashboardWidgetDto.title.trim();
    }
    if (updateDashboardWidgetDto.position !== undefined) {
      widget.position = updateDashboardWidgetDto.position;
    }
    if (updateDashboardWidgetDto.config !== undefined) {
      this.assertValidWidgetConfig(widget.type, updateDashboardWidgetDto.config);
      if (widget.type === DashboardWidgetType.CUSTOM_FIELD_BREAKDOWN) {
        await this.assertCustomFieldWidgetConfig(
          context.workspace.id,
          dashboard.team?.id ?? null,
          updateDashboardWidgetDto.config,
        );
      }
      widget.config = updateDashboardWidgetDto.config;
    }
    await this.entityManager.flush();
    return this.buildDashboardDetail(dashboard);
  }

  async removeWidget(
    context: WorkspaceContext,
    dashboardId: string,
    widgetId: string,
  ): Promise<DashboardDetailDto> {
    const dashboard = await this.findDashboardInWorkspace(context.workspace.id, dashboardId);
    const widget = await this.findWidgetInDashboard(dashboard.id, widgetId);
    await this.entityManager.remove(widget);
    await this.entityManager.flush();
    return this.buildDashboardDetail(dashboard);
  }

  private async findOrCreateDashboard(
    context: WorkspaceContext,
    teamId?: string,
  ): Promise<Dashboard> {
    if (teamId) {
      const team = await this.entityManager.findOne(Team, {
        id: teamId,
        workspace: context.workspace.id,
      });
      if (!team) {
        throw new NotFoundException('Equipo no encontrado');
      }
    }
    const existing = await this.entityManager.findOne(
      Dashboard,
      teamId
        ? { workspace: context.workspace.id, team: teamId }
        : { workspace: context.workspace.id, team: null },
      { populate: ['team'] },
    );
    if (existing) {
      return existing;
    }
    const dashboard = this.entityManager.create(Dashboard, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      team: teamId ? this.entityManager.getReference(Team, teamId) : null,
      name: teamId ? 'Dashboard del equipo' : 'Dashboard del workspace',
      createdBy: this.entityManager.getReference(User, context.user.id),
    });
    this.entityManager.create(DashboardWidget, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      dashboard,
      type: DashboardWidgetType.OVERDUE_COUNT,
      title: 'Tareas vencidas',
      position: 0,
      config: {},
    });
    this.entityManager.create(DashboardWidget, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      dashboard,
      type: DashboardWidgetType.TASKS_BY_ASSIGNEE,
      title: 'Tareas por asignado',
      position: 1,
      config: {},
    });
    await this.entityManager.flush();
    await this.entityManager.populate(dashboard, ['team']);
    return dashboard;
  }

  private async findDashboardInWorkspace(
    workspaceId: string,
    dashboardId: string,
  ): Promise<Dashboard> {
    const dashboard = await this.entityManager.findOne(
      Dashboard,
      { id: dashboardId, workspace: workspaceId },
      { populate: ['team'] },
    );
    if (!dashboard) {
      throw new NotFoundException('Dashboard no encontrado');
    }
    return dashboard;
  }

  private async findWidgetInDashboard(
    dashboardId: string,
    widgetId: string,
  ): Promise<DashboardWidget> {
    const widget = await this.entityManager.findOne(DashboardWidget, {
      id: widgetId,
      dashboard: dashboardId,
    });
    if (!widget) {
      throw new NotFoundException('Widget no encontrado');
    }
    return widget;
  }

  private async buildDashboardDetail(dashboard: Dashboard): Promise<DashboardDetailDto> {
    const widgets = await this.entityManager.find(
      DashboardWidget,
      { dashboard: dashboard.id },
      { orderBy: { position: 'ASC' } },
    );
    const widgetDtos: DashboardWidgetDto[] = [];
    for (const widget of widgets) {
      widgetDtos.push(await this.buildWidgetDto(widget, dashboard));
    }
    return {
      ...(await this.buildDashboardSummary(dashboard, widgets.length)),
      widgets: widgetDtos,
    };
  }

  private async buildDashboardSummary(
    dashboard: Dashboard,
    widgetCount: number,
  ): Promise<DashboardSummaryDto> {
    return {
      id: dashboard.id,
      name: dashboard.name,
      teamId: dashboard.team?.id ?? null,
      teamName: dashboard.team?.name ?? null,
      widgetCount,
      createdAt: dashboard.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private async buildWidgetDto(
    widget: DashboardWidget,
    dashboard: Dashboard,
  ): Promise<DashboardWidgetDto> {
    const scope = this.parseWidgetScope(widget.config);
    const tasks = await this.loadOpenTasksForScope(
      dashboard.workspace.id,
      dashboard.team?.id ?? null,
      scope.projectId,
    );
    const data = await this.computeWidgetData(widget, tasks, scope);
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config as DashboardWidgetConfigDto,
      position: widget.position,
      data,
    };
  }

  private async computeWidgetData(
    widget: DashboardWidget,
    tasks: Task[],
    scope: WidgetScope,
  ): Promise<DashboardWidgetDataDto> {
    switch (widget.type) {
      case DashboardWidgetType.OVERDUE_COUNT:
        return this.buildOverdueCountData(tasks);
      case DashboardWidgetType.TASKS_BY_ASSIGNEE:
        return this.buildTasksByAssigneeData(tasks);
      case DashboardWidgetType.CUSTOM_FIELD_BREAKDOWN:
        return this.buildCustomFieldBreakdownData(tasks, scope.customFieldDefinitionId!);
      default:
        throw new BadRequestException('Tipo de widget no soportado');
    }
  }

  private buildOverdueCountData(tasks: Task[]): OverdueCountWidgetDataDto {
    const startOfToday = this.startOfUtcDay(new Date());
    const overdueCount = tasks.filter((task) => {
      if (!task.dueAt || task.completedAt) {
        return false;
      }
      return task.dueAt < startOfToday;
    }).length;
    return {
      type: 'overdue_count',
      overdueCount,
      openTasksCount: tasks.length,
    };
  }

  private buildTasksByAssigneeData(tasks: Task[]): TasksByAssigneeWidgetDataDto {
    const counts = new Map<string, { assigneeId: string | null; assigneeName: string; count: number }>();
    for (const task of tasks) {
      const key = task.assignee?.id ?? '__unassigned__';
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      counts.set(key, {
        assigneeId: task.assignee?.id ?? null,
        assigneeName: task.assignee?.name ?? 'Sin asignar',
        count: 1,
      });
    }
    const items = [...counts.values()].sort((left, right) => right.count - left.count);
    return {
      type: 'tasks_by_assignee',
      items,
      totalOpenTasks: tasks.length,
    };
  }

  private async buildCustomFieldBreakdownData(
    tasks: Task[],
    customFieldDefinitionId: string,
  ): Promise<CustomFieldBreakdownWidgetDataDto> {
    const fieldDefinition = await this.entityManager.findOne(CustomFieldDefinition, {
      id: customFieldDefinitionId,
    });
    if (!fieldDefinition) {
      throw new NotFoundException('Campo personalizado no encontrado');
    }
    const taskIds = tasks.map((task) => task.id);
    const values =
      taskIds.length === 0
        ? []
        : await this.entityManager.find(CustomFieldValue, {
            task: { $in: taskIds },
            fieldDefinition: customFieldDefinitionId,
          });
    const settings = fieldDefinition.settings as CustomFieldSettingsDto;
    const optionLabelById = new Map(
      (settings.options ?? []).map((option) => [option.id, option.label]),
    );
    const counts = new Map<string, { key: string; label: string; count: number }>();
    for (const value of values) {
      const rawValue = value.value as Record<string, unknown>;
      if (fieldDefinition.type === 'select') {
        const optionId =
          typeof rawValue.optionId === 'string' ? rawValue.optionId : '__empty__';
        const label =
          optionId === '__empty__'
            ? 'Sin valor'
            : (optionLabelById.get(optionId) ?? 'Opción desconocida');
        this.incrementBreakdownCount(counts, optionId, label);
        continue;
      }
      if (fieldDefinition.type === 'multiselect') {
        const optionIds = Array.isArray(rawValue.optionIds)
          ? rawValue.optionIds.filter((item): item is string => typeof item === 'string')
          : [];
        if (optionIds.length === 0) {
          this.incrementBreakdownCount(counts, '__empty__', 'Sin valor');
          continue;
        }
        for (const optionId of optionIds) {
          const label = optionLabelById.get(optionId) ?? 'Opción desconocida';
          this.incrementBreakdownCount(counts, optionId, label);
        }
      }
    }
    const items = [...counts.values()].sort((left, right) => right.count - left.count);
    return {
      type: 'custom_field_breakdown',
      fieldName: fieldDefinition.name,
      items,
      totalTasks: tasks.length,
    };
  }

  private incrementBreakdownCount(
    counts: Map<string, { key: string; label: string; count: number }>,
    key: string,
    label: string,
  ): void {
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    counts.set(key, { key, label, count: 1 });
  }

  private async loadOpenTasksForScope(
    workspaceId: string,
    teamId: string | null,
    projectId?: string,
  ): Promise<Task[]> {
    if (projectId) {
      const memberships = await this.entityManager.find(
        TaskMembership,
        { workspace: workspaceId, project: projectId },
        { populate: ['task', 'task.assignee'] },
      );
      return this.deduplicateOpenTasks(memberships.map((membership) => membership.task));
    }
    if (teamId) {
      const projects = await this.entityManager.find(Project, {
        workspace: workspaceId,
        team: teamId,
      });
      const projectIds = projects.map((project) => project.id);
      if (projectIds.length === 0) {
        return [];
      }
      const memberships = await this.entityManager.find(
        TaskMembership,
        { workspace: workspaceId, project: { $in: projectIds } },
        { populate: ['task', 'task.assignee'] },
      );
      return this.deduplicateOpenTasks(memberships.map((membership) => membership.task));
    }
    return this.entityManager.find(
      Task,
      { workspace: workspaceId, completedAt: null },
      { populate: ['assignee'] },
    );
  }

  private deduplicateOpenTasks(tasks: Task[]): Task[] {
    const uniqueTasks = new Map<string, Task>();
    for (const task of tasks) {
      if (task.completedAt !== null) {
        continue;
      }
      uniqueTasks.set(task.id, task);
    }
    return [...uniqueTasks.values()];
  }

  private parseWidgetScope(config: Record<string, unknown>): WidgetScope {
    return {
      projectId: typeof config.projectId === 'string' ? config.projectId : undefined,
      customFieldDefinitionId:
        typeof config.customFieldDefinitionId === 'string'
          ? config.customFieldDefinitionId
          : undefined,
    };
  }

  private assertValidWidgetConfig(
    type: DashboardWidgetType,
    config: Record<string, unknown>,
  ): void {
    if (type !== DashboardWidgetType.CUSTOM_FIELD_BREAKDOWN) {
      return;
    }
    if (typeof config.customFieldDefinitionId !== 'string') {
      throw new BadRequestException('customFieldDefinitionId es obligatorio');
    }
  }

  private async assertCustomFieldWidgetConfig(
    workspaceId: string,
    teamId: string | null,
    config: Record<string, unknown>,
  ): Promise<void> {
    const customFieldDefinitionId =
      typeof config.customFieldDefinitionId === 'string'
        ? config.customFieldDefinitionId
        : null;
    if (!customFieldDefinitionId) {
      throw new BadRequestException('customFieldDefinitionId es obligatorio');
    }
    const fieldDefinition = await this.entityManager.findOne(CustomFieldDefinition, {
      id: customFieldDefinitionId,
      workspace: workspaceId,
    });
    if (!fieldDefinition) {
      throw new NotFoundException('Campo personalizado no encontrado');
    }
    if (fieldDefinition.type !== 'select' && fieldDefinition.type !== 'multiselect') {
      throw new BadRequestException('Solo campos select o multiselect admiten breakdown');
    }
    const projectId = typeof config.projectId === 'string' ? config.projectId : undefined;
    if (projectId && fieldDefinition.project.id !== projectId) {
      throw new BadRequestException('El campo no pertenece al proyecto indicado');
    }
    if (teamId) {
      const project = await this.entityManager.findOne(Project, {
        id: fieldDefinition.project.id,
        workspace: workspaceId,
        team: teamId,
      });
      if (!project) {
        throw new BadRequestException('El campo no pertenece a un proyecto del equipo');
      }
    }
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}
