import type {
  AddProjectMemberRequestDto,
  AddProjectMembersFromTeamRequestDto,
  AddProjectMembersFromTeamResponseDto,
  CreateProjectRequestDto,
  CreateCustomFieldRequestDto,
  CreateSectionRequestDto,
  ProjectDetailDto,
  ProjectSummaryDto,
  ReorderSectionsRequestDto,
  UpdateListColumnsRequestDto,
  UpdateCustomFieldRequestDto,
  UpdateProjectMemberRoleRequestDto,
  UpdateProjectRequestDto,
  UpdateSectionRequestDto,
} from '@pm/contracts';
import { apiRequest, ApiError } from '@/lib/api/client';

export async function fetchProjects(params?: {
  teamId?: string;
  status?: 'active' | 'archived' | 'all';
}): Promise<ProjectSummaryDto[]> {
  const searchParams = new URLSearchParams();
  if (params?.teamId) {
    searchParams.set('teamId', params.teamId);
  }
  if (params?.status) {
    searchParams.set('status', params.status);
  }
  const query = searchParams.toString();
  return apiRequest<ProjectSummaryDto[]>(`/projects${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export async function createProject(
  input: CreateProjectRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>('/projects', {
    method: 'POST',
    body: input,
  });
}

export async function fetchProject(projectId: string): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}`, {
    method: 'GET',
  });
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export async function createSection(
  projectId: string,
  input: CreateSectionRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/sections`, {
    method: 'POST',
    body: input,
  });
}

export async function updateSection(
  projectId: string,
  sectionId: string,
  input: UpdateSectionRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(
    `/projects/${projectId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteSection(
  projectId: string,
  sectionId: string,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(
    `/projects/${projectId}/sections/${sectionId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function reorderSections(
  projectId: string,
  input: ReorderSectionsRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/sections/reorder`, {
    method: 'PATCH',
    body: input,
  });
}

export async function updateProjectListColumns(
  projectId: string,
  input: UpdateListColumnsRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/list-columns`, {
    method: 'PATCH',
    body: input,
  });
}

export async function createProjectCustomField(
  projectId: string,
  input: CreateCustomFieldRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/custom-fields`, {
    method: 'POST',
    body: input,
  });
}

export async function updateProjectCustomField(
  projectId: string,
  fieldId: string,
  input: UpdateCustomFieldRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(
    `/projects/${projectId}/custom-fields/${fieldId}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteProjectCustomField(
  projectId: string,
  fieldId: string,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(
    `/projects/${projectId}/custom-fields/${fieldId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function addProjectMember(
  projectId: string,
  input: AddProjectMemberRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: input,
  });
}

export async function addProjectMembersFromTeam(
  projectId: string,
  input: AddProjectMembersFromTeamRequestDto,
): Promise<AddProjectMembersFromTeamResponseDto> {
  return apiRequest<AddProjectMembersFromTeamResponseDto>(
    `/projects/${projectId}/members/from-team`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  input: UpdateProjectMemberRoleRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/members/${userId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export { ApiError };
