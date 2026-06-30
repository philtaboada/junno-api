'use client';

import { useState } from 'react';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
  ProjectListColumnDto,
  TaskSummaryDto,
} from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { InlineAddSubtaskRow } from '@/features/tasks/components/inline-add-subtask-row';
import { ProjectTaskTableRow } from '@/features/tasks/components/project-task-table-row';
import { SubtaskTableRow } from '@/features/tasks/components/subtask-table-row';

type TaskListTaskGroupProps = {
  task: TaskSummaryDto;
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  members: AssigneePickerMember[];
  canEdit: boolean;
  showTrailingActions?: boolean;
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
  onAddSubtask: (parentTaskId: string, name: string) => Promise<void>;
};

export function TaskListTaskGroup({
  task,
  listColumns,
  customFields,
  members,
  canEdit,
  showTrailingActions = false,
  onOpen,
  onNameChange,
  onToggleComplete,
  onAssigneeChange,
  onDateRangeChange,
  onCustomFieldChange,
  onAddSubtask,
}: TaskListTaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState((task.subtasks?.length ?? 0) > 0);
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
  const canShowSubtasks = hasSubtasks || canEdit;

  async function handleAddSubtask(name: string): Promise<void> {
    await onAddSubtask(task.id, name);
    setIsExpanded(true);
  }

  return (
    <div>
      <ProjectTaskTableRow
        task={task}
        listColumns={listColumns}
        customFields={customFields}
        members={members}
        canEdit={canEdit}
        showTrailingActions={showTrailingActions}
        isExpanded={isExpanded}
        canExpand={canShowSubtasks}
        onToggleExpand={() => setIsExpanded((current) => !current)}
        onOpen={onOpen}
        onNameChange={onNameChange}
        onToggleComplete={onToggleComplete}
        onAssigneeChange={onAssigneeChange}
        onDateRangeChange={onDateRangeChange}
        onCustomFieldChange={onCustomFieldChange}
      />
      {isExpanded && canShowSubtasks ? (
        <div className="border-b border-border/40 bg-muted/5">
          {(task.subtasks ?? []).map((subtask) => (
            <SubtaskTableRow
              key={subtask.id}
              subtask={subtask}
              parentTaskId={task.id}
              listColumns={listColumns}
              customFields={customFields}
              members={members}
              canEdit={canEdit}
              showTrailingActions={showTrailingActions}
              onOpen={onOpen}
              onOpenParent={onOpen}
              onNameChange={onNameChange}
              onToggleComplete={onToggleComplete}
              onAssigneeChange={onAssigneeChange}
              onDateRangeChange={onDateRangeChange}
              onCustomFieldChange={onCustomFieldChange}
            />
          ))}
          {canEdit ? (
            <InlineAddSubtaskRow
              listColumns={listColumns}
              customFields={customFields}
              showTrailingActions={showTrailingActions}
              onAdd={handleAddSubtask}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
