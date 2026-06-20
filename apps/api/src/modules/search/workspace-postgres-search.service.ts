import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import { Comment } from '../comments/entities/comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { SEARCH_RESULT_LIMIT } from './search.constants';

@Injectable()
export class WorkspacePostgresSearchService {
  constructor(private readonly entityManager: EntityManager) {}

  async search(
    workspaceId: string,
    userId: string,
    query: string,
  ): Promise<WorkspaceSearchResponseDto> {
    const pattern = `%${query}%`;
    const accessibleProjects = await this.entityManager.find(
      ProjectMember,
      { user: userId, project: { workspace: workspaceId } },
      { populate: ['project', 'project.team'] },
    );
    const projectIds = accessibleProjects.map((member) => member.project.id);
    if (projectIds.length === 0) {
      return { query, tasks: [], projects: [], comments: [] };
    }
    const projects = accessibleProjects
      .filter((member) =>
        member.project.name.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((member) => ({
        id: member.project.id,
        name: member.project.name,
        teamName: member.project.team.name,
      }));
    const memberships = await this.entityManager.find(
      TaskMembership,
      {
        workspace: workspaceId,
        project: { $in: projectIds },
        task: { name: { $ilike: pattern }, parentTask: null },
      },
      {
        populate: ['task', 'project'],
        orderBy: { task: { name: 'ASC' } },
        limit: 30,
      },
    );
    const taskResults: WorkspaceSearchResponseDto['tasks'] = [];
    const seenTaskIds = new Set<string>();
    for (const membership of memberships) {
      if (seenTaskIds.has(membership.task.id)) {
        continue;
      }
      seenTaskIds.add(membership.task.id);
      taskResults.push({
        id: membership.task.id,
        name: membership.task.name,
        projectId: membership.project.id,
        projectName: membership.project.name,
        completedAt: membership.task.completedAt?.toISOString() ?? null,
      });
      if (taskResults.length >= SEARCH_RESULT_LIMIT) {
        break;
      }
    }
    const comments = await this.entityManager.find(
      Comment,
      {
        workspace: workspaceId,
        body: { $ilike: pattern },
        task: {
          memberships: { project: { $in: projectIds } },
        },
      },
      {
        populate: ['task', 'task.memberships.project'],
        orderBy: { createdAt: 'DESC' },
        limit: SEARCH_RESULT_LIMIT,
      },
    );
    const commentResults = comments.map((comment) => {
      const membership = [...comment.task.memberships.getItems()].sort(
        (left, right) => left.project.name.localeCompare(right.project.name),
      )[0];
      return {
        id: comment.id,
        body: comment.body,
        taskId: comment.task.id,
        taskName: comment.task.name,
        projectId: membership?.project.id ?? '',
        projectName: membership?.project.name ?? '',
      };
    });
    return {
      query,
      tasks: taskResults,
      projects,
      comments: commentResults,
    };
  }
}
