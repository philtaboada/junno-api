import type {
  AutomationRuleDto,
  AutomationRunDto,
  CreateAutomationRuleRequestDto,
  UpdateAutomationRuleRequestDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchAutomationRules(
  projectId: string,
): Promise<AutomationRuleDto[]> {
  return apiRequest<AutomationRuleDto[]>(
    `/projects/${projectId}/automation-rules`,
    { method: 'GET' },
  );
}

export async function fetchAutomationRuns(
  projectId: string,
): Promise<AutomationRunDto[]> {
  return apiRequest<AutomationRunDto[]>(
    `/projects/${projectId}/automation-rules/runs`,
    { method: 'GET' },
  );
}

export async function createAutomationRule(
  projectId: string,
  input: CreateAutomationRuleRequestDto,
): Promise<AutomationRuleDto> {
  return apiRequest<AutomationRuleDto>(`/projects/${projectId}/automation-rules`, {
    method: 'POST',
    body: input,
  });
}

export async function updateAutomationRule(
  projectId: string,
  ruleId: string,
  input: UpdateAutomationRuleRequestDto,
): Promise<AutomationRuleDto> {
  return apiRequest<AutomationRuleDto>(
    `/projects/${projectId}/automation-rules/${ruleId}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteAutomationRule(
  projectId: string,
  ruleId: string,
): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/automation-rules/${ruleId}`, {
    method: 'DELETE',
  });
}
