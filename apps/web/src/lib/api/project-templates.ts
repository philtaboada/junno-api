import type {
  CreateProjectFromTemplateRequestDto,
  CreateProjectTemplateRequestDto,
  ProjectDetailDto,
  ProjectTemplateDetailDto,
  ProjectTemplateSummaryDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchProjectTemplates(): Promise<ProjectTemplateSummaryDto[]> {
  return apiRequest<ProjectTemplateSummaryDto[]>('/project-templates', {
    method: 'GET',
  });
}

export async function fetchProjectTemplate(
  templateId: string,
): Promise<ProjectTemplateDetailDto> {
  return apiRequest<ProjectTemplateDetailDto>(`/project-templates/${templateId}`, {
    method: 'GET',
  });
}

export async function createProjectTemplate(
  input: CreateProjectTemplateRequestDto,
): Promise<ProjectTemplateDetailDto> {
  return apiRequest<ProjectTemplateDetailDto>('/project-templates', {
    method: 'POST',
    body: input,
  });
}

export async function createProjectFromTemplate(
  templateId: string,
  input: CreateProjectFromTemplateRequestDto,
): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>(
    `/project-templates/${templateId}/projects`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export async function deleteProjectTemplate(templateId: string): Promise<void> {
  return apiRequest<void>(`/project-templates/${templateId}`, {
    method: 'DELETE',
  });
}
