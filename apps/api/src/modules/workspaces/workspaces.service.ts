import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  WorkspaceMemberDto,
  WorkspaceMembersSearchResponseDto,
  WorkspaceSearchResponseDto,
  WorkspaceRole as WorkspaceRoleDto,
  WorkspaceSummaryDto,
  WorkspaceTeamGroupDto,
  WorkspaceType as WorkspaceTypeDto,
} from '@pm/contracts';
import { User } from '../auth/entities/user.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { SearchWorkspaceDto } from './dto/search-workspace.dto';
import { SearchWorkspaceMembersDto } from './dto/search-workspace-members.dto';
import { WorkspaceSearchService } from '../search/workspace-search.service';
import {
  WorkspaceMember,
  WorkspaceRole,
} from './entities/workspace-member.entity';
import { Workspace, WorkspaceType } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly workspaceSearchService: WorkspaceSearchService,
  ) {}

  async listForUser(userId: string): Promise<WorkspaceSummaryDto[]> {
    const memberships = await this.entityManager.find(
      WorkspaceMember,
      { user: userId },
      { populate: ['workspace'], orderBy: { joinedAt: 'ASC' } },
    );
    return memberships.map((membership) => this.toSummary(membership));
  }

  async createForUser(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceSummaryDto> {
    return this.entityManager.transactional(async (em) => {
      const user = await em.findOneOrFail(User, { id: userId });
      const workspace = em.create(Workspace, {
        name: createWorkspaceDto.name.trim(),
        type: WorkspaceType.PERSONAL,
      });
      const membership = em.create(WorkspaceMember, {
        user,
        workspace,
        role: WorkspaceRole.ADMIN,
      });
      await em.flush();
      membership.workspace = workspace;
      return this.toSummary(membership);
    });
  }

  async getForUser(userId: string, workspaceId: string): Promise<WorkspaceSummaryDto> {
    const membership = await this.entityManager.findOne(
      WorkspaceMember,
      { user: userId, workspace: workspaceId },
      { populate: ['workspace'] },
    );
    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }
    return this.toSummary(membership);
  }

  async findMembership(userId: string, workspaceId: string): Promise<WorkspaceMember | null> {
    return this.entityManager.findOne(
      WorkspaceMember,
      { user: userId, workspace: workspaceId },
      { populate: ['workspace', 'user'] },
    );
  }

  async searchMembers(
    workspaceId: string,
    searchWorkspaceMembersDto: SearchWorkspaceMembersDto,
  ): Promise<WorkspaceMembersSearchResponseDto> {
    const query = searchWorkspaceMembersDto.q?.trim() ?? '';
    const teamId = searchWorkspaceMembersDto.teamId;
    const excludeTeamId = searchWorkspaceMembersDto.excludeTeamId;
    const excludeProjectId = searchWorkspaceMembersDto.excludeProjectId;
    let allowedUserIds: Set<string> | null = null;
    if (teamId) {
      const teamMembers = await this.entityManager.find(
        TeamMember,
        { team: { id: teamId, workspace: workspaceId } },
        { populate: ['user'] },
      );
      allowedUserIds = new Set(teamMembers.map((member) => member.user.id));
    }
    let excludedUserIds = new Set<string>();
    if (excludeTeamId) {
      const excludedMembers = await this.entityManager.find(TeamMember, {
        team: { id: excludeTeamId, workspace: workspaceId },
      });
      excludedUserIds = new Set(excludedMembers.map((member) => member.user.id));
    }
    if (excludeProjectId) {
      const excludedProjectMembers = await this.entityManager.find(ProjectMember, {
        project: { id: excludeProjectId, workspace: workspaceId },
      });
      for (const member of excludedProjectMembers) {
        excludedUserIds.add(member.user.id);
      }
    }
    const memberships = await this.entityManager.find(
      WorkspaceMember,
      { workspace: workspaceId },
      { populate: ['user'], orderBy: { user: { name: 'ASC' } } },
    );
    const members = memberships
      .filter((membership) => {
        const userId = membership.user.id;
        if (allowedUserIds && !allowedUserIds.has(userId)) {
          return false;
        }
        if (excludedUserIds.has(userId)) {
          return false;
        }
        if (!query) {
          return true;
        }
        const normalizedQuery = query.toLowerCase();
        return (
          membership.user.name.toLowerCase().includes(normalizedQuery) ||
          membership.user.email.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 12)
      .map((membership) => this.toWorkspaceMember(membership));
    const teamFilter: Record<string, unknown> = { workspace: workspaceId };
    if (excludeTeamId) {
      teamFilter.id = { $ne: excludeTeamId };
    }
    const teams = await this.entityManager.find(Team, teamFilter, {
      populate: ['members'],
      orderBy: { name: 'ASC' },
    });
    const teamResults = teams
      .filter((team) => {
        if (!query) {
          return true;
        }
        return team.name.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, 6)
      .map((team) => this.toWorkspaceTeamGroup(team));
    return { members, teams: teamResults };
  }

  async searchWorkspace(
    workspaceId: string,
    userId: string,
    searchWorkspaceDto: SearchWorkspaceDto,
  ): Promise<WorkspaceSearchResponseDto> {
    return this.workspaceSearchService.search(
      workspaceId,
      userId,
      searchWorkspaceDto.q,
    );
  }

  private toWorkspaceMember(membership: WorkspaceMember): WorkspaceMemberDto {
    return {
      userId: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role as WorkspaceRoleDto,
    };
  }

  private toWorkspaceTeamGroup(team: Team): WorkspaceTeamGroupDto {
    return {
      id: team.id,
      name: team.name,
      memberCount: team.members.isInitialized() ? team.members.length : 0,
    };
  }

  private toSummary(membership: WorkspaceMember): WorkspaceSummaryDto {
    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      type: membership.workspace.type as WorkspaceTypeDto,
      role: membership.role as WorkspaceRoleDto,
    };
  }
}
