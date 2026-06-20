import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  TaskDependenciesDto,
  TaskDependencyItemDto,
  TaskDependencyRelation,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { TaskDependency, TaskDependencyType } from './entities/task-dependency.entity';
import { TaskMembership } from './entities/task-membership.entity';
import { Task } from './entities/task.entity';
import {
  resolveBlockedTaskIdsFromEdges,
  wouldCreateDependencyCycle,
} from './task-dependency.utils';

@Injectable()
export class TaskDependenciesService {
  constructor(private readonly entityManager: EntityManager) {}

  async listForTask(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<TaskDependenciesDto> {
    await this.assertTaskViewerAccess(workspaceId, taskId, userId);
    return this.buildDependenciesDto(workspaceId, taskId);
  }

  async createForTask(
    context: WorkspaceContext,
    taskId: string,
    createTaskDependencyDto: CreateTaskDependencyDto,
  ): Promise<TaskDependenciesDto> {
    await this.assertTaskEditorAccess(context.workspace.id, taskId, context.user.id);
    const relatedTask = await this.entityManager.findOne(Task, {
      id: createTaskDependencyDto.relatedTaskId,
      workspace: context.workspace.id,
    });
    if (!relatedTask) {
      throw new NotFoundException('Tarea relacionada no encontrada');
    }
    if (relatedTask.id === taskId) {
      throw new BadRequestException('Una tarea no puede depender de sí misma');
    }
    const { predecessorTaskId, successorTaskId } = this.resolveDependencyPair(
      taskId,
      createTaskDependencyDto.relatedTaskId,
      createTaskDependencyDto.relation,
    );
    const existing = await this.entityManager.findOne(TaskDependency, {
      predecessorTask: predecessorTaskId,
      successorTask: successorTaskId,
      workspace: context.workspace.id,
    });
    if (existing) {
      throw new BadRequestException('Esta dependencia ya existe');
    }
    const edges = await this.entityManager.find(TaskDependency, {
      workspace: context.workspace.id,
    });
    const wouldCycle = wouldCreateDependencyCycle(
      edges.map((edge) => ({
        predecessorTaskId: edge.predecessorTask.id,
        successorTaskId: edge.successorTask.id,
        predecessorCompleted: false,
      })),
      predecessorTaskId,
      successorTaskId,
    );
    if (wouldCycle) {
      throw new BadRequestException('La dependencia crearía un ciclo');
    }
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const predecessorTask = await this.entityManager.findOneOrFail(Task, {
      id: predecessorTaskId,
    });
    const successorTask = await this.entityManager.findOneOrFail(Task, {
      id: successorTaskId,
    });
    this.entityManager.create(TaskDependency, {
      workspace,
      predecessorTask,
      successorTask,
      type: TaskDependencyType.FINISH_TO_START,
    });
    await this.entityManager.flush();
    return this.buildDependenciesDto(context.workspace.id, taskId);
  }

  async removeForTask(
    context: WorkspaceContext,
    taskId: string,
    dependencyId: string,
  ): Promise<TaskDependenciesDto> {
    await this.assertTaskEditorAccess(context.workspace.id, taskId, context.user.id);
    const dependency = await this.entityManager.findOne(
      TaskDependency,
      {
        id: dependencyId,
        workspace: context.workspace.id,
      },
      { populate: ['predecessorTask', 'successorTask'] },
    );
    if (!dependency) {
      throw new NotFoundException('Dependencia no encontrada');
    }
    if (
      dependency.predecessorTask.id !== taskId &&
      dependency.successorTask.id !== taskId
    ) {
      throw new NotFoundException('Dependencia no encontrada');
    }
    this.entityManager.remove(dependency);
    await this.entityManager.flush();
    return this.buildDependenciesDto(context.workspace.id, taskId);
  }

  async resolveBlockedTaskIds(
    workspaceId: string,
    taskIds: string[],
  ): Promise<Set<string>> {
    if (taskIds.length === 0) {
      return new Set();
    }
    const dependencies = await this.entityManager.find(
      TaskDependency,
      {
        workspace: workspaceId,
        successorTask: { $in: taskIds },
      },
      { populate: ['predecessorTask', 'successorTask'] },
    );
    const blockedTaskIds = resolveBlockedTaskIdsFromEdges(
      taskIds,
      dependencies.map((dependency) => ({
        predecessorTaskId: dependency.predecessorTask.id,
        successorTaskId: dependency.successorTask.id,
        predecessorCompleted: dependency.predecessorTask.completedAt !== null,
      })),
    );
    return blockedTaskIds;
  }

  async buildDependenciesDto(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskDependenciesDto> {
    const blockedByRows = await this.entityManager.find(
      TaskDependency,
      { workspace: workspaceId, successorTask: taskId },
      {
        populate: ['predecessorTask', 'predecessorTask.memberships.project'],
        orderBy: { createdAt: 'ASC' },
      },
    );
    const blockingRows = await this.entityManager.find(
      TaskDependency,
      { workspace: workspaceId, predecessorTask: taskId },
      {
        populate: ['successorTask', 'successorTask.memberships.project'],
        orderBy: { createdAt: 'ASC' },
      },
    );
    return {
      blockedBy: await Promise.all(
        blockedByRows.map((row) => this.toDependencyItem(row, 'predecessorTask')),
      ),
      blocking: await Promise.all(
        blockingRows.map((row) => this.toDependencyItem(row, 'successorTask')),
      ),
    };
  }

  private async toDependencyItem(
    dependency: TaskDependency,
    taskKey: 'predecessorTask' | 'successorTask',
  ): Promise<TaskDependencyItemDto> {
    const task =
      taskKey === 'predecessorTask'
        ? dependency.predecessorTask
        : dependency.successorTask;
    await this.entityManager.populate(task, ['memberships.project']);
    const membership = this.pickPrimaryMembership(task.memberships.getItems());
    return {
      id: dependency.id,
      type: 'finish_to_start',
      task: {
        id: task.id,
        name: task.name,
        projectId: membership?.project.id ?? '',
        projectName: membership?.project.name ?? '',
        completedAt: task.completedAt?.toISOString() ?? null,
      },
    };
  }

  private resolveDependencyPair(
    taskId: string,
    relatedTaskId: string,
    relation: TaskDependencyRelation,
  ): { predecessorTaskId: string; successorTaskId: string } {
    if (relation === 'blocked_by') {
      return {
        predecessorTaskId: relatedTaskId,
        successorTaskId: taskId,
      };
    }
    return {
      predecessorTaskId: taskId,
      successorTaskId: relatedTaskId,
    };
  }

  private async wouldCreateCycle(
    workspaceId: string,
    predecessorTaskId: string,
    successorTaskId: string,
  ): Promise<boolean> {
    const edges = await this.entityManager.find(TaskDependency, { workspace: workspaceId });
    return wouldCreateDependencyCycle(
      edges.map((edge) => ({
        predecessorTaskId: edge.predecessorTask.id,
        successorTaskId: edge.successorTask.id,
        predecessorCompleted: false,
      })),
      predecessorTaskId,
      successorTaskId,
    );
  }

  private pickPrimaryMembership(
    memberships: TaskMembership[],
  ): TaskMembership | null {
    if (memberships.length === 0) {
      return null;
    }
    return [...memberships].sort((left, right) =>
      left.project.name.localeCompare(right.project.name),
    )[0]!;
  }

  private async assertTaskViewerAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    await this.assertTaskAccess(workspaceId, taskId, userId, 'viewer');
  }

  private async assertTaskEditorAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    await this.assertTaskAccess(workspaceId, taskId, userId, 'editor');
  }

  private async assertTaskAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
    minimumRole: 'viewer' | 'editor',
  ): Promise<void> {
    const task = await this.entityManager.findOne(Task, {
      id: taskId,
      workspace: workspaceId,
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const memberships = await this.entityManager.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      { populate: ['project'] },
    );
    if (memberships.length === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const projectIds = memberships.map((membership) => membership.project.id);
    const projectMembers = await this.entityManager.find(ProjectMember, {
      project: { $in: projectIds },
      user: userId,
    });
    const hasAccess = projectMembers.some((member) =>
      minimumRole === 'editor'
        ? member.role === ProjectAccessRole.ADMIN ||
          member.role === ProjectAccessRole.EDITOR
        : true,
    );
    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para acceder a esta tarea');
    }
  }
}
