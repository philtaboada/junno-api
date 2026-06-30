'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskSummaryDto } from '@pm/contracts';
import {
  addMonths,
  buildMonthGrid,
  formatMonthTitle,
  getTasksForDay,
  getWeekdayLabels,
  moveTaskToLocalDay,
} from '@/features/tasks/lib/calendar-utils';
import { dueDateToneClassName, formatDueDate } from '@/features/tasks/lib/format-due-date';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import { ApiError, updateTask } from '@/lib/api/tasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectTasksCalendarViewProps = {
  tasks: TaskSummaryDto[];
  canEdit: boolean;
  onTasksChange: React.Dispatch<React.SetStateAction<TaskSummaryDto[]>>;
  onOpenTask: (taskId: string) => void;
};

export function ProjectTasksCalendarView({
  tasks,
  canEdit,
  onTasksChange,
  onOpenTask,
}: ProjectTasksCalendarViewProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null);
  const monthCells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const weekdayLabels = getWeekdayLabels();

  async function handleDropTask(taskId: string, targetDay: Date): Promise<void> {
    if (!canEdit) {
      return;
    }
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const nextRange = moveTaskToLocalDay(task, targetDay);
    const previousTasks = tasks;
    onTasksChange(
      tasks.map((item) =>
        item.id === taskId
          ? { ...item, startAt: nextRange.startAt, dueAt: nextRange.dueAt }
          : item,
      ),
    );
    try {
      const updated = await updateTask(taskId, nextRange);
      onTasksChange((current) =>
        (current ?? []).map((item) =>
          item.id === taskId ? toTaskSummary(updated) : item,
        ),
      );
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo mover la tarea';
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Mes anterior"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Mes siguiente"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold capitalize tracking-tight">
          {formatMonthTitle(visibleMonth)}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-brand-indigo"
          onClick={() => {
            const today = new Date();
            setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
          }}
        >
          Hoy
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="grid grid-cols-7 border-b border-border/70 bg-muted/20">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthCells.map((cell) => {
            const dayKey = cell.date.toISOString();
            const dayTasks = getTasksForDay(tasks, cell.date);
            return (
              <div
                key={dayKey}
                className={cn(
                  'min-h-28 border-b border-r border-border/60 p-1.5 last:border-r-0',
                  !cell.isCurrentMonth && 'bg-muted/10',
                  dragOverDayKey === dayKey && canEdit && 'bg-brand-indigo/5',
                )}
                onDragOver={(event) => {
                  if (!canEdit) {
                    return;
                  }
                  event.preventDefault();
                  setDragOverDayKey(dayKey);
                }}
                onDragLeave={() => {
                  setDragOverDayKey((current) => (current === dayKey ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverDayKey(null);
                  const taskId = event.dataTransfer.getData('text/task-id');
                  if (!taskId) {
                    return;
                  }
                  void handleDropTask(taskId, cell.date);
                }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                      cell.isToday && 'bg-brand-indigo text-white',
                      !cell.isToday && cell.isCurrentMonth && 'text-foreground',
                      !cell.isToday && !cell.isCurrentMonth && 'text-muted-foreground',
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, 4).map((task) => {
                    const dueLabel = formatDueDate(task.dueAt, task.completedAt);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        draggable={canEdit}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/task-id', task.id);
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        className={cn(
                          'w-full rounded-md border border-border/70 bg-background px-1.5 py-1 text-left text-[11px] leading-tight shadow-none transition-colors hover:border-brand-indigo/40',
                          canEdit && 'cursor-grab active:cursor-grabbing',
                          task.completedAt && 'opacity-70',
                        )}
                        onClick={() => onOpenTask(task.id)}
                      >
                        <span
                          className={cn(
                            'block truncate font-medium',
                            task.completedAt && 'line-through',
                          )}
                        >
                          {task.name}
                        </span>
                        {dueLabel ? (
                          <span
                            className={cn(
                              'mt-0.5 block truncate',
                              dueDateToneClassName(dueLabel.tone),
                            )}
                          >
                            {dueLabel.label}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  {dayTasks.length > 4 ? (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 4} más
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
