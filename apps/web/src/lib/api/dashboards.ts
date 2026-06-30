import type {
  CreateDashboardWidgetRequestDto,
  DashboardDetailDto,
  UpdateDashboardRequestDto,
  UpdateDashboardWidgetRequestDto,
} from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchDashboard(teamId?: string): Promise<DashboardDetailDto> {
  const searchParams = new URLSearchParams();
  if (teamId) {
    searchParams.set('teamId', teamId);
  }
  const query = searchParams.toString();
  return apiRequest<DashboardDetailDto>(`/dashboards${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export async function updateDashboard(
  dashboardId: string,
  input: UpdateDashboardRequestDto,
): Promise<DashboardDetailDto> {
  return apiRequest<DashboardDetailDto>(`/dashboards/${dashboardId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function addDashboardWidget(
  dashboardId: string,
  input: CreateDashboardWidgetRequestDto,
): Promise<DashboardDetailDto> {
  return apiRequest<DashboardDetailDto>(`/dashboards/${dashboardId}/widgets`, {
    method: 'POST',
    body: input,
  });
}

export async function updateDashboardWidget(
  dashboardId: string,
  widgetId: string,
  input: UpdateDashboardWidgetRequestDto,
): Promise<DashboardDetailDto> {
  return apiRequest<DashboardDetailDto>(
    `/dashboards/${dashboardId}/widgets/${widgetId}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteDashboardWidget(
  dashboardId: string,
  widgetId: string,
): Promise<DashboardDetailDto> {
  return apiRequest<DashboardDetailDto>(
    `/dashboards/${dashboardId}/widgets/${widgetId}`,
    {
      method: 'DELETE',
    },
  );
}
