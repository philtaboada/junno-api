'use client';

import { CornerDownRight } from 'lucide-react';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
  ProjectListColumnDto,
  TaskSummaryDto,
} from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { TaskSubtaskCountBadge } from '@/features/tasks/components/task-subtask-count-badge';
import { TaskNameCell } from '@/features/tasks/components/task-name-cell';
import { TaskAssigneePicker } from '@/features/tasks/components/task-assignee-picker';
import { CustomFieldCell } from '@/features/tasks/components/custom-field-cell';
import { TaskDueDatePicker } from '@/features/tasks/components/task-due-date-picker';
import {
  buildListGridStyle,
  getCustomFieldForColumn,
  LIST_GRID_ROW_CLASSNAME,
  resolveVisibleListColumns,
  SUBTASK_INDENT_CLASSNAME,
  SUBTASK_LEADING_GRID_COLUMN,
} from '@/features/tasks/lib/list-column-registry';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type SubtaskTableRowProps = {
  subtask: TaskSummaryDto;
  parentTaskId: string;
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  members: AssigneePickerMember[];
  canEdit: boolean;
  showTrailingActions?: boolean;
  onOpen: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onNameChange: (taskId: string, name: string) => Promise<void>;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => Promise<void>;
  onDateRangeChange: (
    taskId: string,
    range: { startAt: string | null; dueAt: string | null },
  ) => Promise<void>;
  onCustomFieldChange: (
    taskId: string,
    fieldId: string,
    value: CustomFieldValueDto | null,
  ) => Promise<void>;
};

export function SubtaskTableRow({
  subtask,
  parentTaskId,
  listColumns,
  customFields,
  members,
  canEdit,
  showTrailingActions = false,
  onOpen,
  onOpenParent,
  onNameChange,
  onToggleComplete,
  onAssigneeChange,
  onDateRangeChange,
  onCustomFieldChange,
}: SubtaskTableRowProps) {
  const isCompleted = subtask.completedAt !== null;
  const nestedSubtaskCount = subtask.subtaskCount ?? 0;
  const visibleColumns = resolveVisibleListColumns(listColumns);
  const gridStyle = buildListGridStyle(listColumns, customFields, {
    showTrailingActions,
  });

  function renderDataColumn(column: ProjectListColumnDto) {
    if (column.fieldKey === 'due_at') {
      return (
        <TaskDueDatePicker
          startAt={subtask.startAt}
          dueAt={subtask.dueAt}
          completedAt={subtask.completedAt}
          canEdit={canEdit}
          onDateRangeChange={({ startAt, dueAt }) =>
            onDateRangeChange(subtask.id, { startAt, dueAt })
          }
        />
      );
    }
    if (column.fieldKey === 'assignee') {
      return (
        <TaskAssigneePicker
          assignee={subtask.assignee}
          members={members}
          canEdit={canEdit}
          onAssigneeChange={(assigneeId) => onAssigneeChange(subtask.id, assigneeId)}
        />
      );
    }
    const field = getCustomFieldForColumn(column, customFields);
    if (!field) {
      return <span className="px-1 text-xs text-muted-foreground/70">—</span>;
    }
    return (
      <CustomFieldCell
        field={field}
        value={subtask.customFieldValues[field.id]}
        members={members}
        canEdit={canEdit}
        onValueChange={(value) => onCustomFieldChange(subtask.id, field.id, value)}
      />
    );
  }

  return (
    <div
      className={cn(
        LIST_GRID_ROW_CLASSNAME,
        'group border-b border-border/40 bg-muted/10 px-4 py-1 last:border-b-0 hover:bg-muted/25',
      )}
      style={gridStyle}
    >
      <div className={SUBTASK_INDENT_CLASSNAME} style={{ gridColumn: SUBTASK_LEADING_GRID_COLUMN }}>
        <Checkbox
          className="shrink-0"
          checked={isCompleted}
          disabled={!canEdit}
          onCheckedChange={(checked) => {
            if (typeof checked === 'boolean') {
              onToggleComplete(subtask.id, checked);
            }
          }}
          aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <TaskNameCell
              name={subtask.name}
              isCompleted={isCompleted}
              canEdit={canEdit}
              tone="subtask"
              onNameChange={(name) => onNameChange(subtask.id, name)}
              onOpen={() => onOpen(subtask.id)}
            />
          </div>
          <TaskSubtaskCountBadge count={nestedSubtaskCount} />
        </div>
      </div>
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className={cn(
            'min-w-0 overflow-hidden',
            column.fieldKey === 'assignee' && 'flex justify-center',
          )}
        >
          {renderDataColumn(column)}
        </div>
      ))}
      {showTrailingActions ? (
        <button
          type="button"
          className="inline-flex h-7 min-w-0 items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-brand-indigo"
          onClick={() => onOpenParent(parentTaskId)}
        >
          <CornerDownRight className="size-3 shrink-0" />
          Ver padre
        </button>
      ) : null}
    </div>
  );
}
