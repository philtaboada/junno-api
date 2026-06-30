import type {
  AcceptTeamInvitationRequestDto,
  AcceptTeamInvitationResponseDto,
  AddTeamMemberRequestDto,
  AddTeamMembersFromTeamRequestDto,
  AddTeamMembersFromTeamResponseDto,
  CreateTeamRequestDto,
  InviteTeamMemberRequestDto,
  InviteTeamMemberResponseDto,
  TeamDetailDto,
  TeamInvitationPreviewDto,
  TeamSummaryDto,
  TeamInvitationLinkResponseDto,
  TeamNotificationPreferencesDto,
  UpdateTeamInvitationRoleRequestDto,
  UpdateTeamMemberRoleRequestDto,
  UpdateTeamNotificationPreferencesRequestDto,
  UpdateTeamRequestDto,
} from '@pm/contracts';
import { apiRequest, ApiError } from '@/lib/api/client';

export async function fetchTeams(): Promise<TeamSummaryDto[]> {
  return apiRequest<TeamSummaryDto[]>('/teams', {
    method: 'GET',
  });
}

export async function createTeam(
  input: CreateTeamRequestDto,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>('/teams', {
    method: 'POST',
    body: input,
  });
}

export async function fetchTeam(teamId: string): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(`/teams/${teamId}`, {
    method: 'GET',
  });
}

export async function updateTeam(
  teamId: string,
  input: UpdateTeamRequestDto,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(`/teams/${teamId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteTeam(teamId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/teams/${teamId}`, {
    method: 'DELETE',
  });
}

export async function addTeamMember(
  teamId: string,
  input: AddTeamMemberRequestDto,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(`/teams/${teamId}/members`, {
    method: 'POST',
    body: input,
  });
}

export async function addTeamMembersFromTeam(
  teamId: string,
  input: AddTeamMembersFromTeamRequestDto,
): Promise<AddTeamMembersFromTeamResponseDto> {
  return apiRequest<AddTeamMembersFromTeamResponseDto>(
    `/teams/${teamId}/members/from-team`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export async function updateTeamInvitationRole(
  teamId: string,
  invitationId: string,
  input: UpdateTeamInvitationRoleRequestDto,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(
    `/teams/${teamId}/invitations/${invitationId}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function fetchTeamNotificationPreferences(
  teamId: string,
): Promise<TeamNotificationPreferencesDto> {
  return apiRequest<TeamNotificationPreferencesDto>(
    `/teams/${teamId}/notification-preferences`,
    { method: 'GET' },
  );
}

export async function updateTeamNotificationPreferences(
  teamId: string,
  input: UpdateTeamNotificationPreferencesRequestDto,
): Promise<TeamNotificationPreferencesDto> {
  return apiRequest<TeamNotificationPreferencesDto>(
    `/teams/${teamId}/notification-preferences`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function inviteTeamMember(
  teamId: string,
  input: InviteTeamMemberRequestDto,
): Promise<InviteTeamMemberResponseDto> {
  return apiRequest<InviteTeamMemberResponseDto>(`/teams/${teamId}/invitations`, {
    method: 'POST',
    body: input,
  });
}

export async function revokeTeamInvitation(
  teamId: string,
  invitationId: string,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(
    `/teams/${teamId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function fetchTeamShareLink(
  teamId: string,
): Promise<TeamInvitationLinkResponseDto> {
  return apiRequest<TeamInvitationLinkResponseDto>(`/teams/${teamId}/share-link`, {
    method: 'POST',
  });
}

export async function fetchTeamInvitationLink(
  teamId: string,
  invitationId: string,
): Promise<TeamInvitationLinkResponseDto> {
  return apiRequest<TeamInvitationLinkResponseDto>(
    `/teams/${teamId}/invitations/${invitationId}/link`,
    {
      method: 'POST',
    },
  );
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  input: UpdateTeamMemberRoleRequestDto,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(`/teams/${teamId}/members/${userId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<TeamDetailDto> {
  return apiRequest<TeamDetailDto>(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function previewTeamInvitation(
  token: string,
): Promise<TeamInvitationPreviewDto> {
  return apiRequest<TeamInvitationPreviewDto>(
    `/team-invitations/preview?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      includeWorkspaceHeader: false,
      skipAuthRetry: true,
    },
  );
}

export async function acceptTeamInvitation(
  input: AcceptTeamInvitationRequestDto,
): Promise<AcceptTeamInvitationResponseDto> {
  return apiRequest<AcceptTeamInvitationResponseDto>('/team-invitations/accept', {
    method: 'POST',
    body: input,
    includeWorkspaceHeader: false,
  });
}

export { ApiError };
