import { createHash, randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import type {
  AcceptTeamInvitationResponseDto,
  AddTeamMembersFromTeamResponseDto,
  InviteTeamMemberResponseDto,
  TeamAccessRole as TeamAccessRoleDto,
  TeamDetailDto,
  TeamInvitationLinkResponseDto,
  TeamInvitationPreviewDto,
  TeamMemberDto,
  TeamNotificationPreferencesDto,
  TeamPendingInvitationDto,
  TeamSummaryDto,
} from '@pm/contracts';
import type {
  AuthenticatedUser,
  WorkspaceContext,
} from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { ActivityEventType } from '../notifications/entities/activity-event.entity';
import { ActivityEventsService } from '../notifications/activity-events.service';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../workspaces/entities/workspace-member.entity';
import { TEAM_INVITATION_SENT_MESSAGE, TEAM_INVITATION_TTL_MS } from './constants/teams.constants';
import { AcceptTeamInvitationDto } from './dto/accept-team-invitation.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { AddTeamMembersFromTeamDto } from './dto/add-team-members-from-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UpdateTeamInvitationRoleDto } from './dto/update-team-invitation-role.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { UpdateTeamNotificationPreferencesDto } from './dto/update-team-notification-preferences.dto';
import { TeamInvitation } from './entities/team-invitation.entity';
import { TeamNotificationPreference } from './entities/team-notification-preference.entity';
import { TeamAccessRole, TeamMember } from './entities/team-member.entity';
import { Team } from './entities/team.entity';
import { TeamInvitationNotificationService } from './team-invitation-notification.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly teamInvitationNotification: TeamInvitationNotificationService,
    private readonly activityEventsService: ActivityEventsService,
  ) {}

  async listForWorkspace(workspaceId: string): Promise<TeamSummaryDto[]> {
    const teams = await this.entityManager.find(
      Team,
      { workspace: workspaceId },
      {
        populate: ['members'],
        orderBy: { name: 'ASC' },
      },
    );
    return teams.map((team) => this.toSummary(team));
  }

  async createForWorkspace(
    context: WorkspaceContext,
    createTeamDto: CreateTeamDto,
  ): Promise<TeamDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const workspace = await em.findOneOrFail(
        WorkspaceMember,
        {
          id: context.membership.id,
        },
        { populate: ['workspace', 'user'] },
      );
      const team = em.create(Team, {
        workspace: workspace.workspace,
        name: createTeamDto.name.trim(),
        description: createTeamDto.description?.trim() || null,
      });
      const creator = await em.findOneOrFail(User, { id: context.user.id });
      em.create(TeamMember, {
        team,
        user: creator,
        role: TeamAccessRole.EDITOR,
      });
      await em.flush();
      await em.populate(team, ['members.user']);
      return this.toDetail(team, []);
    });
  }

  async getForWorkspace(
    workspaceId: string,
    teamId: string,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async updateForWorkspace(
    workspaceId: string,
    teamId: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    if (updateTeamDto.name !== undefined) {
      team.name = updateTeamDto.name.trim();
    }
    if (updateTeamDto.description !== undefined) {
      team.description = updateTeamDto.description?.trim() || null;
    }
    await this.entityManager.flush();
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async removeForWorkspace(workspaceId: string, teamId: string): Promise<void> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    this.entityManager.remove(team);
    await this.entityManager.flush();
  }

  async inviteByEmail(
    context: WorkspaceContext,
    teamId: string,
    inviteTeamMemberDto: InviteTeamMemberDto,
  ): Promise<InviteTeamMemberResponseDto> {
    const email = this.normalizeEmail(inviteTeamMemberDto.email);
    if (email === this.normalizeEmail(context.user.email)) {
      throw new BadRequestException('No puedes invitarte a ti mismo');
    }
    const team = await this.findTeamInWorkspace(context.workspace.id, teamId);
    await this.entityManager.populate(team, ['workspace']);
    const existingUser = await this.entityManager.findOne(User, { email });
    if (existingUser) {
      const existingMember = await this.entityManager.findOne(TeamMember, {
        team: teamId,
        user: existingUser.id,
      });
      if (existingMember) {
        throw new BadRequestException('Esta persona ya es miembro del equipo');
      }
    }
    const inviteRole = inviteTeamMemberDto.role ?? TeamAccessRole.EDITOR;
    const plainToken = randomUUID();
    await this.entityManager.transactional(async (em) => {
      const pendingInvitations = await em.find(TeamInvitation, {
        team: teamId,
        email,
        acceptedAt: null,
        revokedAt: null,
      });
      for (const pendingInvitation of pendingInvitations) {
        pendingInvitation.revokedAt = new Date();
      }
      const inviter = await em.findOneOrFail(User, { id: context.user.id });
      em.create(TeamInvitation, {
        team,
        workspace: team.workspace,
        email,
        role: inviteRole,
        invitedBy: inviter,
        tokenHash: this.hashToken(plainToken),
        expiresAt: new Date(Date.now() + TEAM_INVITATION_TTL_MS),
      });
      await em.flush();
    });
    const inviteUrl = this.buildTeamInvitationUrl(plainToken);
    await this.teamInvitationNotification.sendInvitation({
      email,
      inviteUrl,
      teamName: team.name,
      workspaceName: team.workspace.name,
      inviterName: context.user.name,
    });
    return {
      message: TEAM_INVITATION_SENT_MESSAGE,
      inviteUrl,
    };
  }

  async getShareLink(
    context: WorkspaceContext,
    teamId: string,
  ): Promise<TeamInvitationLinkResponseDto> {
    const team = await this.findTeamInWorkspace(context.workspace.id, teamId);
    await this.entityManager.populate(team, ['workspace']);
    const plainToken = randomUUID();
    let invitation = await this.entityManager.findOne(TeamInvitation, {
      team: teamId,
      workspace: context.workspace.id,
      email: null,
      acceptedAt: null,
      revokedAt: null,
    });
    if (invitation) {
      invitation.tokenHash = this.hashToken(plainToken);
      invitation.expiresAt = new Date(Date.now() + TEAM_INVITATION_TTL_MS);
    } else {
      const inviter = await this.entityManager.findOneOrFail(User, { id: context.user.id });
      invitation = this.entityManager.create(TeamInvitation, {
        team,
        workspace: team.workspace,
        email: null,
        role: TeamAccessRole.EDITOR,
        invitedBy: inviter,
        tokenHash: this.hashToken(plainToken),
        expiresAt: new Date(Date.now() + TEAM_INVITATION_TTL_MS),
      });
    }
    await this.entityManager.flush();
    return {
      inviteUrl: this.buildTeamInvitationUrl(plainToken),
    };
  }

  async getInvitationLink(
    workspaceId: string,
    teamId: string,
    invitationId: string,
  ): Promise<TeamInvitationLinkResponseDto> {
    const invitation = await this.entityManager.findOne(TeamInvitation, {
      id: invitationId,
      team: teamId,
      workspace: workspaceId,
      acceptedAt: null,
      revokedAt: null,
    });
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('La invitación ha expirado');
    }
    const plainToken = randomUUID();
    invitation.tokenHash = this.hashToken(plainToken);
    invitation.expiresAt = new Date(Date.now() + TEAM_INVITATION_TTL_MS);
    await this.entityManager.flush();
    return {
      inviteUrl: this.buildTeamInvitationUrl(plainToken),
    };
  }

  async revokeInvitation(
    workspaceId: string,
    teamId: string,
    invitationId: string,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    const invitation = await this.entityManager.findOne(TeamInvitation, {
      id: invitationId,
      team: teamId,
      workspace: workspaceId,
      acceptedAt: null,
      revokedAt: null,
    });
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }
    invitation.revokedAt = new Date();
    await this.entityManager.flush();
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async updateInvitationRoleForWorkspace(
    workspaceId: string,
    teamId: string,
    invitationId: string,
    updateTeamInvitationRoleDto: UpdateTeamInvitationRoleDto,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    const invitation = await this.entityManager.findOne(TeamInvitation, {
      id: invitationId,
      team: teamId,
      workspace: workspaceId,
      acceptedAt: null,
      revokedAt: null,
    });
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('La invitación ha expirado');
    }
    invitation.role = updateTeamInvitationRoleDto.role;
    await this.entityManager.flush();
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async addMemberByUserId(
    context: WorkspaceContext,
    teamId: string,
    addTeamMemberDto: AddTeamMemberDto,
  ): Promise<TeamDetailDto> {
    if (addTeamMemberDto.userId === context.user.id) {
      throw new BadRequestException('No puedes añadirte a ti mismo');
    }
    const team = await this.findTeamInWorkspace(context.workspace.id, teamId);
    await this.entityManager.populate(team, ['workspace', 'members.user']);
    const workspaceMember = await this.entityManager.findOne(WorkspaceMember, {
      workspace: context.workspace.id,
      user: addTeamMemberDto.userId,
    });
    if (!workspaceMember) {
      throw new BadRequestException('El usuario no pertenece a este workspace');
    }
    const existingMember = await this.entityManager.findOne(TeamMember, {
      team: teamId,
      user: addTeamMemberDto.userId,
    });
    if (existingMember) {
      throw new BadRequestException('Esta persona ya es miembro del equipo');
    }
    const memberUser = await this.entityManager.findOneOrFail(User, {
      id: addTeamMemberDto.userId,
    });
    const memberRole = addTeamMemberDto.role ?? TeamAccessRole.EDITOR;
    this.entityManager.create(TeamMember, {
      team,
      user: memberUser,
      role: memberRole,
    });
    await this.entityManager.flush();
    await this.notifyTeamMembersOnJoin({
      team,
      workspaceId: context.workspace.id,
      joiningUser: memberUser,
      addedByUserId: context.user.id,
    });
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async addMembersFromTeam(
    context: WorkspaceContext,
    teamId: string,
    addTeamMembersFromTeamDto: AddTeamMembersFromTeamDto,
  ): Promise<AddTeamMembersFromTeamResponseDto> {
    if (addTeamMembersFromTeamDto.sourceTeamId === teamId) {
      throw new BadRequestException('No puedes añadir un equipo a sí mismo');
    }
    const team = await this.findTeamInWorkspace(context.workspace.id, teamId);
    const sourceTeam = await this.findTeamInWorkspace(
      context.workspace.id,
      addTeamMembersFromTeamDto.sourceTeamId,
    );
    await this.entityManager.populate(sourceTeam, ['members.user']);
    const existingMemberIds = new Set(
      (
        await this.entityManager.find(TeamMember, { team: teamId }, { populate: ['user'] })
      ).map((member) => member.user.id),
    );
    const memberRole = addTeamMembersFromTeamDto.role ?? TeamAccessRole.EDITOR;
    const addedUsers: User[] = [];
    for (const sourceMember of sourceTeam.members.getItems()) {
      if (existingMemberIds.has(sourceMember.user.id)) {
        continue;
      }
      this.entityManager.create(TeamMember, {
        team,
        user: sourceMember.user,
        role: memberRole,
      });
      addedUsers.push(sourceMember.user);
      existingMemberIds.add(sourceMember.user.id);
    }
    await this.entityManager.flush();
    if (addedUsers.length > 0) {
      await this.entityManager.populate(team, ['workspace']);
      await this.notifyTeamMembersBulkAdded({
        team,
        workspaceId: context.workspace.id,
        sourceTeamName: sourceTeam.name,
        addedCount: addedUsers.length,
        actorUserId: context.user.id,
      });
    }
    return {
      addedCount: addedUsers.length,
      message:
        addedUsers.length > 0
          ? `Se añadieron ${addedUsers.length} miembros desde ${sourceTeam.name}`
          : 'No había miembros nuevos para añadir',
    };
  }

  async getNotificationPreferences(
    context: WorkspaceContext,
    teamId: string,
  ): Promise<TeamNotificationPreferencesDto> {
    await this.findTeamInWorkspace(context.workspace.id, teamId);
    return this.resolveNotificationPreferences(teamId, context.user.id);
  }

  async updateNotificationPreferences(
    context: WorkspaceContext,
    teamId: string,
    updateTeamNotificationPreferencesDto: UpdateTeamNotificationPreferencesDto,
  ): Promise<TeamNotificationPreferencesDto> {
    const team = await this.findTeamInWorkspace(context.workspace.id, teamId);
    let preference = await this.entityManager.findOne(TeamNotificationPreference, {
      team: teamId,
      user: context.user.id,
    });
    if (!preference) {
      const user = await this.entityManager.findOneOrFail(User, { id: context.user.id });
      preference = this.entityManager.create(TeamNotificationPreference, {
        team,
        user,
        notifyOnInvite: true,
        notifyOnJoin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    if (updateTeamNotificationPreferencesDto.notifyOnInvite !== undefined) {
      preference.notifyOnInvite = updateTeamNotificationPreferencesDto.notifyOnInvite;
    }
    if (updateTeamNotificationPreferencesDto.notifyOnJoin !== undefined) {
      preference.notifyOnJoin = updateTeamNotificationPreferencesDto.notifyOnJoin;
    }
    await this.entityManager.flush();
    return {
      notifyOnInvite: preference.notifyOnInvite,
      notifyOnJoin: preference.notifyOnJoin,
    };
  }

  async previewInvitation(token: string): Promise<TeamInvitationPreviewDto> {
    if (!token?.trim()) {
      throw new BadRequestException('La invitación no es válida o ya fue usada');
    }
    const invitation = await this.findActiveInvitation(token);
    await this.entityManager.populate(invitation, ['team', 'workspace', 'invitedBy']);
    const isExpired = invitation.expiresAt.getTime() <= Date.now();
    return {
      teamName: invitation.team.name,
      workspaceName: invitation.workspace.name,
      inviterName: invitation.invitedBy.name,
      inviteeEmail: invitation.email,
      isShareLink: invitation.email === null,
      role: invitation.role as TeamAccessRoleDto,
      isExpired,
    };
  }

  async acceptInvitation(
    user: AuthenticatedUser,
    acceptTeamInvitationDto: AcceptTeamInvitationDto,
  ): Promise<AcceptTeamInvitationResponseDto> {
    const invitation = await this.findActiveInvitation(acceptTeamInvitationDto.token);
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('La invitación ha expirado');
    }
    if (
      invitation.email !== null &&
      this.normalizeEmail(user.email) !== invitation.email
    ) {
      throw new ForbiddenException(
        'Debes iniciar sesión con el email al que se envió la invitación',
      );
    }
    let isNewTeamMember = false;
    const result = await this.entityManager.transactional(async (em) => {
      await em.populate(invitation, ['team', 'workspace']);
      const existingMember = await em.findOne(TeamMember, {
        team: invitation.team.id,
        user: user.id,
      });
      if (!existingMember) {
        isNewTeamMember = true;
        const memberUser = await em.findOneOrFail(User, { id: user.id });
        em.create(TeamMember, {
          team: invitation.team,
          user: memberUser,
          role: invitation.role,
        });
      }
      let workspaceMember = await em.findOne(WorkspaceMember, {
        workspace: invitation.workspace.id,
        user: user.id,
      });
      if (!workspaceMember) {
        const memberUser = await em.findOneOrFail(User, { id: user.id });
        workspaceMember = em.create(WorkspaceMember, {
          workspace: invitation.workspace,
          user: memberUser,
          role: WorkspaceRole.MEMBER,
        });
      }
      invitation.acceptedAt = new Date();
      await em.flush();
      return {
        teamId: invitation.team.id,
        workspaceId: invitation.workspace.id,
        teamName: invitation.team.name,
      };
    });
    if (isNewTeamMember) {
      const joiningUser = await this.entityManager.findOneOrFail(User, { id: user.id });
      const team = await this.entityManager.findOneOrFail(
        Team,
        { id: result.teamId },
        { populate: ['workspace', 'members.user'] },
      );
      await this.notifyTeamMembersOnJoin({
        team,
        workspaceId: result.workspaceId,
        joiningUser,
      });
    }
    return result;
  }

  async updateMemberRoleForWorkspace(
    workspaceId: string,
    teamId: string,
    userId: string,
    updateTeamMemberRoleDto: UpdateTeamMemberRoleDto,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    await this.entityManager.populate(team, ['members.user']);
    const member = await this.entityManager.findOne(
      TeamMember,
      { team: teamId, user: userId },
      { populate: ['user'] },
    );
    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }
    const ownerUserId = this.resolveOwnerUserId(team.members.getItems());
    if (ownerUserId === userId) {
      throw new BadRequestException('No puedes cambiar el rol del creador del equipo');
    }
    member.role = updateTeamMemberRoleDto.role;
    await this.entityManager.flush();
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  async removeMemberForWorkspace(
    workspaceId: string,
    teamId: string,
    userId: string,
  ): Promise<TeamDetailDto> {
    const team = await this.findTeamInWorkspace(workspaceId, teamId);
    const member = await this.entityManager.findOne(
      TeamMember,
      { team: teamId, user: userId },
      { populate: ['user'] },
    );
    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }
    const memberCount = await this.entityManager.count(TeamMember, {
      team: teamId,
    });
    if (memberCount <= 1) {
      throw new BadRequestException('El equipo debe tener al menos un miembro');
    }
    this.entityManager.remove(member);
    await this.entityManager.flush();
    const pendingInvitations = await this.loadPendingInvitations(teamId);
    await this.entityManager.populate(team, ['members.user']);
    return this.toDetail(team, pendingInvitations);
  }

  private async findActiveInvitation(token: string): Promise<TeamInvitation> {
    const tokenHash = this.hashToken(token.trim());
    const invitation = await this.entityManager.findOne(TeamInvitation, {
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
    });
    if (!invitation) {
      throw new BadRequestException('La invitación no es válida o ya fue usada');
    }
    return invitation;
  }

  private async loadPendingInvitations(
    teamId: string,
  ): Promise<TeamInvitation[]> {
    return this.entityManager.find(
      TeamInvitation,
      {
        team: teamId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  private async findTeamInWorkspace(
    workspaceId: string,
    teamId: string,
  ): Promise<Team> {
    const team = await this.entityManager.findOne(
      Team,
      { id: teamId, workspace: workspaceId },
      { populate: ['members', 'workspace'] },
    );
    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }
    return team;
  }

  private toSummary(team: Team): TeamSummaryDto {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.isInitialized()
        ? team.members.length
        : 0,
      createdAt: team.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toDetail(
    team: Team,
    pendingInvitations: TeamInvitation[],
  ): TeamDetailDto {
    const memberItems = team.members.isInitialized() ? team.members.getItems() : [];
    const ownerUserId = this.resolveOwnerUserId(memberItems);
    const members = memberItems
      .map((member) => this.toMember(member, ownerUserId))
      .sort((left, right) => left.name.localeCompare(right.name));
    return {
      ...this.toSummary(team),
      memberCount: members.length,
      members,
      pendingInvitations: pendingInvitations.map((invitation) =>
        this.toPendingInvitation(invitation),
      ),
    };
  }

  private resolveOwnerUserId(members: TeamMember[]): string | null {
    if (members.length === 0) {
      return null;
    }
    const sortedMembers = [...members].sort(
      (left, right) =>
        (left.joinedAt?.getTime() ?? 0) - (right.joinedAt?.getTime() ?? 0),
    );
    return sortedMembers[0]?.user.id ?? null;
  }

  private toMember(member: TeamMember, ownerUserId: string | null): TeamMemberDto {
    return {
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role as TeamAccessRoleDto,
      isOwner: ownerUserId === member.user.id,
      joinedAt: member.joinedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toPendingInvitation(
    invitation: TeamInvitation,
  ): TeamPendingInvitationDto {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as TeamAccessRoleDto,
      invitedAt: invitation.createdAt?.toISOString() ?? new Date().toISOString(),
      isShareLink: invitation.email === null,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildTeamInvitationUrl(token: string): string {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL', 'http://localhost:3001');
    return `${webAppUrl.replace(/\/$/, '')}/team-invite?token=${encodeURIComponent(token)}`;
  }

  private buildTeamUrl(teamId: string): string {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL', 'http://localhost:3001');
    return `${webAppUrl.replace(/\/$/, '')}/teams/${teamId}`;
  }

  private async resolveNotificationPreferences(
    teamId: string,
    userId: string,
  ): Promise<TeamNotificationPreferencesDto> {
    const preference = await this.entityManager.findOne(TeamNotificationPreference, {
      team: teamId,
      user: userId,
    });
    return {
      notifyOnInvite: preference?.notifyOnInvite ?? true,
      notifyOnJoin: preference?.notifyOnJoin ?? true,
    };
  }

  private async notifyTeamMembersOnJoin(params: {
    team: Team;
    workspaceId: string;
    joiningUser: User;
    addedByUserId?: string;
  }): Promise<void> {
    await this.entityManager.populate(params.team, ['workspace', 'members.user']);
    const teamUrl = this.buildTeamUrl(params.team.id);
    const workspaceName = params.team.workspace.name;
    const recipients = params.team.members
      .getItems()
      .filter((member) => member.user.id !== params.joiningUser.id);
    for (const member of recipients) {
      const preferences = await this.resolveNotificationPreferences(
        params.team.id,
        member.user.id,
      );
      if (!preferences.notifyOnJoin) {
        continue;
      }
      await this.teamInvitationNotification.sendMemberJoined({
        email: member.user.email,
        teamName: params.team.name,
        workspaceName,
        memberName: params.joiningUser.name,
        memberEmail: params.joiningUser.email,
        teamUrl,
      });
      await this.activityEventsService.createEvent({
        workspaceId: params.workspaceId,
        recipientUserId: member.user.id,
        actorUserId: params.addedByUserId ?? params.joiningUser.id,
        type: ActivityEventType.TEAM_MEMBER_JOINED,
        payload: {
          teamId: params.team.id,
          teamName: params.team.name,
          memberName: params.joiningUser.name,
          memberEmail: params.joiningUser.email,
        },
      });
    }
  }

  private async notifyTeamMembersBulkAdded(params: {
    team: Team;
    workspaceId: string;
    sourceTeamName: string;
    addedCount: number;
    actorUserId: string;
  }): Promise<void> {
    await this.entityManager.populate(params.team, ['members.user']);
    for (const member of params.team.members.getItems()) {
      if (member.user.id === params.actorUserId) {
        continue;
      }
      const preferences = await this.resolveNotificationPreferences(
        params.team.id,
        member.user.id,
      );
      if (!preferences.notifyOnJoin) {
        continue;
      }
      await this.activityEventsService.createEvent({
        workspaceId: params.workspaceId,
        recipientUserId: member.user.id,
        actorUserId: params.actorUserId,
        type: ActivityEventType.TEAM_MEMBER_JOINED,
        payload: {
          teamId: params.team.id,
          teamName: params.team.name,
          addedCount: params.addedCount,
          sourceTeamName: params.sourceTeamName,
          isBulkAdd: true,
        },
      });
    }
  }
}
