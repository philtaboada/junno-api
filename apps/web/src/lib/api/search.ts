import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function searchWorkspace(
  query: string,
): Promise<WorkspaceSearchResponseDto> {
  const params = new URLSearchParams();
  if (query.trim().length > 0) {
    params.set('q', query.trim());
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest<WorkspaceSearchResponseDto>(`/workspaces/search${suffix}`, {
    method: 'GET',
  });
}
