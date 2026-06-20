export type TeamAccessRole = 'editor' | 'commenter' | 'viewer';

export interface TeamMemberDto {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: TeamAccessRole;
  readonly isOwner: boolean;
  readonly joinedAt: string;
}

export interface TeamPendingInvitationDto {
  readonly id: string;
  readonly email: string | null;
  readonly role: TeamAccessRole;
  readonly invitedAt: string;
  readonly isShareLink: boolean;
}

export interface TeamSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly memberCount: number;
  readonly createdAt: string;
}

export interface TeamDetailDto extends TeamSummaryDto {
  readonly members: TeamMemberDto[];
  readonly pendingInvitations: TeamPendingInvitationDto[];
}

export interface CreateTeamRequestDto {
  readonly name: string;
  readonly description?: string;
}

export interface UpdateTeamRequestDto {
  readonly name?: string;
  readonly description?: string | null;
}

export interface InviteTeamMemberRequestDto {
  readonly email: string;
  readonly role?: TeamAccessRole;
}

export interface InviteTeamMemberResponseDto {
  readonly message: string;
  readonly inviteUrl: string;
}

export interface TeamInvitationLinkResponseDto {
  readonly inviteUrl: string;
}

export interface UpdateTeamMemberRoleRequestDto {
  readonly role: TeamAccessRole;
}

export interface AcceptTeamInvitationRequestDto {
  readonly token: string;
}

export interface AcceptTeamInvitationResponseDto {
  readonly teamId: string;
  readonly workspaceId: string;
  readonly teamName: string;
}

export interface TeamInvitationPreviewDto {
  readonly teamName: string;
  readonly workspaceName: string;
  readonly inviterName: string;
  readonly inviteeEmail: string | null;
  readonly isShareLink: boolean;
  readonly role: TeamAccessRole;
  readonly isExpired: boolean;
}

export interface UpdateTeamInvitationRoleRequestDto {
  readonly role: TeamAccessRole;
}

export interface TeamNotificationPreferencesDto {
  readonly notifyOnInvite: boolean;
  readonly notifyOnJoin: boolean;
}

export interface UpdateTeamNotificationPreferencesRequestDto {
  readonly notifyOnInvite?: boolean;
  readonly notifyOnJoin?: boolean;
}

export interface AddTeamMembersFromTeamRequestDto {
  readonly sourceTeamId: string;
  readonly role?: TeamAccessRole;
}

export interface AddTeamMembersFromTeamResponseDto {
  readonly addedCount: number;
  readonly message: string;
}

export interface AddTeamMemberRequestDto {
  readonly userId: string;
  readonly role?: TeamAccessRole;
}
