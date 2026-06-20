export type DashboardWidgetType =
  | 'tasks_by_assignee'
  | 'overdue_count'
  | 'custom_field_breakdown';

export interface DashboardWidgetScopeConfigDto {
  readonly projectId?: string;
}

export interface DashboardCustomFieldBreakdownConfigDto extends DashboardWidgetScopeConfigDto {
  readonly customFieldDefinitionId: string;
}

export type DashboardWidgetConfigDto =
  | DashboardWidgetScopeConfigDto
  | DashboardCustomFieldBreakdownConfigDto;

export interface DashboardSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly teamId: string | null;
  readonly teamName: string | null;
  readonly widgetCount: number;
  readonly createdAt: string;
}

export interface TasksByAssigneeItemDto {
  readonly assigneeId: string | null;
  readonly assigneeName: string;
  readonly count: number;
}

export interface TasksByAssigneeWidgetDataDto {
  readonly type: 'tasks_by_assignee';
  readonly items: TasksByAssigneeItemDto[];
  readonly totalOpenTasks: number;
}

export interface OverdueCountWidgetDataDto {
  readonly type: 'overdue_count';
  readonly overdueCount: number;
  readonly openTasksCount: number;
}

export interface CustomFieldBreakdownItemDto {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

export interface CustomFieldBreakdownWidgetDataDto {
  readonly type: 'custom_field_breakdown';
  readonly fieldName: string;
  readonly items: CustomFieldBreakdownItemDto[];
  readonly totalTasks: number;
}

export type DashboardWidgetDataDto =
  | TasksByAssigneeWidgetDataDto
  | OverdueCountWidgetDataDto
  | CustomFieldBreakdownWidgetDataDto;

export interface DashboardWidgetDto {
  readonly id: string;
  readonly type: DashboardWidgetType;
  readonly title: string;
  readonly config: DashboardWidgetConfigDto;
  readonly position: number;
  readonly data: DashboardWidgetDataDto;
}

export interface DashboardDetailDto extends DashboardSummaryDto {
  readonly widgets: DashboardWidgetDto[];
}

export interface CreateDashboardWidgetRequestDto {
  readonly type: DashboardWidgetType;
  readonly title: string;
  readonly config?: DashboardWidgetConfigDto;
  readonly position?: number;
}

export interface UpdateDashboardWidgetRequestDto {
  readonly title?: string;
  readonly config?: DashboardWidgetConfigDto;
  readonly position?: number;
}

export interface UpdateDashboardRequestDto {
  readonly name?: string;
}
