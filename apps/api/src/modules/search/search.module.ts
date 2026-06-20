import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Comment } from '../comments/entities/comment.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { MeilisearchService } from './meilisearch.service';
import { SearchIndexerService } from './search-indexer.service';
import { WorkspacePostgresSearchService } from './workspace-postgres-search.service';
import { WorkspaceSearchService } from './workspace-search.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Project,
      Task,
      TaskMembership,
      Comment,
      Workspace,
    ]),
  ],
  providers: [
    MeilisearchService,
    WorkspacePostgresSearchService,
    WorkspaceSearchService,
    SearchIndexerService,
  ],
  exports: [WorkspaceSearchService, SearchIndexerService, MeilisearchService],
})
export class SearchModule {}
