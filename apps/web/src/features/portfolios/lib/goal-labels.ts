import type { GoalStatus } from '@pm/contracts';

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'achieved':
      return 'Logrado';
    case 'on_track':
      return 'En camino';
    case 'at_risk':
      return 'En riesgo';
    case 'off_track':
      return 'Fuera de curso';
    default:
      return status;
  }
}

export function getGoalStatusClassName(status: GoalStatus): string {
  switch (status) {
    case 'achieved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'on_track':
      return 'bg-brand-indigo-muted text-brand-indigo';
    case 'at_risk':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    case 'off_track':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getGoalMetricTypeLabel(
  metricType: 'tasks_completion_percent' | 'custom_field_rollup',
): string {
  switch (metricType) {
    case 'tasks_completion_percent':
      return '% tareas completadas';
    case 'custom_field_rollup':
      return 'Rollup campo numérico';
    default:
      return metricType;
  }
}

export function formatGoalValue(
  metricType: 'tasks_completion_percent' | 'custom_field_rollup',
  value: number,
): string {
  if (metricType === 'tasks_completion_percent') {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
