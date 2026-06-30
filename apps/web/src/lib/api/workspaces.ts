import type {
  WorkspaceMembersSearchResponseDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

type SearchWorkspaceMembersParams = {
  q?: string;
  teamId?: string;
  excludeTeamId?: string;
  excludeProjectId?: string;
};

export async function searchWorkspaceMembers(
  params: SearchWorkspaceMembersParams = {},
): Promise<WorkspaceMembersSearchResponseDto> {
  const searchParams = new URLSearchParams();
  if (params.q) {
    searchParams.set('q', params.q);
  }
  if (params.teamId) {
    searchParams.set('teamId', params.teamId);
  }
  if (params.excludeTeamId) {
    searchParams.set('excludeTeamId', params.excludeTeamId);
  }
  if (params.excludeProjectId) {
    searchParams.set('excludeProjectId', params.excludeProjectId);
  }
  const query = searchParams.toString();
  return apiRequest<WorkspaceMembersSearchResponseDto>(
    `/workspaces/members${query ? `?${query}` : ''}`,
    { method: 'GET' },
  );
}
