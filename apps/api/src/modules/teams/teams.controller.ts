import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AddTeamMembersFromTeamResponseDto,
  InviteTeamMemberResponseDto,
  TeamDetailDto,
  TeamInvitationLinkResponseDto,
  TeamNotificationPreferencesDto,
  TeamSummaryDto,
} from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { AddTeamMembersFromTeamDto } from './dto/add-team-members-from-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UpdateTeamInvitationRoleDto } from './dto/update-team-invitation-role.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { UpdateTeamNotificationPreferencesDto } from './dto/update-team-notification-preferences.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  list(@CurrentWorkspace() context: WorkspaceContext): Promise<TeamSummaryDto[]> {
    return this.teamsService.listForWorkspace(context.workspace.id);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() createTeamDto: CreateTeamDto,
  ): Promise<TeamDetailDto> {
    return this.teamsService.createForWorkspace(context, createTeamDto);
  }

  @Get(':id')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
  ): Promise<TeamDetailDto> {
    return this.teamsService.getForWorkspace(context.workspace.id, teamId);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<TeamDetailDto> {
    return this.teamsService.updateForWorkspace(
      context.workspace.id,
      teamId,
      updateTeamDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
  ): Promise<{ success: true }> {
    return this.teamsService
      .removeForWorkspace(context.workspace.id, teamId)
      .then(() => ({ success: true as const }));
  }

  @Post(':id/share-link')
  getShareLink(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
  ): Promise<TeamInvitationLinkResponseDto> {
    return this.teamsService.getShareLink(context, teamId);
  }

  @Post(':id/invitations')
  invite(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Body() inviteTeamMemberDto: InviteTeamMemberDto,
  ): Promise<InviteTeamMemberResponseDto> {
    return this.teamsService.inviteByEmail(context, teamId, inviteTeamMemberDto);
  }

  @Patch(':id/invitations/:invitationId')
  updateInvitationRole(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Param('invitationId') invitationId: string,
    @Body() updateTeamInvitationRoleDto: UpdateTeamInvitationRoleDto,
  ): Promise<TeamDetailDto> {
    return this.teamsService.updateInvitationRoleForWorkspace(
      context.workspace.id,
      teamId,
      invitationId,
      updateTeamInvitationRoleDto,
    );
  }

  @Post(':id/invitations/:invitationId/link')
  getInvitationLink(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<TeamInvitationLinkResponseDto> {
    return this.teamsService.getInvitationLink(
      context.workspace.id,
      teamId,
      invitationId,
    );
  }

  @Delete(':id/invitations/:invitationId')
  revokeInvitation(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<TeamDetailDto> {
    return this.teamsService.revokeInvitation(
      context.workspace.id,
      teamId,
      invitationId,
    );
  }

  @Post(':id/members')
  addMember(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
  ): Promise<TeamDetailDto> {
    return this.teamsService.addMemberByUserId(context, teamId, addTeamMemberDto);
  }

  @Post(':id/members/from-team')
  addMembersFromTeam(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Body() addTeamMembersFromTeamDto: AddTeamMembersFromTeamDto,
  ): Promise<AddTeamMembersFromTeamResponseDto> {
    return this.teamsService.addMembersFromTeam(
      context,
      teamId,
      addTeamMembersFromTeamDto,
    );
  }

  @Get(':id/notification-preferences')
  getNotificationPreferences(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
  ): Promise<TeamNotificationPreferencesDto> {
    return this.teamsService.getNotificationPreferences(context, teamId);
  }

  @Patch(':id/notification-preferences')
  updateNotificationPreferences(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Body() updateTeamNotificationPreferencesDto: UpdateTeamNotificationPreferencesDto,
  ): Promise<TeamNotificationPreferencesDto> {
    return this.teamsService.updateNotificationPreferences(
      context,
      teamId,
      updateTeamNotificationPreferencesDto,
    );
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @Body() updateTeamMemberRoleDto: UpdateTeamMemberRoleDto,
  ): Promise<TeamDetailDto> {
    return this.teamsService.updateMemberRoleForWorkspace(
      context.workspace.id,
      teamId,
      userId,
      updateTeamMemberRoleDto,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('id') teamId: string,
    @Param('userId') userId: string,
  ): Promise<TeamDetailDto> {
    return this.teamsService.removeMemberForWorkspace(
      context.workspace.id,
      teamId,
      userId,
    );
  }
}
