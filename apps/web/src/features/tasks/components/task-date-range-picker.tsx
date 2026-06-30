'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  dueDateToneClassName,
  formatTaskDateRange,
} from '@/features/tasks/lib/format-due-date';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type TaskDateRange = {
  readonly startAt: string | null;
  readonly dueAt: string | null;
};

type TaskDateRangePickerProps = {
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  canEdit: boolean;
  mode?: 'single' | 'range';
  onDateRangeChange: (range: TaskDateRange) => Promise<void>;
};

type ActiveDateField = 'start' | 'due';

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

function buildMonthGrid(monthDate: Date): Array<Date | null> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function getQuickDateOptions(): Array<{ label: string; value: string }> {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7;
  nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
  return [
    { label: 'Hoy', value: toIsoDate(today) },
    { label: 'Mañana', value: toIsoDate(tomorrow) },
    { label: 'Próxima semana', value: toIsoDate(nextWeek) },
  ];
}

function getInitialMonth(startAt: string | null, dueAt: string | null): Date {
  const base = dueAt ?? startAt ?? new Date().toISOString();
  const parsed = new Date(base);
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

export function TaskDateRangePicker({
  startAt,
  dueAt,
  completedAt,
  canEdit,
  mode = 'range',
  onDateRangeChange,
}: TaskDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<ActiveDateField>('due');
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(startAt, dueAt));
  const formattedRange = formatTaskDateRange(startAt, dueAt, completedAt);
  const selectedStartDay = startAt ? startOfDay(new Date(startAt)) : null;
  const selectedDueDay = dueAt ? startOfDay(new Date(dueAt)) : null;
  const today = startOfDay(new Date());
  const monthCells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const quickOptions = useMemo(() => getQuickDateOptions(), []);
  const isRangeMode = mode === 'range';

  async function persistRange(nextRange: TaskDateRange): Promise<void> {
    setIsSaving(true);
    try {
      await onDateRangeChange(nextRange);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSelect(value: string | null): Promise<void> {
    if (isRangeMode && activeField === 'start') {
      await persistRange({ startAt: value, dueAt });
      return;
    }
    await persistRange({ startAt, dueAt: value });
  }

  const triggerLabel = formattedRange ? (
    <span
      className={cn(
        'truncate text-xs font-medium',
        dueDateToneClassName(formattedRange.tone),
      )}
    >
      {formattedRange.label}
    </span>
  ) : (
    <span className="truncate text-xs text-muted-foreground">Añadir fecha</span>
  );

  if (!canEdit) {
    return (
      <div className="flex min-h-8 min-w-0 items-center overflow-hidden px-1">
        {formattedRange ? triggerLabel : <span className="truncate text-xs text-muted-foreground">—</span>}
      </div>
    );
  }

  const selectedDay = isRangeMode && activeField === 'start' ? selectedStartDay : selectedDueDay;
  const rangeStartDay =
    isRangeMode && selectedStartDay && selectedDueDay
      ? selectedStartDay.getTime() <= selectedDueDay.getTime()
        ? selectedStartDay
        : selectedDueDay
      : null;
  const rangeEndDay =
    isRangeMode && selectedStartDay && selectedDueDay
      ? selectedStartDay.getTime() <= selectedDueDay.getTime()
        ? selectedDueDay
        : selectedStartDay
      : null;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setVisibleMonth(getInitialMonth(startAt, dueAt));
          setActiveField(dueAt ? 'due' : 'start');
        }
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex min-h-8 w-full min-w-0 items-center overflow-hidden rounded-md px-1 text-left transition-colors hover:bg-muted/70"
            aria-label="Elegir fechas"
          >
            {triggerLabel}
          </button>
        }
      />
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        {isRangeMode ? (
          <div className="grid grid-cols-2 border-b border-border/70 p-1">
            <button
              type="button"
              className={cn(
                'rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors',
                activeField === 'start'
                  ? 'bg-brand-indigo-muted text-brand-indigo'
                  : 'text-muted-foreground hover:bg-muted/70',
              )}
              onClick={() => setActiveField('start')}
            >
              Inicio
              <span className="mt-0.5 block text-[11px] font-normal">
                {selectedStartDay
                  ? selectedStartDay.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Sin fecha'}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors',
                activeField === 'due'
                  ? 'bg-brand-indigo-muted text-brand-indigo'
                  : 'text-muted-foreground hover:bg-muted/70',
              )}
              onClick={() => setActiveField('due')}
            >
              Fin
              <span className="mt-0.5 block text-[11px] font-normal">
                {selectedDueDay
                  ? selectedDueDay.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Sin fecha'}
              </span>
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-1 border-b border-border/70 p-2">
          {quickOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={isSaving}
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/70"
              onClick={() => void handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
          {(isRangeMode && activeField === 'start' ? startAt : dueAt) ? (
            <button
              type="button"
              disabled={isSaving}
              className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted/70"
              onClick={() => void handleSelect(null)}
            >
              Sin fecha
            </button>
          ) : null}
        </div>
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {visibleMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1 font-medium">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthCells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} className="size-8" />;
              }
              const cellDay = startOfDay(cell);
              const cellTime = cellDay.getTime();
              const isSelected = selectedDay?.getTime() === cellTime;
              const isToday = today.getTime() === cellTime;
              const isInRange =
                rangeStartDay &&
                rangeEndDay &&
                cellTime >= rangeStartDay.getTime() &&
                cellTime <= rangeEndDay.getTime();
              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  disabled={isSaving}
                  className={cn(
                    'size-8 rounded-full text-sm transition-colors hover:bg-muted/80',
                    isInRange && !isSelected && 'bg-brand-indigo/10 text-brand-indigo',
                    isSelected && 'bg-brand-indigo text-white hover:bg-brand-indigo',
                    !isSelected && isToday && 'ring-1 ring-brand-indigo/40',
                  )}
                  onClick={() => void handleSelect(toIsoDate(cellDay))}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
