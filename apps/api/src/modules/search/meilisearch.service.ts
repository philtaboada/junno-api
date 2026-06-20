import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import {
  SEARCH_ENGINE_MEILISEARCH,
  SEARCH_ENGINE_POSTGRES,
  SEARCH_INDEX_COMMENTS,
  SEARCH_INDEX_PROJECTS,
  SEARCH_INDEX_TASKS,
  SEARCH_RESULT_LIMIT,
} from './search.constants';
import type {
  CommentSearchDocument,
  ProjectSearchDocument,
  TaskSearchDocument,
} from './search-document.types';
import {
  buildProjectIdsInFilter,
  buildWorkspaceSearchFilter,
} from './meilisearch-filter.utils';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: Meilisearch | null = null;
  private isReady = false;

  constructor(private readonly configService: ConfigService) {}

  get isEnabled(): boolean {
    return this.readSearchEngine() === SEARCH_ENGINE_MEILISEARCH;
  }

  isAvailable(): boolean {
    return this.isEnabled && this.isReady;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }
    try {
      await this.initialize();
    } catch (error) {
      this.logger.warn(
        `Meilisearch unavailable at startup: ${this.formatError(error)}. Search will fall back to PostgreSQL.`,
      );
    }
  }

  async searchWorkspace(
    workspaceId: string,
    query: string,
    accessibleProjectIds: readonly string[],
  ): Promise<WorkspaceSearchResponseDto> {
    if (!this.client) {
      throw new Error('Meilisearch client is not initialized');
    }
    if (accessibleProjectIds.length === 0) {
      return { query, tasks: [], projects: [], comments: [] };
    }
    const membershipFilter = buildWorkspaceSearchFilter(
      workspaceId,
      accessibleProjectIds,
      'projectIds',
    );
    const workspaceFilter = buildWorkspaceSearchFilter(
      workspaceId,
      accessibleProjectIds,
      'id',
    );
    const response = await this.client.multiSearch({
      queries: [
        {
          indexUid: SEARCH_INDEX_PROJECTS,
          q: query,
          filter: workspaceFilter,
          limit: SEARCH_RESULT_LIMIT,
        },
        {
          indexUid: SEARCH_INDEX_TASKS,
          q: query,
          filter: membershipFilter,
          limit: SEARCH_RESULT_LIMIT,
        },
        {
          indexUid: SEARCH_INDEX_COMMENTS,
          q: query,
          filter: membershipFilter,
          limit: SEARCH_RESULT_LIMIT,
        },
      ],
    });
    const [projectsResult, tasksResult, commentsResult] = response.results;
    const projectHits = projectsResult.hits as ProjectSearchDocument[];
    const taskHits = tasksResult.hits as TaskSearchDocument[];
    const commentHits = commentsResult.hits as CommentSearchDocument[];
    return {
      query,
      projects: projectHits.map((document) => ({
        id: document.id,
        name: document.name,
        teamName: document.teamName,
      })),
      tasks: taskHits.map((document) => ({
        id: document.id,
        name: document.name,
        projectId: document.projectId,
        projectName: document.projectName,
        completedAt: document.completedAt,
      })),
      comments: commentHits.map((document) => ({
        id: document.id,
        body: document.body,
        taskId: document.taskId,
        taskName: document.taskName,
        projectId: document.projectId,
        projectName: document.projectName,
      })),
    };
  }

  async indexProjects(documents: readonly ProjectSearchDocument[]): Promise<void> {
    if (!this.isAvailable() || documents.length === 0) {
      return;
    }
    await this.client!.index(SEARCH_INDEX_PROJECTS).addDocuments(
      [...documents],
      { primaryKey: 'id' },
    );
  }

  async indexTasks(documents: readonly TaskSearchDocument[]): Promise<void> {
    if (!this.isAvailable() || documents.length === 0) {
      return;
    }
    await this.client!.index(SEARCH_INDEX_TASKS).addDocuments([...documents], {
      primaryKey: 'id',
    });
  }

  async indexComments(documents: readonly CommentSearchDocument[]): Promise<void> {
    if (!this.isAvailable() || documents.length === 0) {
      return;
    }
    await this.client!.index(SEARCH_INDEX_COMMENTS).addDocuments(
      [...documents],
      { primaryKey: 'id' },
    );
  }

  async removeProject(projectId: string): Promise<void> {
    await this.removeDocument(SEARCH_INDEX_PROJECTS, projectId);
  }

  async removeTask(taskId: string): Promise<void> {
    await this.removeDocument(SEARCH_INDEX_TASKS, taskId);
  }

  async removeComment(commentId: string): Promise<void> {
    await this.removeDocument(SEARCH_INDEX_COMMENTS, commentId);
  }

  private async initialize(): Promise<void> {
    const url = this.configService.get<string>('MEILI_URL');
    const apiKey = this.configService.get<string>('MEILI_MASTER_KEY');
    if (!url || !apiKey) {
      throw new Error('MEILI_URL and MEILI_MASTER_KEY are required');
    }
    this.client = new Meilisearch({ host: url, apiKey });
    await this.client.health();
    await this.ensureIndexes();
    this.isReady = true;
    this.logger.log('Meilisearch indexes ready');
  }

  private async ensureIndexes(): Promise<void> {
    await this.client!.createIndex(SEARCH_INDEX_PROJECTS, { primaryKey: 'id' });
    await this.client!.createIndex(SEARCH_INDEX_TASKS, { primaryKey: 'id' });
    await this.client!.createIndex(SEARCH_INDEX_COMMENTS, { primaryKey: 'id' });
    await this.client!.index(SEARCH_INDEX_PROJECTS).updateSettings({
      searchableAttributes: ['name', 'teamName'],
      filterableAttributes: ['workspaceId', 'id', 'teamId'],
    });
    await this.client!.index(SEARCH_INDEX_TASKS).updateSettings({
      searchableAttributes: ['name'],
      filterableAttributes: ['workspaceId', 'projectIds', 'projectId'],
    });
    await this.client!.index(SEARCH_INDEX_COMMENTS).updateSettings({
      searchableAttributes: ['body', 'taskName'],
      filterableAttributes: ['workspaceId', 'projectIds', 'projectId', 'taskId'],
    });
  }

  private async removeDocument(indexUid: string, documentId: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }
    await this.client!.index(indexUid).deleteDocument(documentId);
  }

  private readSearchEngine(): string {
    return (
      this.configService.get<string>('SEARCH_ENGINE') ?? SEARCH_ENGINE_POSTGRES
    ).toLowerCase();
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
