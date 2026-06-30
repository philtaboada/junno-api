import type { TaskSummaryDto } from '@pm/contracts';

export type CalendarDayCell = {
  readonly date: Date;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
};

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return startOfLocalDay(left).getTime() === startOfLocalDay(right).getTime();
}

export function buildMonthGrid(referenceDate: Date): CalendarDayCell[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const today = startOfLocalDay(new Date());
  const cells: CalendarDayCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    cells.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameLocalDay(date, today),
    });
  }
  return cells;
}

export function formatMonthTitle(referenceDate: Date): string {
  return referenceDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
}

export function taskAppearsOnDay(task: TaskSummaryDto, day: Date): boolean {
  if (task.parentTaskId) {
    return false;
  }
  const dayStart = startOfLocalDay(day).getTime();
  const startAt = task.startAt ? startOfLocalDay(new Date(task.startAt)).getTime() : null;
  const dueAt = task.dueAt ? startOfLocalDay(new Date(task.dueAt)).getTime() : null;
  if (startAt !== null && dueAt !== null) {
    return dayStart >= startAt && dayStart <= dueAt;
  }
  if (dueAt !== null) {
    return dayStart === dueAt;
  }
  if (startAt !== null) {
    return dayStart === startAt;
  }
  return false;
}

export function getTasksForDay(tasks: TaskSummaryDto[], day: Date): TaskSummaryDto[] {
  return tasks
    .filter((task) => taskAppearsOnDay(task, day))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function moveTaskToLocalDay(
  task: TaskSummaryDto,
  targetDay: Date,
): { startAt: string | null; dueAt: string | null } {
  const target = startOfLocalDay(targetDay);
  if (task.startAt && task.dueAt) {
    const startDate = new Date(task.startAt);
    const dueDate = new Date(task.dueAt);
    const durationMs = dueDate.getTime() - startDate.getTime();
    const nextDue = new Date(target);
    if (task.dueHasTime) {
      nextDue.setHours(dueDate.getHours(), dueDate.getMinutes(), 0, 0);
    }
    const nextStart = new Date(nextDue.getTime() - durationMs);
    return {
      startAt: nextStart.toISOString(),
      dueAt: nextDue.toISOString(),
    };
  }
  if (task.dueAt) {
    const previousDue = new Date(task.dueAt);
    const nextDue = new Date(target);
    if (task.dueHasTime) {
      nextDue.setHours(previousDue.getHours(), previousDue.getMinutes(), 0, 0);
    }
    return {
      startAt: task.startAt,
      dueAt: nextDue.toISOString(),
    };
  }
  if (task.startAt) {
    const previousStart = new Date(task.startAt);
    const nextStart = new Date(target);
    if (task.startHasTime) {
      nextStart.setHours(
        previousStart.getHours(),
        previousStart.getMinutes(),
        0,
        0,
      );
    }
    return {
      startAt: nextStart.toISOString(),
      dueAt: task.dueAt,
    };
  }
  return {
    startAt: target.toISOString(),
    dueAt: target.toISOString(),
  };
}

export function addMonths(referenceDate: Date, delta: number): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + delta, 1);
}
