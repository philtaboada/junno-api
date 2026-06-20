import type { ProjectColor, ProjectStatus } from './project.types';

export type GoalMetricType = 'tasks_completion_percent' | 'custom_field_rollup';

export type GoalCustomFieldAggregation = 'sum' | 'avg';

export type GoalStatus = 'on_track' | 'at_risk' | 'off_track' | 'achieved';

export interface GoalCustomFieldRollupMetricConfigDto {
  readonly customFieldDefinitionId: string;
  readonly aggregation: GoalCustomFieldAggregation;
}

export interface PortfolioSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: ProjectColor | null;
  readonly projectCount: number;
  readonly goalCount: number;
  readonly createdAt: string;
}

export interface PortfolioProjectDto {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly projectColor: ProjectColor | null;
  readonly projectStatus: ProjectStatus;
  readonly position: number;
}

export interface GoalMetricSnapshotDto {
  readonly id: string;
  readonly value: number;
  readonly recordedAt: string;
}

export interface GoalSummaryDto {
  readonly id: string;
  readonly portfolioId: string;
  readonly name: string;
  readonly description: string | null;
  readonly metricType: GoalMetricType;
  readonly targetValue: number | null;
  readonly currentValue: number;
  readonly progressPercent: number;
  readonly status: GoalStatus;
  readonly dueAt: string | null;
  readonly createdAt: string;
}

export interface GoalDetailDto extends GoalSummaryDto {
  readonly metricConfig: GoalCustomFieldRollupMetricConfigDto | null;
  readonly snapshots: GoalMetricSnapshotDto[];
}

export interface PortfolioDetailDto extends PortfolioSummaryDto {
  readonly projects: PortfolioProjectDto[];
  readonly goals: GoalSummaryDto[];
}

export interface CreatePortfolioRequestDto {
  readonly name: string;
  readonly description?: string;
  readonly color?: ProjectColor;
}

export interface UpdatePortfolioRequestDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly color?: ProjectColor | null;
}

export interface AddPortfolioProjectRequestDto {
  readonly projectId: string;
}

export interface CreateGoalRequestDto {
  readonly name: string;
  readonly description?: string;
  readonly metricType: GoalMetricType;
  readonly targetValue?: number;
  readonly dueAt?: string;
  readonly metricConfig?: GoalCustomFieldRollupMetricConfigDto;
}

export interface UpdateGoalRequestDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly targetValue?: number | null;
  readonly dueAt?: string | null;
  readonly metricConfig?: GoalCustomFieldRollupMetricConfigDto | null;
}
