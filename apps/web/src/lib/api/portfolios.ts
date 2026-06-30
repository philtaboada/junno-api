import type {
  AddPortfolioProjectRequestDto,
  CreateGoalRequestDto,
  CreatePortfolioRequestDto,
  GoalDetailDto,
  GoalMetricSnapshotDto,
  GoalSummaryDto,
  PortfolioDetailDto,
  PortfolioSummaryDto,
  UpdateGoalRequestDto,
  UpdatePortfolioRequestDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchPortfolios(): Promise<PortfolioSummaryDto[]> {
  return apiRequest<PortfolioSummaryDto[]>('/portfolios', { method: 'GET' });
}

export async function fetchPortfolio(portfolioId: string): Promise<PortfolioDetailDto> {
  return apiRequest<PortfolioDetailDto>(`/portfolios/${portfolioId}`, { method: 'GET' });
}

export async function createPortfolio(
  input: CreatePortfolioRequestDto,
): Promise<PortfolioDetailDto> {
  return apiRequest<PortfolioDetailDto>('/portfolios', {
    method: 'POST',
    body: input,
  });
}

export async function updatePortfolio(
  portfolioId: string,
  input: UpdatePortfolioRequestDto,
): Promise<PortfolioDetailDto> {
  return apiRequest<PortfolioDetailDto>(`/portfolios/${portfolioId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  return apiRequest<void>(`/portfolios/${portfolioId}`, { method: 'DELETE' });
}

export async function addPortfolioProject(
  portfolioId: string,
  input: AddPortfolioProjectRequestDto,
): Promise<PortfolioDetailDto> {
  return apiRequest<PortfolioDetailDto>(`/portfolios/${portfolioId}/projects`, {
    method: 'POST',
    body: input,
  });
}

export async function removePortfolioProject(
  portfolioId: string,
  projectId: string,
): Promise<PortfolioDetailDto> {
  return apiRequest<PortfolioDetailDto>(
    `/portfolios/${portfolioId}/projects/${projectId}`,
    { method: 'DELETE' },
  );
}

export async function createPortfolioGoal(
  portfolioId: string,
  input: CreateGoalRequestDto,
): Promise<GoalSummaryDto> {
  return apiRequest<GoalSummaryDto>(`/portfolios/${portfolioId}/goals`, {
    method: 'POST',
    body: input,
  });
}

export async function fetchGoal(goalId: string): Promise<GoalDetailDto> {
  return apiRequest<GoalDetailDto>(`/goals/${goalId}`, { method: 'GET' });
}

export async function updateGoal(
  goalId: string,
  input: UpdateGoalRequestDto,
): Promise<GoalSummaryDto> {
  return apiRequest<GoalSummaryDto>(`/goals/${goalId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  return apiRequest<void>(`/goals/${goalId}`, { method: 'DELETE' });
}

export async function recordGoalSnapshot(
  goalId: string,
): Promise<GoalMetricSnapshotDto> {
  return apiRequest<GoalMetricSnapshotDto>(`/goals/${goalId}/snapshots`, {
    method: 'POST',
  });
}

export async function fetchGoalSnapshots(
  goalId: string,
): Promise<GoalMetricSnapshotDto[]> {
  return apiRequest<GoalMetricSnapshotDto[]>(`/goals/${goalId}/snapshots`, {
    method: 'GET',
  });
}
