import type {
  CreateFormFieldRequestDto,
  CreateFormRequestDto,
  FormDetailDto,
  FormSummaryDto,
  SubmitFormRequestDto,
  SubmitFormResponseDto,
  UpdateFormFieldRequestDto,
  UpdateFormRequestDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchProjectForms(projectId: string): Promise<FormSummaryDto[]> {
  return apiRequest<FormSummaryDto[]>(`/projects/${projectId}/forms`, {
    method: 'GET',
  });
}

export async function createProjectForm(
  projectId: string,
  input: CreateFormRequestDto,
): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/projects/${projectId}/forms`, {
    method: 'POST',
    body: input,
  });
}

export async function fetchForm(formId: string): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/forms/${formId}`, { method: 'GET' });
}

export async function updateForm(
  formId: string,
  input: UpdateFormRequestDto,
): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/forms/${formId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteForm(formId: string): Promise<void> {
  return apiRequest<void>(`/forms/${formId}`, { method: 'DELETE' });
}

export async function addFormField(
  formId: string,
  input: CreateFormFieldRequestDto,
): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/forms/${formId}/fields`, {
    method: 'POST',
    body: input,
  });
}

export async function updateFormField(
  formId: string,
  fieldId: string,
  input: UpdateFormFieldRequestDto,
): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/forms/${formId}/fields/${fieldId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteFormField(
  formId: string,
  fieldId: string,
): Promise<FormDetailDto> {
  return apiRequest<FormDetailDto>(`/forms/${formId}/fields/${fieldId}`, {
    method: 'DELETE',
  });
}

export async function submitForm(
  formId: string,
  input: SubmitFormRequestDto,
): Promise<SubmitFormResponseDto> {
  return apiRequest<SubmitFormResponseDto>(`/forms/${formId}/submissions`, {
    method: 'POST',
    body: input,
  });
}
