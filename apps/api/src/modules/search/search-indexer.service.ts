import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Comment } from '../comments/entities/comment.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import type {
  CommentSearchDocument,
  ProjectSearchDocument,
  TaskSearchDocument,
} from './search-document.types';
import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  syncTask(taskId: string, workspaceId: string): void {
    this.schedule(async () => {
      await this.indexTask(taskId, workspaceId);
    });
  }

  syncProject(projectId: string, workspaceId: string): void {
    this.schedule(async () => {
      await this.indexProject(projectId, workspaceId);
    });
  }

  syncProjectWithTasks(projectId: string, workspaceId: string): void {
    this.schedule(async () => {
      await this.indexProject(projectId, workspaceId);
      await this.reindexTasksForProject(projectId, workspaceId);
    });
  }

  syncComment(commentId: string, workspaceId: string): void {
    this.schedule(async () => {
      await this.indexComment(commentId, workspaceId);
    });
  }

  syncCommentsForTask(taskId: string, workspaceId: string): void {
    this.schedule(async () => {
      const comments = await this.entityManager.find(
        Comment,
        { task: taskId, workspace: workspaceId },
        { fields: ['id'] },
      );
      for (const comment of comments) {
        await this.indexComment(comment.id, workspaceId);
      }
    });
  }

  removeTask(taskId: string, commentIds: readonly string[] = []): void {
    this.schedule(async () => {
      await this.meilisearchService.removeTask(taskId);
      for (const commentId of commentIds) {
        await this.meilisearchService.removeComment(commentId);
      }
    });
  }

  removeProject(
    projectId: string,
    workspaceId: string,
    taskIds: readonly string[],
  ): void {
    this.schedule(async () => {
      await this.meilisearchService.removeProject(projectId);
      for (const taskId of taskIds) {
        await this.indexTask(taskId, workspaceId);
      }
    });
  }

  async reindexWorkspace(workspaceId: string): Promise<void> {
    if (!this.meilisearchService.isAvailable()) {
      return;
    }
    const projects = await this.entityManager.find(
      Project,
      { workspace: workspaceId },
      { populate: ['team'] },
    );
    await this.meilisearchService.indexProjects(
      projects.map((project) => this.toProjectDocument(project)),
    );
    const tasks = await this.entityManager.find(
      Task,
      { workspace: workspaceId, parentTask: null },
      { populate: ['memberships.project'] },
    );
    const taskDocuments = tasks
      .map((task) => this.toTaskDocument(task, workspaceId))
      .filter((document): document is TaskSearchDocument => document !== null);
    await this.meilisearchService.indexTasks(taskDocuments);
    const comments = await this.entityManager.find(
      Comment,
      { workspace: workspaceId },
      { populate: ['task', 'task.memberships.project'] },
    );
    const commentDocuments = comments
      .map((comment) => this.toCommentDocument(comment, workspaceId))
      .filter(
        (document): document is CommentSearchDocument => document !== null,
      );
    await this.meilisearchService.indexComments(commentDocuments);
    this.logger.log(`Reindexed workspace ${workspaceId}`);
  }

  async reindexAllWorkspaces(): Promise<void> {
    if (!this.meilisearchService.isAvailable()) {
      throw new Error('Meilisearch is not available');
    }
    const workspaces = await this.entityManager.find(Workspace, {});
    for (const workspace of workspaces) {
      await this.reindexWorkspace(workspace.id);
    }
  }

  private async indexTask(taskId: string, workspaceId: string): Promise<void> {
    const task = await this.entityManager.findOne(
      Task,
      { id: taskId, workspace: workspaceId },
      { populate: ['parentTask', 'memberships.project'] },
    );
    if (!task || task.parentTask) {
      await this.meilisearchService.removeTask(taskId);
      return;
    }
    const document = this.toTaskDocument(task, workspaceId);
    if (!document) {
      await this.meilisearchService.removeTask(taskId);
      return;
    }
    await this.meilisearchService.indexTasks([document]);
  }

  private async indexProject(
    projectId: string,
    workspaceId: string,
  ): Promise<void> {
    const project = await this.entityManager.findOne(
      Project,
      { id: projectId, workspace: workspaceId },
      { populate: ['team'] },
    );
    if (!project) {
      await this.meilisearchService.removeProject(projectId);
      return;
    }
    await this.meilisearchService.indexProjects([
      this.toProjectDocument(project),
    ]);
  }

  private async indexComment(
    commentId: string,
    workspaceId: string,
  ): Promise<void> {
    const comment = await this.entityManager.findOne(
      Comment,
      { id: commentId, workspace: workspaceId },
      { populate: ['task', 'task.memberships.project'] },
    );
    if (!comment) {
      await this.meilisearchService.removeComment(commentId);
      return;
    }
    const document = this.toCommentDocument(comment, workspaceId);
    if (!document) {
      await this.meilisearchService.removeComment(commentId);
      return;
    }
    await this.meilisearchService.indexComments([document]);
  }

  private async reindexTasksForProject(
    projectId: string,
    workspaceId: string,
  ): Promise<void> {
    const memberships = await this.entityManager.find(
      TaskMembership,
      { project: projectId, workspace: workspaceId },
      { populate: ['task.parentTask', 'task.memberships.project'] },
    );
    const taskIds = [...new Set(memberships.map((membership) => membership.task.id))];
    for (const taskId of taskIds) {
      await this.indexTask(taskId, workspaceId);
    }
    const comments = await this.entityManager.find(
      Comment,
      {
        workspace: workspaceId,
        task: { memberships: { project: projectId } },
      },
      { populate: ['task', 'task.memberships.project'] },
    );
    for (const comment of comments) {
      await this.indexComment(comment.id, workspaceId);
    }
  }

  private toProjectDocument(project: Project): ProjectSearchDocument {
    return {
      id: project.id,
      workspaceId: project.workspace.id,
      name: project.name,
      teamId: project.team.id,
      teamName: project.team.name,
    };
  }

  private toTaskDocument(
    task: Task,
    workspaceId: string,
  ): TaskSearchDocument | null {
    const memberships = task.memberships.isInitialized()
      ? task.memberships.getItems()
      : [];
    if (memberships.length === 0) {
      return null;
    }
    const primaryMembership = this.pickPrimaryMembership(memberships);
    return {
      id: task.id,
      workspaceId,
      name: task.name,
      projectIds: memberships.map((membership) => membership.project.id),
      projectId: primaryMembership.project.id,
      projectName: primaryMembership.project.name,
      completedAt: task.completedAt?.toISOString() ?? null,
    };
  }

  private toCommentDocument(
    comment: Comment,
    workspaceId: string,
  ): CommentSearchDocument | null {
    const memberships = comment.task.memberships.isInitialized()
      ? comment.task.memberships.getItems()
      : [];
    if (memberships.length === 0) {
      return null;
    }
    const primaryMembership = this.pickPrimaryMembership(memberships);
    return {
      id: comment.id,
      workspaceId,
      body: comment.body,
      taskId: comment.task.id,
      taskName: comment.task.name,
      projectIds: memberships.map((membership) => membership.project.id),
      projectId: primaryMembership.project.id,
      projectName: primaryMembership.project.name,
    };
  }

  private pickPrimaryMembership(
    memberships: readonly TaskMembership[],
  ): TaskMembership {
    return [...memberships].sort((left, right) =>
      left.project.name.localeCompare(right.project.name),
    )[0]!;
  }

  private schedule(operation: () => Promise<void>): void {
    if (!this.meilisearchService.isEnabled) {
      return;
    }
    void operation().catch((error) => {
      this.logger.warn(
        `Search index sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
}
