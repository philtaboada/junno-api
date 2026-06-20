import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  AutomationRuleDto,
  AutomationRunDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  assertAutomationActionType,
  assertAutomationTriggerType,
  toEntityActionType,
  toEntityTriggerType,
  validateAutomationActionConfig,
} from './automation-config.utils';
import { AUTOMATION_RECENT_RUNS_LIMIT } from './automation.constants';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './dto/automation-rule.dto';
import {
  AutomationRule,
  AutomationTriggerType as EntityAutomationTriggerType,
} from './entities/automation-rule.entity';
import { AutomationRun } from './entities/automation-run.entity';

@Injectable()
export class AutomationRulesService {
  constructor(private readonly entityManager: EntityManager) {}

  async listForProject(
    context: WorkspaceContext,
    projectId: string,
  ): Promise<AutomationRuleDto[]> {
    await this.assertProjectMember(context.workspace.id, projectId, context.user.id);
    const rules = await this.entityManager.find(
      AutomationRule,
      { project: projectId, workspace: context.workspace.id },
      { orderBy: { createdAt: 'ASC' } },
    );
    return rules.map((rule) => this.toRuleDto(rule));
  }

  async listRecentRunsForProject(
    context: WorkspaceContext,
    projectId: string,
  ): Promise<AutomationRunDto[]> {
    await this.assertProjectMember(context.workspace.id, projectId, context.user.id);
    const runs = await this.entityManager.find(
      AutomationRun,
      {
        workspace: context.workspace.id,
        rule: { project: projectId },
      },
      {
        populate: ['rule'],
        orderBy: { createdAt: 'DESC' },
        limit: AUTOMATION_RECENT_RUNS_LIMIT,
      },
    );
    return runs.map((run) => this.toRunDto(run));
  }

  async createForProject(
    context: WorkspaceContext,
    projectId: string,
    createAutomationRuleDto: CreateAutomationRuleDto,
  ): Promise<AutomationRuleDto> {
    await this.assertProjectAdmin(context.workspace.id, projectId, context.user.id);
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    const triggerType = assertAutomationTriggerType(createAutomationRuleDto.triggerType);
    const actionType = assertAutomationActionType(createAutomationRuleDto.actionType);
    const actionConfig = validateAutomationActionConfig(
      actionType,
      createAutomationRuleDto.actionConfig,
    );
    const creator = await this.entityManager.findOneOrFail(User, {
      id: context.user.id,
    });
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const now = new Date();
    const rule = this.entityManager.create(AutomationRule, {
      workspace,
      project,
      name: createAutomationRuleDto.name.trim(),
      enabled: createAutomationRuleDto.enabled ?? true,
      triggerType: toEntityTriggerType(triggerType),
      triggerConfig: {},
      actionType: toEntityActionType(actionType),
      actionConfig,
      createdBy: creator,
      createdAt: now,
      updatedAt: now,
    });
    await this.entityManager.flush();
    return this.toRuleDto(rule);
  }

  async updateForProject(
    context: WorkspaceContext,
    projectId: string,
    ruleId: string,
    updateAutomationRuleDto: UpdateAutomationRuleDto,
  ): Promise<AutomationRuleDto> {
    await this.assertProjectAdmin(context.workspace.id, projectId, context.user.id);
    const rule = await this.findRuleInProject(
      context.workspace.id,
      projectId,
      ruleId,
    );
    if (updateAutomationRuleDto.name !== undefined) {
      rule.name = updateAutomationRuleDto.name.trim();
    }
    if (updateAutomationRuleDto.enabled !== undefined) {
      rule.enabled = updateAutomationRuleDto.enabled;
    }
    if (updateAutomationRuleDto.triggerType !== undefined) {
      rule.triggerType = toEntityTriggerType(
        assertAutomationTriggerType(updateAutomationRuleDto.triggerType),
      );
    }
    const nextActionType =
      updateAutomationRuleDto.actionType !== undefined
        ? assertAutomationActionType(updateAutomationRuleDto.actionType)
        : (rule.actionType as unknown as ReturnType<typeof assertAutomationActionType>);
    if (updateAutomationRuleDto.actionType !== undefined) {
      rule.actionType = toEntityActionType(nextActionType);
    }
    if (updateAutomationRuleDto.actionConfig !== undefined) {
      rule.actionConfig = validateAutomationActionConfig(
        nextActionType,
        updateAutomationRuleDto.actionConfig,
      );
    } else if (updateAutomationRuleDto.actionType !== undefined) {
      rule.actionConfig = validateAutomationActionConfig(
        nextActionType,
        rule.actionConfig,
      );
    }
    await this.entityManager.flush();
    return this.toRuleDto(rule);
  }

  async removeForProject(
    context: WorkspaceContext,
    projectId: string,
    ruleId: string,
  ): Promise<void> {
    await this.assertProjectAdmin(context.workspace.id, projectId, context.user.id);
    const rule = await this.findRuleInProject(
      context.workspace.id,
      projectId,
      ruleId,
    );
    this.entityManager.remove(rule);
    await this.entityManager.flush();
  }

  async findEnabledRulesForTrigger(
    workspaceId: string,
    projectId: string,
    triggerType: EntityAutomationTriggerType,
  ): Promise<AutomationRule[]> {
    return this.entityManager.find(
      AutomationRule,
      {
        workspace: workspaceId,
        project: projectId,
        enabled: true,
        triggerType,
      },
      { populate: ['createdBy', 'project'] },
    );
  }

  private async findRuleInProject(
    workspaceId: string,
    projectId: string,
    ruleId: string,
  ): Promise<AutomationRule> {
    const rule = await this.entityManager.findOne(AutomationRule, {
      id: ruleId,
      workspace: workspaceId,
      project: projectId,
    });
    if (!rule) {
      throw new NotFoundException('Regla no encontrada');
    }
    return rule;
  }

  private async findProjectInWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.entityManager.findOne(Project, {
      id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async assertProjectMember(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.entityManager.findOne(ProjectMember, {
      project: { id: projectId, workspace: workspaceId },
      user: userId,
    });
    if (!member) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  private async assertProjectAdmin(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.entityManager.findOne(ProjectMember, {
      project: { id: projectId, workspace: workspaceId },
      user: userId,
    });
    if (!member || member.role !== ProjectAccessRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores del proyecto pueden hacer esto');
    }
  }

  private toRuleDto(rule: AutomationRule): AutomationRuleDto {
    return {
      id: rule.id,
      projectId: rule.project.id,
      name: rule.name,
      enabled: rule.enabled,
      triggerType: rule.triggerType as AutomationRuleDto['triggerType'],
      triggerConfig: rule.triggerConfig,
      actionType: rule.actionType as AutomationRuleDto['actionType'],
      actionConfig: rule.actionConfig,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  private toRunDto(run: AutomationRun): AutomationRunDto {
    return {
      id: run.id,
      ruleId: run.rule.id,
      ruleName: run.rule.name,
      taskId: run.task?.id ?? null,
      status: run.status as AutomationRunDto['status'],
      errorMessage: run.errorMessage ?? null,
      createdAt: run.createdAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
    };
  }
}
