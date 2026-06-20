import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import { ProjectMember } from '../projects/entities/project-member.entity';
import {
  isWorkspaceSearchQueryEmpty,
  normalizeWorkspaceSearchQuery,
} from '../workspaces/workspace-search.utils';
import { MeilisearchService } from './meilisearch.service';
import { WorkspacePostgresSearchService } from './workspace-postgres-search.service';

@Injectable()
export class WorkspaceSearchService {
  private readonly logger = new Logger(WorkspaceSearchService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly meilisearchService: MeilisearchService,
    private readonly postgresSearchService: WorkspacePostgresSearchService,
  ) {}

  async search(
    workspaceId: string,
    userId: string,
    rawQuery?: string,
  ): Promise<WorkspaceSearchResponseDto> {
    const query = normalizeWorkspaceSearchQuery(rawQuery);
    if (isWorkspaceSearchQueryEmpty(query)) {
      return { query, tasks: [], projects: [], comments: [] };
    }
    if (this.meilisearchService.isAvailable()) {
      try {
        const accessibleProjectIds = await this.loadAccessibleProjectIds(
          workspaceId,
          userId,
        );
        return await this.meilisearchService.searchWorkspace(
          workspaceId,
          query,
          accessibleProjectIds,
        );
      } catch (error) {
        this.logger.warn(
          `Meilisearch search failed, falling back to PostgreSQL: ${this.formatError(error)}`,
        );
      }
    }
    return this.postgresSearchService.search(workspaceId, userId, query);
  }

  private async loadAccessibleProjectIds(
    workspaceId: string,
    userId: string,
  ): Promise<string[]> {
    const members = await this.entityManager.find(
      ProjectMember,
      { user: userId, project: { workspace: workspaceId } },
      { populate: ['project'] },
    );
    return members.map((member) => member.project.id);
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
