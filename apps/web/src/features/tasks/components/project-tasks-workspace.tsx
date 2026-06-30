'use client';

import { useState } from 'react';
import type { ProjectDetailDto, TaskSummaryDto } from '@pm/contracts';
import { canCommentOnProject, canEditSections } from '@/features/projects/lib/project-access';
import type { ProjectViewMode } from '@/features/projects/components/project-view-tabs';
import { ProjectTasksBoardView } from '@/features/tasks/components/project-tasks-board-view';
import { ProjectTasksCalendarView } from '@/features/tasks/components/project-tasks-calendar-view';
import { ProjectTasksListView } from '@/features/tasks/components/project-tasks-list-view';
import { ProjectTasksTimelineView } from '@/features/tasks/components/project-tasks-timeline-view';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { useAuthStore, useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { useWorkspaceTaskChanged } from '@/hooks/use-workspace-task-changed';
import { ApiError, fetchProjectTasks, updateTask } from '@/lib/api/tasks';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import {
  mapTaskOrSubtask,
  mergeTaskInList,
} from '@/features/tasks/lib/task-list-mutations';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type ProjectTasksWorkspaceProps = {
  project: ProjectDetailDto;
  activeView: ProjectViewMode;
  onProjectUpdated: (project: ProjectDetailDto) => void;
};

export function ProjectTasksWorkspace({
  project,
  activeView,
  onProjectUpdated,
}: ProjectTasksWorkspaceProps) {
  const { user } = useAuthStore();
  const activeWorkspace = useActiveWorkspace();
  const canEdit = canEditSections(project, user?.id);
  const canComment = canCommentOnProject(project, user?.id);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const {
    data: tasksPayload,
    error: loadError,
    isLoading,
    setData: setTasksPayload,
    reload: loadTasks,
  } = useAsyncResource(
    [project.id],
    async () => fetchProjectTasks(project.id),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar las tareas',
  );
  const tasks = tasksPayload?.tasks ?? null;
  const dependencies = tasksPayload?.dependencies ?? [];
  const updateTasks: React.Dispatch<React.SetStateAction<TaskSummaryDto[]>> = (
    updater,
  ) => {
    setTasksPayload((current) => {
      const base = current?.tasks ?? [];
      const nextTasks =
        typeof updater === 'function' ? updater(base) : updater;
      if (!current) {
        return current;
      }
      return { ...current, tasks: nextTasks };
    });
  };

  useWorkspaceTaskChanged(activeWorkspace?.id, (payload) => {
    if (payload.projectId !== project.id) {
      return;
    }
    loadTasks();
    if (selectedTaskId === payload.taskId) {
      setIsSheetOpen(true);
    }
  });

  async function handleToggleComplete(
    taskId: string,
    completed: boolean,
  ): Promise<void> {
    if (!canEdit) {
      return;
    }
    const currentTasks = tasks ?? [];
    const previousTasks = currentTasks;
    updateTasks(
      mapTaskOrSubtask(currentTasks, taskId, (task) => ({
        ...task,
        completedAt: completed ? new Date().toISOString() : null,
      })),
    );
    try {
      const updated = await updateTask(taskId, { completed });
      updateTasks((current) =>
        mergeTaskInList(current ?? [], taskId, toTaskSummary(updated)),
      );
    } catch (error) {
      updateTasks(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la tarea';
      toast.error(message);
    }
  }

  function handleOpenTask(taskId: string): void {
    setSelectedTaskId(taskId);
    setIsSheetOpen(true);
  }

  function handleTaskUpdated(task: TaskSummaryDto): void {
    updateTasks((current) => mergeTaskInList(current ?? [], task.id, task));
  }

  function handleTaskDeleted(taskId: string): void {
    updateTasks((current) => (current ?? []).filter((item) => item.id !== taskId));
    setSelectedTaskId(null);
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

  const resolvedTasks = tasks ?? [];

  function renderActiveView(): React.ReactNode {
    if (activeView === 'list') {
      return (
        <ProjectTasksListView
          project={project}
          tasks={resolvedTasks}
          canEdit={canEdit}
          onTasksChange={updateTasks}
          onProjectUpdated={onProjectUpdated}
          onOpenTask={handleOpenTask}
          onToggleComplete={(taskId, completed) => {
            void handleToggleComplete(taskId, completed);
          }}
        />
      );
    }
    if (activeView === 'board') {
      return (
        <ProjectTasksBoardView
          project={project}
          tasks={resolvedTasks}
          canEdit={canEdit}
          onTasksChange={updateTasks}
          onProjectUpdated={onProjectUpdated}
          onOpenTask={handleOpenTask}
        />
      );
    }
    if (activeView === 'calendar') {
      return (
        <ProjectTasksCalendarView
          tasks={resolvedTasks}
          canEdit={canEdit}
          onTasksChange={(next) => {
            if (typeof next === 'function') {
              updateTasks((current) => next(current ?? []));
              return;
            }
            updateTasks(next);
          }}
          onOpenTask={handleOpenTask}
        />
      );
    }
    return (
      <ProjectTasksTimelineView
        project={project}
        tasks={resolvedTasks}
        dependencies={dependencies}
        canEdit={canEdit}
        onTasksChange={updateTasks}
        onOpenTask={handleOpenTask}
      />
    );
  }

  return (
    <>
      {renderActiveView()}
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        canEdit={canEdit}
        canComment={canComment}
        members={project.members}
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
