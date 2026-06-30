import type { TaskSummaryDto } from '@pm/contracts';

export function createOptimisticTaskSummary(input: {
  name: string;
  projectId: string;
  projectName: string;
  sectionId: string | null;
  parentTaskId?: string | null;
  position?: number;
}): TaskSummaryDto {
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    name: input.name,
    description: null,
    assignee: null,
    startAt: null,
    startHasTime: false,
    dueAt: null,
    dueHasTime: false,
    completedAt: null,
    parentTaskId: input.parentTaskId ?? null,
    projectId: input.projectId,
    projectName: input.projectName,
    sectionId: input.sectionId,
    position: input.position ?? 0,
    createdAt: new Date().toISOString(),
    customFieldValues: {},
    subtaskCount: 0,
    subtasks: [],
    isBlocked: false,
  };
}

export function findParentTaskId(
  tasks: TaskSummaryDto[],
  taskId: string,
): string | null {
  for (const task of tasks) {
    if ((task.subtasks ?? []).some((subtask) => subtask.id === taskId)) {
      return task.id;
    }
  }
  return null;
}

export function mapTaskOrSubtask(
  tasks: TaskSummaryDto[],
  taskId: string,
  mapper: (task: TaskSummaryDto) => TaskSummaryDto,
): TaskSummaryDto[] {
  const parentTaskId = findParentTaskId(tasks, taskId);
  if (parentTaskId) {
    return tasks.map((task) =>
      task.id === parentTaskId
        ? {
            ...task,
            subtasks: (task.subtasks ?? []).map((subtask) =>
              subtask.id === taskId ? mapper(subtask) : subtask,
            ),
          }
        : task,
    );
  }
  return tasks.map((task) => (task.id === taskId ? mapper(task) : task));
}

export function mergeTaskInList(
  tasks: TaskSummaryDto[],
  taskId: string,
  nextTask: TaskSummaryDto,
): TaskSummaryDto[] {
  const parentTaskId = findParentTaskId(tasks, taskId);
  const normalizedTask: TaskSummaryDto = {
    ...nextTask,
    subtasks: [],
    subtaskCount: nextTask.subtaskCount ?? nextTask.subtasks.length,
  };
  if (parentTaskId) {
    return tasks.map((task) =>
      task.id === parentTaskId
        ? {
            ...task,
            subtasks: (task.subtasks ?? []).map((subtask) =>
              subtask.id === taskId ? normalizedTask : subtask,
            ),
          }
        : task,
    );
  }
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...normalizedTask,
          subtasks: nextTask.subtasks.length > 0 ? nextTask.subtasks : (task.subtasks ?? []),
          subtaskCount:
            nextTask.subtaskCount ??
            (nextTask.subtasks.length > 0
              ? nextTask.subtasks.length
              : (task.subtasks ?? []).length),
        }
      : task,
  );
}

export function appendSubtask(
  tasks: TaskSummaryDto[],
  parentTaskId: string,
  subtask: TaskSummaryDto,
): TaskSummaryDto[] {
  return tasks.map((task) =>
    task.id === parentTaskId
      ? {
          ...task,
          subtasks: [...(task.subtasks ?? []), { ...subtask, subtasks: [], subtaskCount: 0, isBlocked: subtask.isBlocked ?? false }],
          subtaskCount: (task.subtasks ?? []).length + 1,
        }
      : task,
  );
}
