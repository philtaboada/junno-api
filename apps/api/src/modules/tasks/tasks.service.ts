import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
  MyTasksDto,
  MyTasksSectionDto,
  MyTasksSectionId,
  ProjectListColumnDto,
  ProjectListFieldKey,
  ProjectTaskDependencyEdgeDto,
  ProjectTasksDto,
  TaskAssigneeDto,
  TaskDetailDto,
  TaskMembershipDto,
  TaskSummaryDto,
  WorkspaceMemberDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Section } from '../projects/entities/section.entity';
import { Comment } from '../comments/entities/comment.entity';
import { UpdateListColumnsDto } from '../projects/dto/update-list-columns.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { TaskInboxEventsService } from '../notifications/task-inbox-events.service';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldsService } from '../projects/custom-fields.service';
import { DEFAULT_MY_TASKS_LIST_COLUMNS } from './constants/list-columns.constants';
import { MyTasksListColumn } from './entities/my-tasks-list-column.entity';
import {
  DEFAULT_TASK_POSITION,
  TASK_POSITION_GAP,
} from './constants/tasks.constants';
import { CreateTaskDto } from './dto/create-task.dto';
import { AddTaskMembershipDto } from './dto/add-task-membership.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskDependenciesService } from './task-dependencies.service';
import { SearchIndexerService } from '../search/search-indexer.service';
import { AutomationTriggerService } from '../automation/automation-trigger.service';
import { IntegrationTriggerService } from '../integrations/integration-trigger.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskDependency } from './entities/task-dependency.entity';
import { TaskMembership } from './entities/task-membership.entity';
import { Task } from './entities/task.entity';

const MY_TASKS_SECTIONS: ReadonlyArray<{
  readonly id: MyTasksSectionId;
  readonly label: string;
}> = [
  { id: 'today', label: 'Hoy' },
  { id: 'upcoming', label: 'Próximamente' },
  { id: 'later', label: 'Más tarde' },
];

@Injectable()
export class TasksService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeService: RealtimeService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly taskInboxEventsService: TaskInboxEventsService,
    private readonly taskAttachmentsService: TaskAttachmentsService,
    private readonly taskDependenciesService: TaskDependenciesService,
    private readonly searchIndexerService: SearchIndexerService,
    private readonly automationTriggerService: AutomationTriggerService,
    private readonly integrationTriggerService: IntegrationTriggerService,
  ) {}

  async listForProject(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<ProjectTasksDto> {
    await this.findProjectInWorkspace(workspaceId, projectId);
    await this.assertProjectMember(projectId, userId);
    const memberships = await this.entityManager.find(
      TaskMembership,
      {
        project: projectId,
        workspace: workspaceId,
        task: { parentTask: null },
      },
      {
        populate: ['task', 'task.assignee', 'task.parentTask', 'project', 'section'],
        orderBy: { position: 'ASC' },
      },
    );
    const taskIds = memberships.map((membership) => membership.task.id);
    const blockedTaskIds = await this.taskDependenciesService.resolveBlockedTaskIds(
      workspaceId,
      taskIds,
    );
    const customFieldValuesByTask =
      await this.customFieldsService.loadValuesForTasks(
        this.entityManager,
        projectId,
        taskIds,
      );
    const subtaskMemberships =
      taskIds.length > 0
        ? await this.entityManager.find(
            TaskMembership,
            {
              project: projectId,
              workspace: workspaceId,
              task: { parentTask: { $in: taskIds } },
            },
            {
              populate: [
                'task',
                'task.assignee',
                'task.parentTask',
                'project',
                'section',
              ],
              orderBy: { position: 'ASC' },
            },
          )
        : [];
    const subtaskIds = subtaskMemberships.map(
      (membership) => membership.task.id,
    );
    const subtaskCustomFieldValuesByTask =
      subtaskIds.length > 0
        ? await this.customFieldsService.loadValuesForTasks(
            this.entityManager,
            projectId,
            subtaskIds,
          )
        : new Map<string, Record<string, CustomFieldValueDto>>();
    const subtasksByParentId = new Map<string, TaskSummaryDto[]>();
    const nestedSubtaskCounts = await this.countDirectSubtasksByParentIds(
      this.entityManager,
      workspaceId,
      subtaskIds,
    );
    for (const membership of subtaskMemberships) {
      const parentTaskId = membership.task.parentTask?.id;
      if (!parentTaskId) {
        continue;
      }
      const summary = this.toSummary(
        membership,
        subtaskCustomFieldValuesByTask.get(membership.task.id) ?? {},
        blockedTaskIds.has(membership.task.id),
      );
      const existing = subtasksByParentId.get(parentTaskId) ?? [];
      existing.push({
        ...summary,
        subtasks: [],
        subtaskCount: nestedSubtaskCounts.get(membership.task.id) ?? 0,
      });
      subtasksByParentId.set(parentTaskId, existing);
    }
    const dependencyRows =
      taskIds.length > 0
        ? await this.entityManager.find(
            TaskDependency,
            {
              workspace: workspaceId,
              predecessorTask: { $in: taskIds },
              successorTask: { $in: taskIds },
            },
            { populate: ['predecessorTask', 'successorTask'] },
          )
        : [];
    const dependencies: ProjectTaskDependencyEdgeDto[] = dependencyRows.map(
      (dependency) => ({
        id: dependency.id,
        predecessorTaskId: dependency.predecessorTask.id,
        successorTaskId: dependency.successorTask.id,
      }),
    );
    return {
      projectId,
      tasks: memberships.map((membership) => {
        const summary = this.toSummary(
          membership,
          customFieldValuesByTask.get(membership.task.id) ?? {},
          blockedTaskIds.has(membership.task.id),
        );
        const directSubtasks = subtasksByParentId.get(membership.task.id) ?? [];
        return {
          ...summary,
          subtasks: directSubtasks,
          subtaskCount: directSubtasks.length,
        };
      }),
      dependencies,
    };
  }

  async createForProject(
    context: WorkspaceContext,
    projectId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await this.findProjectInWorkspace(
        context.workspace.id,
        projectId,
        em,
      );
      await this.assertProjectEditor(projectId, context.user.id, em);
      const creator = await em.findOneOrFail(User, { id: context.user.id });
      const workspace = em.getReference(Workspace, context.workspace.id);
      let parentTask: Task | null = null;
      if (createTaskDto.parentTaskId) {
        parentTask = await em.findOne(Task, {
          id: createTaskDto.parentTaskId,
          workspace: context.workspace.id,
        });
        if (!parentTask) {
          throw new NotFoundException('Tarea padre no encontrada');
        }
        const parentMembership = await em.findOne(TaskMembership, {
          task: parentTask.id,
          project: projectId,
        });
        if (!parentMembership) {
          throw new BadRequestException(
            'La tarea padre no pertenece a este proyecto',
          );
        }
      }
      const assignee = await this.resolveAssignee(
        context.workspace.id,
        createTaskDto.assigneeId,
        em,
      );
      const task = em.create(Task, {
        workspace,
        name: createTaskDto.name.trim(),
        assignee,
        startAt: createTaskDto.startAt ? new Date(createTaskDto.startAt) : null,
        startHasTime: createTaskDto.startHasTime ?? false,
        dueAt: createTaskDto.dueAt ? new Date(createTaskDto.dueAt) : null,
        dueHasTime: createTaskDto.dueHasTime ?? false,
        parentTask,
        createdBy: creator,
      });
      this.validateTaskDateRange(task.startAt, task.dueAt);
      let section: Section;
      if (parentTask) {
        const parentMembership = await em.findOneOrFail(
          TaskMembership,
          { task: parentTask.id, project: projectId },
          { populate: ['section'] },
        );
        section =
          parentMembership.section ??
          (await this.resolveDefaultSection(projectId, em));
      } else {
        section = createTaskDto.sectionId
          ? await this.findSectionInProject(projectId, createTaskDto.sectionId, em)
          : await this.resolveDefaultSection(projectId, em);
      }
      const position = await this.resolveNextTaskPosition(
        projectId,
        section.id,
        em,
      );
      em.create(TaskMembership, {
        workspace,
        task,
        project,
        section,
        position,
      });
      await em.flush();
      const detail = await this.buildTaskDetail(
        context.workspace.id,
        task.id,
        projectId,
        em,
      );
      this.realtimeService.emitTaskChanged(context.workspace.id, {
        taskId: task.id,
        projectId,
      });
      this.searchIndexerService.syncTask(task.id, context.workspace.id);
      this.integrationTriggerService.enqueueTaskCreated({
        workspaceId: context.workspace.id,
        projectId: project.id,
        projectName: project.name,
        taskId: task.id,
        taskName: task.name,
        actorUserId: context.user.id,
      });
      return detail;
    });
  }

  async createFromFormSubmission(
    workspaceId: string,
    projectId: string,
    createdByUserId: string,
    input: {
      name: string;
      description?: string | null;
      dueAt?: string | null;
      sectionId?: string | null;
      customFieldValues?: Record<string, CustomFieldValueDto | null>;
    },
  ): Promise<TaskDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await this.findProjectInWorkspace(workspaceId, projectId, em);
      const creator = await em.findOneOrFail(User, { id: createdByUserId });
      const workspace = em.getReference(Workspace, workspaceId);
      const task = em.create(Task, {
        workspace,
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        assignee: null,
        startAt: null,
        startHasTime: false,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        dueHasTime: false,
        parentTask: null,
        createdBy: creator,
      });
      this.validateTaskDateRange(task.startAt, task.dueAt);
      const section = input.sectionId
        ? await this.findSectionInProject(projectId, input.sectionId, em)
        : await this.resolveDefaultSection(projectId, em);
      const position = await this.resolveNextTaskPosition(projectId, section.id, em);
      em.create(TaskMembership, {
        workspace,
        task,
        project,
        section,
        position,
      });
      await em.flush();
      if (input.customFieldValues && Object.keys(input.customFieldValues).length > 0) {
        await this.customFieldsService.applyTaskValues(
          em,
          workspaceId,
          projectId,
          task.id,
          input.customFieldValues,
        );
        await em.flush();
      }
      const detail = await this.buildTaskDetail(workspaceId, task.id, projectId, em);
      this.realtimeService.emitTaskChanged(workspaceId, {
        taskId: task.id,
        projectId,
      });
      this.searchIndexerService.syncTask(task.id, workspaceId);
      this.integrationTriggerService.enqueueTaskCreated({
        workspaceId,
        projectId,
        projectName: project.name,
        taskId: task.id,
        taskName: task.name,
        actorUserId: createdByUserId,
      });
      return detail;
    });
  }

  async getForWorkspace(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<TaskDetailDto> {
    await this.assertTaskAccess(workspaceId, taskId, userId, 'viewer');
    const membership = await this.findPrimaryMembership(workspaceId, taskId);
    return this.buildTaskDetail(workspaceId, taskId, membership.project.id);
  }

  async listMembershipsForWorkspace(
    context: WorkspaceContext,
    taskId: string,
  ): Promise<TaskMembershipDto[]> {
    await this.assertTaskAccess(
      context.workspace.id,
      taskId,
      context.user.id,
      'viewer',
    );
    const memberships = await this.entityManager.find(
      TaskMembership,
      { task: taskId, workspace: context.workspace.id },
      {
        populate: ['project', 'section'],
        orderBy: { project: { name: 'ASC' } },
      },
    );
    return memberships.map((membership) => this.toMembershipDto(membership));
  }

  async addMembershipForWorkspace(
    context: WorkspaceContext,
    taskId: string,
    addTaskMembershipDto: AddTaskMembershipDto,
  ): Promise<TaskDetailDto> {
    return this.entityManager.transactional(async (em) => {
      await this.assertTaskAccess(
        context.workspace.id,
        taskId,
        context.user.id,
        'editor',
        em,
      );
      await this.assertProjectEditor(
        addTaskMembershipDto.projectId,
        context.user.id,
        em,
      );
      const existingMembership = await em.findOne(TaskMembership, {
        task: taskId,
        project: addTaskMembershipDto.projectId,
        workspace: context.workspace.id,
      });
      if (existingMembership) {
        throw new BadRequestException('La tarea ya está en este proyecto');
      }
      const task = await em.findOneOrFail(
        Task,
        {
          id: taskId,
          workspace: context.workspace.id,
        },
        { populate: ['assignee'] },
      );
      const project = await this.findProjectInWorkspace(
        context.workspace.id,
        addTaskMembershipDto.projectId,
        em,
      );
      const section = addTaskMembershipDto.sectionId
        ? await this.findSectionInProject(
            project.id,
            addTaskMembershipDto.sectionId,
            em,
          )
        : await this.resolveDefaultSection(project.id, em);
      const position = await this.resolveNextTaskPosition(
        project.id,
        section.id,
        em,
      );
      const workspace = em.getReference(Workspace, context.workspace.id);
      em.create(TaskMembership, {
        workspace,
        task,
        project,
        section,
        position,
      });
      await em.flush();
      const primaryMembership = await this.findPrimaryMembership(
        context.workspace.id,
        taskId,
        em,
      );
      await this.taskInboxEventsService.notifyTaskAddedToProject({
        workspaceId: context.workspace.id,
        actorUserId: context.user.id,
        assigneeUserId: task.assignee?.id ?? null,
        taskId: task.id,
        taskName: task.name,
        projectId: project.id,
        projectName: project.name,
      });
      this.realtimeService.emitTaskChanged(context.workspace.id, {
        taskId,
        projectId: project.id,
      });
      this.searchIndexerService.syncTask(taskId, context.workspace.id);
      return this.buildTaskDetail(
        context.workspace.id,
        taskId,
        primaryMembership.project.id,
        em,
      );
    });
  }

  async removeMembershipForWorkspace(
    context: WorkspaceContext,
    taskId: string,
    projectId: string,
  ): Promise<TaskDetailDto> {
    return this.entityManager.transactional(async (em) => {
      await this.assertTaskAccess(
        context.workspace.id,
        taskId,
        context.user.id,
        'editor',
        em,
      );
      await this.assertProjectEditor(projectId, context.user.id, em);
      const memberships = await em.find(
        TaskMembership,
        {
          task: taskId,
          workspace: context.workspace.id,
        },
        { populate: ['project'] },
      );
      if (memberships.length <= 1) {
        throw new BadRequestException(
          'La tarea debe permanecer en al menos un proyecto',
        );
      }
      const membership = memberships.find(
        (item) => item.project.id === projectId,
      );
      if (!membership) {
        throw new NotFoundException('La tarea no está en este proyecto');
      }
      em.remove(membership);
      await em.flush();
      this.realtimeService.emitTaskChanged(context.workspace.id, {
        taskId,
        projectId,
      });
      this.searchIndexerService.syncTask(taskId, context.workspace.id);
      const primaryMembership = await this.findPrimaryMembership(
        context.workspace.id,
        taskId,
        em,
      );
      return this.buildTaskDetail(
        context.workspace.id,
        taskId,
        primaryMembership.project.id,
        em,
      );
    });
  }

  async updateForWorkspace(
    context: WorkspaceContext,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDetailDto> {
    const membership = await this.assertTaskAccess(
      context.workspace.id,
      taskId,
      context.user.id,
      'editor',
    );
    const task = await this.entityManager.findOneOrFail(Task, {
      id: taskId,
      workspace: context.workspace.id,
    }, { populate: ['assignee'] });
    const previousAssigneeId = task.assignee?.id ?? null;
    const previousDueAt = task.dueAt?.toISOString() ?? null;
    const wasCompleted = task.completedAt !== null;
    if (updateTaskDto.name !== undefined) {
      task.name = updateTaskDto.name.trim();
    }
    if (updateTaskDto.description !== undefined) {
      task.description = updateTaskDto.description?.trim() || null;
    }
    if (updateTaskDto.assigneeId !== undefined) {
      task.assignee = updateTaskDto.assigneeId
        ? await this.resolveAssignee(
            context.workspace.id,
            updateTaskDto.assigneeId,
          )
        : null;
    }
    if (updateTaskDto.startAt !== undefined) {
      task.startAt = updateTaskDto.startAt ? new Date(updateTaskDto.startAt) : null;
    }
    if (updateTaskDto.startHasTime !== undefined) {
      task.startHasTime = updateTaskDto.startHasTime;
    }
    if (updateTaskDto.dueAt !== undefined) {
      task.dueAt = updateTaskDto.dueAt ? new Date(updateTaskDto.dueAt) : null;
    }
    if (updateTaskDto.dueHasTime !== undefined) {
      task.dueHasTime = updateTaskDto.dueHasTime;
    }
    this.validateTaskDateRange(task.startAt, task.dueAt);
    if (updateTaskDto.completed !== undefined) {
      task.completedAt = updateTaskDto.completed ? new Date() : null;
    }
    if (updateTaskDto.sectionId !== undefined) {
      const section = await this.findSectionInProject(
        membership.project.id,
        updateTaskDto.sectionId,
      );
      membership.section = section;
    }
    if (updateTaskDto.position !== undefined) {
      membership.position = updateTaskDto.position;
    }
    let nextCustomFieldValues: Record<string, CustomFieldValueDto> | undefined;
    if (updateTaskDto.customFieldValues !== undefined) {
      nextCustomFieldValues = await this.customFieldsService.applyTaskValues(
        this.entityManager,
        context.workspace.id,
        membership.project.id,
        taskId,
        updateTaskDto.customFieldValues as Record<string, CustomFieldValueDto | null>,
      );
    }
    await this.entityManager.flush();
    const detail = await this.buildTaskDetail(
      context.workspace.id,
      taskId,
      membership.project.id,
    );
    if (nextCustomFieldValues) {
      return { ...detail, customFieldValues: nextCustomFieldValues };
    }
    const assigneeUserId = task.assignee?.id ?? null;
    const notificationProject = membership.project;
    if (
      updateTaskDto.assigneeId !== undefined &&
      updateTaskDto.assigneeId !== previousAssigneeId
    ) {
      await this.taskInboxEventsService.notifyTaskAssigned({
        workspaceId: context.workspace.id,
        actorUserId: context.user.id,
        assigneeUserId,
        taskId: task.id,
        taskName: task.name,
        projectId: notificationProject.id,
        projectName: notificationProject.name,
      });
      this.automationTriggerService.enqueueTaskAssigned(
        this.buildAutomationEventParams(context, task, notificationProject, assigneeUserId),
      );
    }
    if (
      updateTaskDto.dueAt !== undefined &&
      (updateTaskDto.dueAt ?? null) !== previousDueAt
    ) {
      await this.taskInboxEventsService.notifyTaskDueChanged({
        workspaceId: context.workspace.id,
        actorUserId: context.user.id,
        assigneeUserId,
        taskId: task.id,
        taskName: task.name,
        projectId: notificationProject.id,
        projectName: notificationProject.name,
        dueAt: task.dueAt?.toISOString() ?? null,
      });
      this.automationTriggerService.enqueueTaskDueChanged(
        this.buildAutomationEventParams(context, task, notificationProject, assigneeUserId),
      );
    }
    if (
      updateTaskDto.completed !== undefined &&
      updateTaskDto.completed &&
      !wasCompleted
    ) {
      await this.taskInboxEventsService.notifyTaskCompleted({
        workspaceId: context.workspace.id,
        actorUserId: context.user.id,
        assigneeUserId,
        taskId: task.id,
        taskName: task.name,
        projectId: notificationProject.id,
        projectName: notificationProject.name,
      });
      this.automationTriggerService.enqueueTaskCompleted(
        this.buildAutomationEventParams(context, task, notificationProject, assigneeUserId),
      );
    }
    this.realtimeService.emitTaskChanged(context.workspace.id, {
      taskId,
      projectId: membership.project.id,
    });
    this.searchIndexerService.syncTask(taskId, context.workspace.id);
    if (updateTaskDto.name !== undefined) {
      this.searchIndexerService.syncCommentsForTask(taskId, context.workspace.id);
    }
    this.integrationTriggerService.enqueueTaskUpdated({
      workspaceId: context.workspace.id,
      projectId: membership.project.id,
      projectName: membership.project.name,
      taskId: task.id,
      taskName: task.name,
      actorUserId: context.user.id,
    });
    return detail;
  }

  async removeForWorkspace(
    context: WorkspaceContext,
    taskId: string,
  ): Promise<void> {
    const membership = await this.assertTaskAccess(
      context.workspace.id,
      taskId,
      context.user.id,
      'editor',
    );
    const task = await this.entityManager.findOne(Task, {
      id: taskId,
      workspace: context.workspace.id,
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const projectId = membership.project.id;
    const comments = await this.entityManager.find(Comment, {
      task: taskId,
      workspace: context.workspace.id,
    });
    const commentIds = comments.map((comment) => comment.id);
    this.entityManager.remove(task);
    await this.entityManager.flush();
    this.realtimeService.emitTaskChanged(context.workspace.id, {
      taskId,
      projectId,
    });
    this.searchIndexerService.removeTask(taskId, commentIds);
  }

  async reorderForProject(
    context: WorkspaceContext,
    projectId: string,
    reorderTasksDto: ReorderTasksDto,
  ): Promise<ProjectTasksDto> {
    await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(projectId, context.user.id);
    const memberships = await this.entityManager.find(
      TaskMembership,
      {
        project: projectId,
        workspace: context.workspace.id,
        task: { parentTask: null },
      },
      { populate: ['task'] },
    );
    const membershipByTaskId = new Map(
      memberships.map((membership) => [membership.task.id, membership]),
    );
    for (const update of reorderTasksDto.tasks) {
      const membership = membershipByTaskId.get(update.taskId);
      if (!membership) {
        throw new NotFoundException(`Tarea no encontrada: ${update.taskId}`);
      }
      const section = await this.findSectionInProject(projectId, update.sectionId);
      membership.section = section;
      membership.position = update.position;
    }
    await this.entityManager.flush();
    const result = await this.listForProject(
      context.workspace.id,
      projectId,
      context.user.id,
    );
    this.realtimeService.emitTaskChanged(context.workspace.id, {
      taskId: reorderTasksDto.tasks[0]?.taskId ?? projectId,
      projectId,
    });
    return result;
  }

  async listMyTasks(context: WorkspaceContext): Promise<MyTasksDto> {
    const workspaceMembers = await this.listWorkspaceMembers(context.workspace.id);
    const tasks = await this.entityManager.find(
      Task,
      {
        workspace: context.workspace.id,
        assignee: context.user.id,
        completedAt: null,
      },
      {
        populate: [
          'assignee',
          'parentTask',
          'memberships.project',
          'memberships.section',
        ],
        orderBy: { dueAt: 'ASC' },
      },
    );
    const tasksByProjectId = new Map<string, Task[]>();
    const membershipByTaskId = new Map<string, TaskMembership>();
    for (const task of tasks) {
      const membership = this.pickPrimaryMembership(task.memberships.getItems());
      if (!membership) {
        continue;
      }
      membershipByTaskId.set(task.id, membership);
      const projectTasks = tasksByProjectId.get(membership.project.id) ?? [];
      projectTasks.push(task);
      tasksByProjectId.set(membership.project.id, projectTasks);
    }
    const projectIds = [...tasksByProjectId.keys()];
    const customFieldValuesByTaskId = new Map<string, Record<string, CustomFieldValueDto>>();
    for (const [projectId, projectTasks] of tasksByProjectId) {
      const valuesByTask = await this.customFieldsService.loadValuesForTasks(
        this.entityManager,
        projectId,
        projectTasks.map((task) => task.id),
      );
      for (const [taskId, values] of valuesByTask) {
        customFieldValuesByTaskId.set(taskId, values);
      }
    }
    const customFields = await this.customFieldsService.listDefinitionsForProjects(
      this.entityManager,
      projectIds,
    );
    await this.syncMyTasksCustomFieldColumns(context, customFields);
    const listColumns = await this.ensureMyTasksListColumns(context);
    const myTaskIds = tasks
      .map((task) => membershipByTaskId.get(task.id))
      .filter((membership): membership is TaskMembership => Boolean(membership))
      .map((membership) => membership.task.id);
    const blockedTaskIds = await this.taskDependenciesService.resolveBlockedTaskIds(
      context.workspace.id,
      myTaskIds,
    );
    const startOfToday = this.startOfUtcDay(new Date());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
    const sectionBuckets: Record<MyTasksSectionId, TaskSummaryDto[]> = {
      today: [],
      upcoming: [],
      later: [],
    };
    for (const task of tasks) {
      const membership = membershipByTaskId.get(task.id);
      if (!membership) {
        continue;
      }
      const summary = this.toSummary(
        membership,
        customFieldValuesByTaskId.get(task.id) ?? {},
        blockedTaskIds.has(task.id),
      );
      if (!task.dueAt) {
        sectionBuckets.later.push(summary);
        continue;
      }
      const dueAt = task.dueAt;
      if (dueAt < startOfTomorrow) {
        sectionBuckets.today.push(summary);
        continue;
      }
      sectionBuckets.upcoming.push(summary);
    }
    const sections: MyTasksSectionDto[] = MY_TASKS_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      tasks: sectionBuckets[section.id],
    }));
    return { sections, listColumns, customFields, workspaceMembers };
  }

  async updateMyTasksListColumns(
    context: WorkspaceContext,
    updateListColumnsDto: UpdateListColumnsDto,
  ): Promise<MyTasksDto> {
    await this.ensureMyTasksListColumns(context);
    const columns = await this.entityManager.find(
      MyTasksListColumn,
      {
        workspace: context.workspace.id,
        user: context.user.id,
      },
      { populate: ['customField'] },
    );
    const columnByFieldKey = new Map(
      columns
        .filter((column) => column.fieldKey)
        .map((column) => [column.fieldKey, column]),
    );
    const columnByCustomFieldId = new Map(
      columns
        .filter((column) => column.customField)
        .map((column) => [column.customField!.id, column]),
    );
    const hasNameColumn = updateListColumnsDto.columns.some(
      (column) => column.fieldKey === 'name' && column.visible,
    );
    if (!hasNameColumn) {
      throw new BadRequestException('La columna Nombre debe permanecer visible');
    }
    for (const update of updateListColumnsDto.columns) {
      const column = update.customFieldId
        ? columnByCustomFieldId.get(update.customFieldId)
        : update.fieldKey
          ? columnByFieldKey.get(update.fieldKey)
          : undefined;
      if (!column) {
        throw new NotFoundException('Columna no encontrada');
      }
      column.position = update.position;
      column.visible = update.visible;
      column.width = update.width ?? null;
    }
    await this.entityManager.flush();
    return this.listMyTasks(context);
  }

  private async ensureMyTasksListColumns(
    context: WorkspaceContext,
  ): Promise<ProjectListColumnDto[]> {
    const existingColumns = await this.entityManager.find(
      MyTasksListColumn,
      {
        workspace: context.workspace.id,
        user: context.user.id,
      },
      { orderBy: { position: 'ASC' }, populate: ['customField'] },
    );
    if (existingColumns.length === 0) {
      this.seedDefaultMyTasksListColumns(context);
      await this.entityManager.flush();
      const seededColumns = await this.entityManager.find(
        MyTasksListColumn,
        {
          workspace: context.workspace.id,
          user: context.user.id,
        },
        { orderBy: { position: 'ASC' }, populate: ['customField'] },
      );
      return this.toMyTasksListColumnDtos(seededColumns);
    }
    return this.toMyTasksListColumnDtos(existingColumns);
  }

  private async syncMyTasksCustomFieldColumns(
    context: WorkspaceContext,
    customFields: CustomFieldDefinitionDto[],
  ): Promise<void> {
    if (customFields.length === 0) {
      return;
    }
    await this.ensureMyTasksListColumns(context);
    const existingColumns = await this.entityManager.find(
      MyTasksListColumn,
      {
        workspace: context.workspace.id,
        user: context.user.id,
      },
      { populate: ['customField'] },
    );
    const existingCustomFieldIds = new Set(
      existingColumns
        .filter((column) => column.customField)
        .map((column) => column.customField!.id),
    );
    const maxPosition = existingColumns.reduce(
      (max, column) => Math.max(max, column.position),
      -1,
    );
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const user = this.entityManager.getReference(User, context.user.id);
    let nextPosition = maxPosition + 1;
    for (const field of customFields) {
      if (existingCustomFieldIds.has(field.id)) {
        continue;
      }
      const customField = this.entityManager.getReference(CustomFieldDefinition, field.id);
      this.entityManager.create(MyTasksListColumn, {
        workspace,
        user,
        fieldKey: null,
        customField,
        position: nextPosition,
        visible: false,
        width: null,
      });
      nextPosition += 1;
    }
    if (nextPosition > maxPosition + 1) {
      await this.entityManager.flush();
    }
  }

  private seedDefaultMyTasksListColumns(context: WorkspaceContext): void {
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const user = this.entityManager.getReference(User, context.user.id);
    for (const seed of DEFAULT_MY_TASKS_LIST_COLUMNS) {
      this.entityManager.create(MyTasksListColumn, {
        workspace,
        user,
        fieldKey: seed.fieldKey,
        position: seed.position,
        visible: seed.visible,
        width: seed.width,
      });
    }
  }

  private toMyTasksListColumnDtos(columns: MyTasksListColumn[]): ProjectListColumnDto[] {
    return columns.map((column) => ({
      id: column.id,
      fieldKey: column.fieldKey as ProjectListFieldKey | null,
      customFieldId: column.customField?.id ?? null,
      position: column.position,
      visible: column.visible,
      width: column.width,
    }));
  }

  private async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    const members = await this.entityManager.find(
      WorkspaceMember,
      { workspace: workspaceId },
      { populate: ['user'], orderBy: { user: { name: 'ASC' } } },
    );
    return members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    }));
  }

  private async buildTaskDetail(
    workspaceId: string,
    taskId: string,
    projectId: string,
    em: EntityManager = this.entityManager,
  ): Promise<TaskDetailDto> {
    const membership = await em.findOneOrFail(
      TaskMembership,
      { task: taskId, project: projectId, workspace: workspaceId },
      {
        populate: [
          'task',
          'task.assignee',
          'task.parentTask',
          'project',
          'section',
        ],
      },
    );
    const subtaskMemberships = await em.find(
      TaskMembership,
      {
        project: projectId,
        workspace: workspaceId,
        task: { parentTask: taskId },
      },
      {
        populate: ['task', 'task.assignee', 'task.parentTask', 'project', 'section'],
        orderBy: { position: 'ASC' },
      },
    );
    const commentCount = await em.count(Comment, {
      task: taskId,
      workspace: workspaceId,
    });
    const allTaskIds = [
      taskId,
      ...subtaskMemberships.map((subtaskMembership) => subtaskMembership.task.id),
    ];
    const customFieldValuesByTask = await this.customFieldsService.loadValuesForTasks(
      em,
      projectId,
      allTaskIds,
    );
    const customFields = await this.customFieldsService.listDefinitionsForProject(
      em,
      projectId,
    );
    const nestedSubtaskCounts = await this.countDirectSubtasksByParentIds(
      em,
      workspaceId,
      subtaskMemberships.map((subtaskMembership) => subtaskMembership.task.id),
    );
    const allMemberships = await em.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      {
        populate: ['project', 'section'],
        orderBy: { project: { name: 'ASC' } },
      },
    );
    const [attachments, dependencies] = await Promise.all([
      this.taskAttachmentsService.listDtosForTaskDetail(workspaceId, taskId),
      this.taskDependenciesService.buildDependenciesDto(workspaceId, taskId),
    ]);
    const isBlocked = dependencies.blockedBy.some(
      (item) => item.task.completedAt === null,
    );
    return {
      ...this.toSummary(
        membership,
        customFieldValuesByTask.get(taskId) ?? {},
        isBlocked,
      ),
      subtaskCount: subtaskMemberships.length,
      subtasks: subtaskMemberships.map((subtaskMembership) => ({
        ...this.toSummary(
          subtaskMembership,
          customFieldValuesByTask.get(subtaskMembership.task.id) ?? {},
          false,
        ),
        subtasks: [],
        subtaskCount: nestedSubtaskCounts.get(subtaskMembership.task.id) ?? 0,
      })),
      commentCount,
      customFields,
      memberships: allMemberships.map((item) => this.toMembershipDto(item)),
      attachments,
      dependencies,
    };
  }

  private buildAutomationEventParams(
    context: WorkspaceContext,
    task: Task,
    project: Project,
    assigneeUserId: string | null,
  ): {
    workspaceId: string;
    projectId: string;
    projectName: string;
    taskId: string;
    taskName: string;
    actorUserId: string;
    assigneeUserId: string | null;
    dueAt: string | null;
  } {
    return {
      workspaceId: context.workspace.id,
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskName: task.name,
      actorUserId: context.user.id,
      assigneeUserId,
      dueAt: task.dueAt?.toISOString() ?? null,
    };
  }

  private toMembershipDto(membership: TaskMembership): TaskMembershipDto {
    return {
      id: membership.id,
      projectId: membership.project.id,
      projectName: membership.project.name,
      sectionId: membership.section?.id ?? null,
      sectionName: membership.section?.name ?? null,
      position: membership.position,
    };
  }

  private async findProjectInWorkspace(
    workspaceId: string,
    projectId: string,
    em: EntityManager = this.entityManager,
  ): Promise<Project> {
    const project = await em.findOne(Project, {
      id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async findSectionInProject(
    projectId: string,
    sectionId: string,
    em: EntityManager = this.entityManager,
  ): Promise<Section> {
    const section = await em.findOne(Section, {
      id: sectionId,
      project: projectId,
    });
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }
    return section;
  }

  private async resolveDefaultSection(
    projectId: string,
    em: EntityManager = this.entityManager,
  ): Promise<Section> {
    const sections = await em.find(
      Section,
      { project: projectId },
      { orderBy: { position: 'ASC' }, limit: 1 },
    );
    const firstSection = sections[0];
    if (!firstSection) {
      throw new BadRequestException('El proyecto no tiene secciones');
    }
    return firstSection;
  }

  private async resolveNextTaskPosition(
    projectId: string,
    sectionId: string,
    em: EntityManager = this.entityManager,
  ): Promise<number> {
    const memberships = await em.find(
      TaskMembership,
      {
        project: projectId,
        section: sectionId,
        task: { parentTask: null },
      },
      { orderBy: { position: 'DESC' }, limit: 1, populate: ['task'] },
    );
    const lastMembership = memberships[0];
    if (!lastMembership) {
      return DEFAULT_TASK_POSITION;
    }
    return lastMembership.position + TASK_POSITION_GAP;
  }

  private async resolveAssignee(
    workspaceId: string,
    assigneeId: string | undefined,
    em: EntityManager = this.entityManager,
  ): Promise<User | null> {
    if (!assigneeId) {
      return null;
    }
    const workspaceMember = await em.findOne(WorkspaceMember, {
      workspace: workspaceId,
      user: assigneeId,
    });
    if (!workspaceMember) {
      throw new BadRequestException('El asignado no pertenece a este workspace');
    }
    return em.findOneOrFail(User, { id: assigneeId });
  }

  private async assertProjectMember(
    projectId: string,
    userId: string,
    em: EntityManager = this.entityManager,
  ): Promise<ProjectMember> {
    const member = await em.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!member) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return member;
  }

  private async assertProjectEditor(
    projectId: string,
    userId: string,
    em: EntityManager = this.entityManager,
  ): Promise<ProjectMember> {
    const member = await this.assertProjectMember(projectId, userId, em);
    if (
      member.role !== ProjectAccessRole.ADMIN &&
      member.role !== ProjectAccessRole.EDITOR
    ) {
      throw new ForbiddenException('No tienes permiso para modificar tareas');
    }
    return member;
  }

  private async assertTaskAccess(
    workspaceId: string,
    taskId: string,
    userId: string,
    minimumRole: 'viewer' | 'editor',
    em: EntityManager = this.entityManager,
  ): Promise<TaskMembership> {
    const task = await em.findOne(Task, {
      id: taskId,
      workspace: workspaceId,
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const memberships = await em.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      { populate: ['project'] },
    );
    if (memberships.length === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const projectIds = memberships.map((membership) => membership.project.id);
    const projectMembers = await em.find(ProjectMember, {
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
    return this.pickPrimaryMembership(memberships) ?? memberships[0]!;
  }

  private async findPrimaryMembership(
    workspaceId: string,
    taskId: string,
    em: EntityManager = this.entityManager,
  ): Promise<TaskMembership> {
    const memberships = await em.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      { populate: ['project', 'section', 'task', 'task.assignee', 'task.parentTask'] },
    );
    if (memberships.length === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.pickPrimaryMembership(memberships) ?? memberships[0]!;
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

  private toSummary(
    membership: TaskMembership,
    customFieldValues: Record<string, CustomFieldValueDto> = {},
    isBlocked = false,
  ): TaskSummaryDto {
    const task = membership.task;
    const assignee: TaskAssigneeDto | null = task.assignee
      ? {
          userId: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
        }
      : null;
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      assignee,
      dueAt: task.dueAt?.toISOString() ?? null,
      dueHasTime: task.dueHasTime,
      startAt: task.startAt?.toISOString() ?? null,
      startHasTime: task.startHasTime,
      completedAt: task.completedAt?.toISOString() ?? null,
      parentTaskId: task.parentTask?.id ?? null,
      projectId: membership.project.id,
      projectName: membership.project.name,
      sectionId: membership.section?.id ?? null,
      position: membership.position,
      createdAt: task.createdAt?.toISOString() ?? new Date().toISOString(),
      customFieldValues,
      subtaskCount: 0,
      subtasks: [],
      isBlocked,
    };
  }

  private async countDirectSubtasksByParentIds(
    em: EntityManager,
    workspaceId: string,
    parentTaskIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (parentTaskIds.length === 0) {
      return counts;
    }
    const childTasks = await em.find(
      Task,
      {
        workspace: workspaceId,
        parentTask: { $in: parentTaskIds },
      },
      { populate: ['parentTask'] },
    );
    for (const childTask of childTasks) {
      const parentId = childTask.parentTask?.id;
      if (!parentId) {
        continue;
      }
      counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
    }
    return counts;
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private validateTaskDateRange(startAt: Date | null, dueAt: Date | null): void {
    if (!startAt || !dueAt) {
      return;
    }
    if (this.startOfUtcDay(startAt).getTime() > this.startOfUtcDay(dueAt).getTime()) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha límite',
      );
    }
  }
}
