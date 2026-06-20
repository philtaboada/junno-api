import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CommentAuthorDto,
  CommentDto,
  MyTasksDto,
  MyTasksSectionDto,
  MyTasksSectionId,
  ProjectTasksDto,
  TaskDetailDto,
  TaskSummaryDto,
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
import { TaskInboxEventsService } from '../notifications/task-inbox-events.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { SearchIndexerService } from '../search/search-indexer.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly taskInboxEventsService: TaskInboxEventsService,
    private readonly searchIndexerService: SearchIndexerService,
  ) {}

  async listForTask(
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<CommentDto[]> {
    await this.findAccessibleTask(workspaceId, taskId, 'viewer', userId);
    const comments = await this.entityManager.find(
      Comment,
      { task: taskId, workspace: workspaceId },
      {
        populate: ['author'],
        orderBy: { createdAt: 'ASC' },
      },
    );
    return comments.map((comment) => this.toComment(comment));
  }

  async createForTask(
    context: WorkspaceContext,
    taskId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const task = await this.findAccessibleTask(
      context.workspace.id,
      taskId,
      'commenter',
      context.user.id,
    );
    const author = await this.entityManager.findOneOrFail(User, {
      id: context.user.id,
    });
    const workspace = this.entityManager.getReference(
      Workspace,
      context.workspace.id,
    );
    const comment = this.entityManager.create(Comment, {
      workspace,
      task,
      author,
      body: createCommentDto.body.trim(),
    });
    await this.entityManager.flush();
    await this.entityManager.populate(comment, ['author', 'task', 'task.assignee']);
    const primaryMembership = await this.findPrimaryMembership(
      context.workspace.id,
      taskId,
    );
    const commentPreview =
      comment.body.length > 120 ? `${comment.body.slice(0, 117)}…` : comment.body;
    await this.taskInboxEventsService.notifyTaskCommentAdded({
      workspaceId: context.workspace.id,
      actorUserId: context.user.id,
      assigneeUserId: comment.task.assignee?.id ?? null,
      taskId,
      taskName: comment.task.name,
      projectId: primaryMembership.project.id,
      projectName: primaryMembership.project.name,
      commentId: comment.id,
      commentPreview,
    });
    this.searchIndexerService.syncComment(comment.id, context.workspace.id);
    return this.toComment(comment);
  }

  private async findPrimaryMembership(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskMembership> {
    const memberships = await this.entityManager.find(
      TaskMembership,
      { task: taskId, workspace: workspaceId },
      { populate: ['project'] },
    );
    if (memberships.length === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return [...memberships].sort((left, right) =>
      left.project.name.localeCompare(right.project.name),
    )[0]!;
  }

  private async findAccessibleTask(
    workspaceId: string,
    taskId: string,
    minimumRole: 'viewer' | 'commenter',
    userId?: string,
  ): Promise<Task> {
    const task = await this.entityManager.findOne(Task, {
      id: taskId,
      workspace: workspaceId,
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    if (!userId) {
      return task;
    }
    const memberships = await this.entityManager.find(
      TaskMembership,
      { task: taskId },
      { populate: ['project'] },
    );
    if (memberships.length === 0) {
      throw new ForbiddenException('No tienes acceso a esta tarea');
    }
    const projectIds = memberships.map((membership) => membership.project.id);
    const projectMembers = await this.entityManager.find(ProjectMember, {
      project: { $in: projectIds },
      user: userId,
    });
    const hasAccess = projectMembers.some((member) =>
      this.hasMinimumRole(member.role, minimumRole),
    );
    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para acceder a esta tarea');
    }
    return task;
  }

  private hasMinimumRole(
    role: ProjectAccessRole,
    minimumRole: 'viewer' | 'commenter',
  ): boolean {
    if (minimumRole === 'viewer') {
      return true;
    }
    return (
      role === ProjectAccessRole.COMMENTER ||
      role === ProjectAccessRole.EDITOR ||
      role === ProjectAccessRole.ADMIN
    );
  }

  private toComment(comment: Comment): CommentDto {
    const author: CommentAuthorDto = {
      userId: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
    };
    return {
      id: comment.id,
      taskId: comment.task.id,
      author,
      body: comment.body,
      createdAt: comment.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
