'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
  ProjectListColumnDto,
  TaskSummaryDto,
} from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { TaskNameCell } from '@/features/tasks/components/task-name-cell';
import { TaskSubtaskCountBadge } from '@/features/tasks/components/task-subtask-count-badge';
import { TaskBlockedBadge } from '@/features/tasks/components/task-blocked-badge';
import { TaskAssigneePicker } from '@/features/tasks/components/task-assignee-picker';
import { CustomFieldCell } from '@/features/tasks/components/custom-field-cell';
import { TaskDueDatePicker } from '@/features/tasks/components/task-due-date-picker';
import {
  buildListGridStyle,
  getCustomFieldForColumn,
  LIST_GRID_ROW_CLASSNAME,
  resolveVisibleListColumns,
} from '@/features/tasks/lib/list-column-registry';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type TaskTableRowProps = {
  task: TaskSummaryDto;
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  members: AssigneePickerMember[];
  canEdit: boolean;
  showProject?: boolean;
  showTrailingActions?: boolean;
  canExpand?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpen: (taskId: string) => void;
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

export function TaskTableRow({
  task,
  listColumns,
  customFields,
  members,
  canEdit,
  showProject = false,
  showTrailingActions = false,
  canExpand = false,
  isExpanded = false,
  onToggleExpand,
  onOpen,
  onNameChange,
  onToggleComplete,
  onAssigneeChange,
  onDateRangeChange,
  onCustomFieldChange,
}: TaskTableRowProps) {
  const isCompleted = task.completedAt !== null;
  const subtaskCount = task.subtaskCount ?? task.subtasks?.length ?? 0;
  const visibleColumns = resolveVisibleListColumns(listColumns);
  const gridStyle = buildListGridStyle(listColumns, customFields, {
    showProject,
    showTrailingActions,
  });

  function renderDataColumn(column: ProjectListColumnDto) {
    if (column.fieldKey === 'due_at') {
      return (
        <TaskDueDatePicker
          startAt={task.startAt}
          dueAt={task.dueAt}
          completedAt={task.completedAt}
          canEdit={canEdit}
          onDateRangeChange={({ startAt, dueAt }) =>
            onDateRangeChange(task.id, { startAt, dueAt })
          }
        />
      );
    }
    if (column.fieldKey === 'assignee') {
      return (
        <TaskAssigneePicker
          assignee={task.assignee}
          members={members}
          canEdit={canEdit}
          onAssigneeChange={(assigneeId) => onAssigneeChange(task.id, assigneeId)}
        />
      );
    }
    const field = getCustomFieldForColumn(column, customFields);
    if (!field) {
      return <span className="px-1 text-xs text-muted-foreground">—</span>;
    }
    return (
      <CustomFieldCell
        field={field}
        value={task.customFieldValues[field.id]}
        members={members}
        canEdit={canEdit}
        onValueChange={(value) => onCustomFieldChange(task.id, field.id, value)}
      />
    );
  }

  return (
    <div
      className={cn(
        LIST_GRID_ROW_CLASSNAME,
        'group border-b border-border/50 px-4 py-1.5 last:border-b-0 hover:bg-muted/30',
      )}
      style={gridStyle}
    >
      <div className="flex min-w-0 items-center justify-center overflow-hidden">
        {canExpand ? (
          <button
            type="button"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            aria-label={isExpanded ? 'Ocultar subtareas' : 'Mostrar subtareas'}
            title={isExpanded ? 'Ocultar subtareas' : 'Mostrar subtareas'}
            aria-expanded={isExpanded}
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      <Checkbox
        className="shrink-0"
        checked={isCompleted}
        disabled={!canEdit}
        onCheckedChange={(checked) => {
          if (typeof checked === 'boolean') {
            onToggleComplete(task.id, checked);
          }
        }}
        aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
      />
      <div className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <TaskNameCell
              name={task.name}
              isCompleted={isCompleted}
              canEdit={canEdit}
              onNameChange={(name) => onNameChange(task.id, name)}
              onOpen={() => onOpen(task.id)}
            />
          </div>
          {subtaskCount > 0 ? <TaskSubtaskCountBadge count={subtaskCount} /> : null}
          <TaskBlockedBadge isBlocked={task.isBlocked} />
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
      {showProject ? (
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {task.projectName}
        </span>
      ) : null}
      {showTrailingActions ? <span aria-hidden className="size-7 shrink-0" /> : null}
    </div>
  );
}

export { TaskTableRow as ProjectTaskTableRow };
