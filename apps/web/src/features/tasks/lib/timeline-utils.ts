import type { TaskSummaryDto } from '@pm/contracts';

export const TIMELINE_DAY_WIDTH = 36;
export const TIMELINE_ROW_HEIGHT = 40;
export const TIMELINE_HEADER_HEIGHT = 44;
export const TIMELINE_LABEL_WIDTH = 264;
export const TIMELINE_DEFAULT_DAY_COUNT = 28;

const DAY_MS = 86_400_000;

export type TimelineDayHeader = {
  readonly date: Date;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
};

export type TimelineBarRange = {
  readonly startIndex: number;
  readonly endIndex: number;
};

export function startOfLocalWeek(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function buildTimelineDays(
  rangeStart: Date,
  dayCount: number,
): TimelineDayHeader[] {
  const today = startOfLocalDay(new Date()).getTime();
  const days: TimelineDayHeader[] = [];
  for (let index = 0; index < dayCount; index += 1) {
    const date = addDays(rangeStart, index);
    const weekday = date.getDay();
    days.push({
      date,
      isToday: startOfLocalDay(date).getTime() === today,
      isWeekend: weekday === 0 || weekday === 6,
    });
  }
  return days;
}

export function formatTimelineRangeTitle(rangeStart: Date, dayCount: number): string {
  const rangeEnd = addDays(rangeStart, dayCount - 1);
  const startLabel = rangeStart.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = rangeEnd.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function getTaskTimelineBar(
  task: TaskSummaryDto,
  rangeStart: Date,
  dayCount: number,
): TimelineBarRange | null {
  if (task.parentTaskId) {
    return null;
  }
  const rangeStartMs = startOfLocalDay(rangeStart).getTime();
  const toIndex = (iso: string): number =>
    Math.floor((startOfLocalDay(new Date(iso)).getTime() - rangeStartMs) / DAY_MS);
  let startIndex = task.startAt ? toIndex(task.startAt) : null;
  let endIndex = task.dueAt ? toIndex(task.dueAt) : null;
  if (startIndex === null && endIndex !== null) {
    startIndex = endIndex;
  }
  if (endIndex === null && startIndex !== null) {
    endIndex = startIndex;
  }
  if (startIndex === null || endIndex === null) {
    return null;
  }
  if (endIndex < startIndex) {
    const swap = startIndex;
    startIndex = endIndex;
    endIndex = swap;
  }
  if (endIndex < 0 || startIndex >= dayCount) {
    return null;
  }
  return {
    startIndex: Math.max(0, startIndex),
    endIndex: Math.min(dayCount - 1, endIndex),
  };
}

export function shiftTaskDatesByDays(
  task: TaskSummaryDto,
  deltaDays: number,
): { startAt: string | null; dueAt: string | null } {
  const shiftIso = (value: string | null): string | null => {
    if (!value) {
      return null;
    }
    const next = new Date(value);
    next.setDate(next.getDate() + deltaDays);
    return next.toISOString();
  };
  return {
    startAt: shiftIso(task.startAt),
    dueAt: shiftIso(task.dueAt),
  };
}

export function shiftTimelineRange(rangeStart: Date, deltaDays: number): Date {
  return addDays(rangeStart, deltaDays);
}

export function formatTimelineDayLabel(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
}
