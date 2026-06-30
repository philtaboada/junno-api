'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
  MyTasksSectionDto,
  ProjectListColumnDto,
  TaskSummaryDto,
} from '@pm/contracts';
import { ListColumnsSettingsMenu } from '@/features/tasks/components/list-columns-settings-menu';
import { ProjectTaskTableRow } from '@/features/tasks/components/project-task-table-row';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { TaskListColumnHeaders } from '@/features/tasks/components/task-list-column-headers';
import { FALLBACK_LIST_COLUMNS } from '@/features/tasks/lib/list-column-registry';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { useWorkspaceTaskChanged } from '@/hooks/use-workspace-task-changed';
import {
  ApiError,
  fetchMyTasks,
  updateMyTasksListColumns,
  updateTask,
} from '@/lib/api/tasks';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

type MyTasksSectionBlockProps = {
  section: MyTasksSectionDto;
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  workspaceMembers: Array<{ userId: string; name: string; email: string }>;
  onOpenTask: (taskId: string) => void;
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
    value: import('@pm/contracts').CustomFieldValueDto | null,
  ) => Promise<void>;
};

function MyTasksSectionBlock({
  section,
  listColumns,
  customFields,
  workspaceMembers,
  onOpenTask,
  onNameChange,
  onToggleComplete,
  onAssigneeChange,
  onDateRangeChange,
  onCustomFieldChange,
}: MyTasksSectionBlockProps) {
  const resolvedColumns =
    listColumns.length > 0 ? listColumns : FALLBACK_LIST_COLUMNS;

  return (
    <section className="overflow-x-auto rounded-xl border border-border/80 bg-card">
      <div className="border-b border-border/60 bg-muted/15 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight">{section.label}</h2>
      </div>
      {section.tasks.length > 0 ? (
        <div className="w-full min-w-0">
          <TaskListColumnHeaders
            listColumns={resolvedColumns}
            customFields={customFields}
            showProject
            className="border-b-0"
          />
          <div>
            {section.tasks.map((task) => (
              <ProjectTaskTableRow
                key={task.id}
                task={task}
                listColumns={resolvedColumns}
                customFields={customFields}
                members={workspaceMembers}
                canEdit
                showProject
                onOpen={onOpenTask}
                onNameChange={onNameChange}
                onToggleComplete={onToggleComplete}
                onAssigneeChange={onAssigneeChange}
                onDateRangeChange={onDateRangeChange}
                onCustomFieldChange={onCustomFieldChange}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No hay tareas en esta sección.
        </div>
      )}
    </section>
  );
}

export function MyTasksView() {
  const activeWorkspace = useActiveWorkspace();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const {
    data: myTasks,
    error: loadError,
    isLoading,
    setData: setMyTasks,
    reload: loadMyTasks,
  } = useAsyncResource(
    [activeWorkspace?.id],
    () => fetchMyTasks(),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar tus tareas',
  );
  const sections = myTasks?.sections ?? [];
  const listColumns =
    myTasks?.listColumns && myTasks.listColumns.length > 0
      ? myTasks.listColumns
      : FALLBACK_LIST_COLUMNS;
  const customFields = myTasks?.customFields ?? [];
  const workspaceMembers =
    myTasks?.workspaceMembers.map((member) => ({
      userId: member.userId,
      name: member.name,
      email: member.email,
    })) ?? [];

  useWorkspaceTaskChanged(activeWorkspace?.id, () => {
    loadMyTasks();
  });

  function updateTaskInSections(taskId: string, nextTask: TaskSummaryDto): void {
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId ? nextTask : task,
          ),
        })),
      };
    });
  }

  async function handleToggleComplete(
    taskId: string,
    completed: boolean,
  ): Promise<void> {
    const previousSections = sections;
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completedAt: completed ? new Date().toISOString() : null,
                }
              : task,
          ),
        })),
      };
    });
    try {
      const updated = await updateTask(taskId, { completed });
      updateTaskInSections(taskId, toTaskSummary(updated));
    } catch (error) {
      setMyTasks((current) =>
        current ? { ...current, sections: previousSections } : current,
      );
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la tarea';
      toast.error(message);
    }
  }

  async function handleNameChange(taskId: string, name: string): Promise<void> {
    const previous = myTasks;
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId ? { ...task, name } : task,
          ),
        })),
      };
    });
    try {
      const updated = await updateTask(taskId, { name });
      updateTaskInSections(taskId, toTaskSummary(updated));
    } catch (error) {
      setMyTasks(previous);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo renombrar la tarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleAssigneeChange(
    taskId: string,
    assigneeId: string | null,
  ): Promise<void> {
    const previous = myTasks;
    const member = assigneeId
      ? workspaceMembers.find((item) => item.userId === assigneeId)
      : null;
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  assignee: member
                    ? {
                        userId: member.userId,
                        name: member.name,
                        email: member.email,
                      }
                    : null,
                }
              : task,
          ),
        })),
      };
    });
    try {
      const updated = await updateTask(taskId, { assigneeId });
      updateTaskInSections(taskId, toTaskSummary(updated));
    } catch (error) {
      setMyTasks(previous);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo asignar la tarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleDateRangeChange(
    taskId: string,
    range: { startAt: string | null; dueAt: string | null },
  ): Promise<void> {
    const previous = myTasks;
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId
              ? { ...task, startAt: range.startAt, dueAt: range.dueAt }
              : task,
          ),
        })),
      };
    });
    try {
      const updated = await updateTask(taskId, {
        startAt: range.startAt,
        dueAt: range.dueAt,
      });
      updateTaskInSections(taskId, toTaskSummary(updated));
    } catch (error) {
      setMyTasks(previous);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la fecha';
      toast.error(message);
      throw error;
    }
  }

  async function handleCustomFieldChange(
    taskId: string,
    fieldId: string,
    value: CustomFieldValueDto | null,
  ): Promise<void> {
    const previous = myTasks;
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  customFieldValues: value
                    ? { ...task.customFieldValues, [fieldId]: value }
                    : Object.fromEntries(
                        Object.entries(task.customFieldValues).filter(
                          ([key]) => key !== fieldId,
                        ),
                      ),
                }
              : task,
          ),
        })),
      };
    });
    try {
      const updated = await updateTask(taskId, {
        customFieldValues: value ? { [fieldId]: value } : { [fieldId]: null },
      });
      updateTaskInSections(taskId, toTaskSummary(updated));
    } catch (error) {
      setMyTasks(previous);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el campo';
      toast.error(message);
      throw error;
    }
  }

  async function handleSaveListColumns(
    columns: Parameters<typeof updateMyTasksListColumns>[0]['columns'],
  ): Promise<void> {
    const updated = await updateMyTasksListColumns({ columns });
    setMyTasks(updated);
  }

  function handleTaskUpdated(task: TaskSummaryDto): void {
    updateTaskInSections(task.id, task);
    loadMyTasks();
  }

  function handleTaskDeleted(taskId: string): void {
    setMyTasks((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          tasks: section.tasks.filter((item) => item.id !== taskId),
        })),
      };
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
        <ListColumnsSettingsMenu
          listColumns={listColumns}
          customFields={customFields}
          canEdit
          onSave={handleSaveListColumns}
        />
        </div>
        {sections.map((section) => (
          <MyTasksSectionBlock
            key={section.id}
            section={section}
            listColumns={listColumns}
            customFields={customFields}
            workspaceMembers={workspaceMembers}
            onOpenTask={(taskId) => {
              setSelectedTaskId(taskId);
              setIsSheetOpen(true);
            }}
            onNameChange={handleNameChange}
            onToggleComplete={(taskId, completed) => {
              void handleToggleComplete(taskId, completed);
            }}
            onAssigneeChange={handleAssigneeChange}
            onDateRangeChange={handleDateRangeChange}
            onCustomFieldChange={handleCustomFieldChange}
          />
        ))}
      </div>
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        canEdit
        members={workspaceMembers}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedTaskId(null);
          }
        }}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </>
  );
}
