'use client';

import type { GoalSummaryDto } from '@pm/contracts';
import { Trash2 } from 'lucide-react';
import {
  formatGoalValue,
  getGoalMetricTypeLabel,
  getGoalStatusClassName,
  getGoalStatusLabel,
} from '@/features/portfolios/lib/goal-labels';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PortfolioGoalsListProps = {
  goals: GoalSummaryDto[];
  onDeleteGoal: (goalId: string) => void;
  isDeletingGoalId: string | null;
};

export function PortfolioGoalsList({
  goals,
  onDeleteGoal,
  isDeletingGoalId,
}: PortfolioGoalsListProps) {
  if (goals.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Sin goals todavía. Crea uno para medir el progreso del portfolio.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="rounded-xl border border-border/80 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{goal.name}</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    getGoalStatusClassName(goal.status),
                  )}
                >
                  {getGoalStatusLabel(goal.status)}
                </span>
              </div>
              {goal.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {getGoalMetricTypeLabel(goal.metricType)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isDeletingGoalId === goal.id}
              onClick={() => onDeleteGoal(goal.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {formatGoalValue(goal.metricType, goal.currentValue)}
                {goal.targetValue !== null ? (
                  <span className="text-muted-foreground">
                    {' '}
                    / {formatGoalValue(goal.metricType, goal.targetValue)}
                  </span>
                ) : null}
              </span>
              <span className="font-medium">{goal.progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-indigo transition-all"
                style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
