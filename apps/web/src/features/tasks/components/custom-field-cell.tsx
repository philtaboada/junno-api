'use client';

import { useMemo, useState } from 'react';
import { Play, Square } from 'lucide-react';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
} from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { TaskAssigneePicker } from '@/features/tasks/components/task-assignee-picker';
import { TaskDueDatePicker } from '@/features/tasks/components/task-due-date-picker';
import { buildEmptyCustomFieldValue } from '@/features/tasks/lib/custom-fields';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type CustomFieldCellProps = {
  field: CustomFieldDefinitionDto;
  value: CustomFieldValueDto | undefined;
  members: AssigneePickerMember[];
  canEdit: boolean;
  onValueChange: (value: CustomFieldValueDto | null) => Promise<void>;
};

function formatTimer(seconds: number, runningSince: string | null): string {
  let totalSeconds = seconds;
  if (runningSince) {
    const elapsed = Math.floor(
      (Date.now() - new Date(runningSince).getTime()) / 1000,
    );
    totalSeconds += Math.max(0, elapsed);
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function CustomFieldCell({
  field,
  value,
  members,
  canEdit,
  onValueChange,
}: CustomFieldCellProps) {
  const resolvedValue = value ?? buildEmptyCustomFieldValue(field.type);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftNumber, setDraftNumber] = useState('');

  async function saveValue(nextValue: CustomFieldValueDto | null): Promise<void> {
    setIsSaving(true);
    try {
      await onValueChange(nextValue);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (field.type === 'text') {
    if (!canEdit) {
      return (
        <span className="block truncate px-1 text-xs text-muted-foreground">
          {resolvedValue.type === 'text' && resolvedValue.text ? resolvedValue.text : '—'}
        </span>
      );
    }
    if (isOpen) {
      return (
        <input
          autoFocus
          type="text"
          value={draftText}
          disabled={isSaving}
          className="h-8 w-full rounded-md border border-border/80 px-2 text-xs outline-none"
          onChange={(event) => setDraftText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void saveValue({
                type: 'text',
                text: draftText.trim() || null,
              });
            }
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          onBlur={() =>
            void saveValue({ type: 'text', text: draftText.trim() || null })
          }
        />
      );
    }
    return (
      <button
        type="button"
        className="flex min-h-8 w-full items-center truncate rounded-md px-1 text-left text-xs text-muted-foreground hover:bg-muted/70"
        onClick={() => {
          setDraftText(resolvedValue.type === 'text' ? resolvedValue.text ?? '' : '');
          setIsOpen(true);
        }}
      >
        {resolvedValue.type === 'text' && resolvedValue.text
          ? resolvedValue.text
          : 'Añadir texto'}
      </button>
    );
  }

  if (field.type === 'number') {
    if (!canEdit) {
      return (
        <span className="px-1 text-xs text-muted-foreground">
          {resolvedValue.type === 'number' && resolvedValue.number !== null
            ? resolvedValue.number
            : '—'}
        </span>
      );
    }
    if (isOpen) {
      return (
        <input
          autoFocus
          type="number"
          value={draftNumber}
          disabled={isSaving}
          className="h-8 w-full rounded-md border border-border/80 px-2 text-xs outline-none"
          onChange={(event) => setDraftNumber(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              const parsed = draftNumber.trim().length > 0 ? Number(draftNumber) : null;
              void saveValue({ type: 'number', number: parsed });
            }
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          onBlur={() => {
            const parsed = draftNumber.trim().length > 0 ? Number(draftNumber) : null;
            void saveValue({ type: 'number', number: parsed });
          }}
        />
      );
    }
    return (
      <button
        type="button"
        className="flex min-h-8 w-full items-center rounded-md px-1 text-left text-xs text-muted-foreground hover:bg-muted/70"
        onClick={() => {
          setDraftNumber(
            resolvedValue.type === 'number' && resolvedValue.number !== null
              ? String(resolvedValue.number)
              : '',
          );
          setIsOpen(true);
        }}
      >
        {resolvedValue.type === 'number' && resolvedValue.number !== null
          ? resolvedValue.number
          : '—'}
      </button>
    );
  }

  if (field.type === 'date') {
    if (field.settings.isRange) {
      const startDate =
        resolvedValue.type === 'date' ? resolvedValue.startDate ?? null : null;
      const endDate = resolvedValue.type === 'date' ? resolvedValue.endDate ?? null : null;
      return (
        <TaskDueDatePicker
          startAt={startDate}
          dueAt={endDate}
          completedAt={null}
          canEdit={canEdit}
          mode="range"
          onDateRangeChange={async ({ startAt, dueAt }) => {
            await saveValue({
              type: 'date',
              startDate: startAt,
              endDate: dueAt,
            });
          }}
        />
      );
    }
    const dueAt = resolvedValue.type === 'date' ? resolvedValue.date ?? null : null;
    return (
      <TaskDueDatePicker
        startAt={null}
        dueAt={dueAt}
        completedAt={null}
        canEdit={canEdit}
        mode="single"
        onDateRangeChange={async ({ dueAt: nextDueAt }) => {
          await saveValue({ type: 'date', date: nextDueAt });
        }}
      />
    );
  }

  if (field.type === 'people') {
    const selectedIds =
      resolvedValue.type === 'people' ? resolvedValue.userIds : [];
    const primaryMember = selectedIds[0]
      ? members.find((member) => member.userId === selectedIds[0])
      : null;
    const assignee = primaryMember
      ? {
          userId: primaryMember.userId,
          name: primaryMember.name,
          email: primaryMember.email,
        }
      : null;
    if (field.settings.allowMultiple) {
      return (
        <PeopleMultiPicker
          members={members}
          selectedIds={selectedIds}
          canEdit={canEdit}
          isSaving={isSaving}
          onChange={(userIds) => void saveValue({ type: 'people', userIds })}
        />
      );
    }
    return (
      <TaskAssigneePicker
        assignee={assignee}
        members={members}
        canEdit={canEdit}
        onAssigneeChange={async (userId) => {
          await saveValue({
            type: 'people',
            userIds: userId ? [userId] : [],
          });
        }}
      />
    );
  }

  if (field.type === 'timer') {
    const timerValue =
      resolvedValue.type === 'timer'
        ? resolvedValue
        : { type: 'timer' as const, seconds: 0, runningSince: null };
    const label = formatTimer(timerValue.seconds, timerValue.runningSince);
    const isRunning = Boolean(timerValue.runningSince);
    return (
      <div className="flex min-h-8 items-center gap-1 px-1">
        <span className="text-xs font-medium tabular-nums">{label}</span>
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isSaving}
            onClick={() =>
              void saveValue(
                isRunning
                  ? {
                      type: 'timer',
                      seconds:
                        timerValue.seconds +
                        Math.floor(
                          (Date.now() -
                            new Date(timerValue.runningSince!).getTime()) /
                            1000,
                        ),
                      runningSince: null,
                    }
                  : {
                      type: 'timer',
                      seconds: timerValue.seconds,
                      runningSince: new Date().toISOString(),
                    },
              )
            }
          >
            {isRunning ? <Square className="size-3" /> : <Play className="size-3" />}
          </Button>
        ) : null}
      </div>
    );
  }

  if (field.type === 'select' || field.type === 'multiselect') {
    const options = field.settings.options ?? [];
    const selectedOptionId =
      resolvedValue.type === 'select' ? resolvedValue.optionId : null;
    const selectedOptionIds =
      resolvedValue.type === 'multiselect' ? resolvedValue.optionIds : [];
    const selectedLabel =
      field.type === 'select'
        ? options.find((option) => option.id === selectedOptionId)?.label
        : options
            .filter((option) => selectedOptionIds.includes(option.id))
            .map((option) => option.label)
            .join(', ');

    if (!canEdit) {
      return (
        <span className="block truncate px-1 text-xs text-muted-foreground">
          {selectedLabel || '—'}
        </span>
      );
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex min-h-8 w-full items-center truncate rounded-md px-1 text-left text-xs hover:bg-muted/70"
            >
              {selectedLabel || (
                <span className="text-muted-foreground">Seleccionar</span>
              )}
            </button>
          }
        />
        <PopoverContent align="start" className="w-48 p-1">
          {field.type === 'select' ? (
            <>
              <button
                type="button"
                className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70"
                onClick={() => void saveValue({ type: 'select', optionId: null })}
              >
                Sin valor
              </button>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70',
                    selectedOptionId === option.id && 'bg-brand-indigo/10',
                  )}
                  onClick={() =>
                    void saveValue({ type: 'select', optionId: option.id })
                  }
                >
                  {option.label}
                </button>
              ))}
            </>
          ) : (
            options.map((option) => {
              const isSelected = selectedOptionIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70',
                    isSelected && 'bg-brand-indigo/10',
                  )}
                  onClick={() => {
                    const nextIds = isSelected
                      ? selectedOptionIds.filter((id) => id !== option.id)
                      : [...selectedOptionIds, option.id];
                    void saveValue({ type: 'multiselect', optionIds: nextIds });
                  }}
                >
                  <span
                    className={cn(
                      'size-3 rounded border',
                      isSelected && 'bg-brand-indigo border-brand-indigo',
                    )}
                  />
                  {option.label}
                </button>
              );
            })
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return <span className="px-1 text-xs text-muted-foreground">—</span>;
}

function PeopleMultiPicker({
  members,
  selectedIds,
  canEdit,
  isSaving,
  onChange,
}: {
  members: AssigneePickerMember[];
  selectedIds: string[];
  canEdit: boolean;
  isSaving: boolean;
  onChange: (userIds: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const label = useMemo(() => {
    if (selectedIds.length === 0) {
      return 'Añadir personas';
    }
    return members
      .filter((member) => selectedIds.includes(member.userId))
      .map((member) => member.name)
      .join(', ');
  }, [members, selectedIds]);

  if (!canEdit) {
    return <span className="px-1 text-xs text-muted-foreground">{label}</span>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex min-h-8 w-full truncate rounded-md px-1 text-left text-xs hover:bg-muted/70"
          >
            {label}
          </button>
        }
      />
      <PopoverContent align="start" className="w-56 p-1">
        {members.map((member) => {
          const isSelected = selectedIds.includes(member.userId);
          return (
            <button
              key={member.userId}
              type="button"
              disabled={isSaving}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70',
                isSelected && 'bg-brand-indigo/10',
              )}
              onClick={() => {
                const nextIds = isSelected
                  ? selectedIds.filter((id) => id !== member.userId)
                  : [...selectedIds, member.userId];
                onChange(nextIds);
              }}
            >
              {member.name}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
