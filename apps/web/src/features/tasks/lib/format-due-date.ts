export type DueDateTone = 'default' | 'today' | 'overdue' | 'completed';

export type FormattedDueDate = {
  readonly label: string;
  readonly tone: DueDateTone;
};

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDueDate(
  dueAt: string | null,
  completedAt: string | null,
): FormattedDueDate | null {
  if (!dueAt) {
    return null;
  }
  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }
  if (completedAt) {
    return {
      label: formatShortDate(dueDate),
      tone: 'completed',
    };
  }
  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);
  if (dueDay.getTime() < today.getTime()) {
    return {
      label: formatShortDate(dueDate),
      tone: 'overdue',
    };
  }
  if (dueDay.getTime() === today.getTime()) {
    return {
      label: 'Hoy',
      tone: 'today',
    };
  }
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDay.getTime() === tomorrow.getTime()) {
    return {
      label: 'Mañana',
      tone: 'default',
    };
  }
  return {
    label: formatShortDate(dueDate),
    tone: 'default',
  };
}

export function formatTaskDateRange(
  startAt: string | null,
  dueAt: string | null,
  completedAt: string | null,
): FormattedDueDate | null {
  if (!startAt && !dueAt) {
    return null;
  }
  if (startAt && dueAt) {
    const startDate = new Date(startAt);
    const dueDate = new Date(dueAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(dueDate.getTime())) {
      return null;
    }
    const dueFormatted = formatDueDate(dueAt, completedAt);
    return {
      label: `${formatShortDate(startDate)} – ${formatShortDate(dueDate)}`,
      tone: dueFormatted?.tone ?? 'default',
    };
  }
  if (dueAt) {
    return formatDueDate(dueAt, completedAt);
  }
  const startDate = new Date(startAt!);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }
  return {
    label: `Desde ${formatShortDate(startDate)}`,
    tone: 'default',
  };
}

export function dueDateToneClassName(tone: DueDateTone): string {
  switch (tone) {
    case 'today':
      return 'text-brand-indigo';
    case 'overdue':
      return 'text-destructive';
    case 'completed':
      return 'text-muted-foreground line-through';
    default:
      return 'text-muted-foreground';
  }
}
