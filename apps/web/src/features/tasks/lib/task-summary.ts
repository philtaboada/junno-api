import type { TaskDetailDto, TaskSummaryDto } from '@pm/contracts';

export function toTaskSummary(task: TaskDetailDto): TaskSummaryDto {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    assignee: task.assignee,
    startAt: task.startAt,
    startHasTime: task.startHasTime,
    dueAt: task.dueAt,
    dueHasTime: task.dueHasTime,
    completedAt: task.completedAt,
    parentTaskId: task.parentTaskId,
    projectId: task.projectId,
    projectName: task.projectName,
    sectionId: task.sectionId,
    position: task.position,
    createdAt: task.createdAt,
    customFieldValues: task.customFieldValues ?? {},
    subtaskCount: task.subtaskCount ?? task.subtasks.length,
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      subtasks: [],
      subtaskCount: subtask.subtaskCount ?? 0,
      isBlocked: subtask.isBlocked ?? false,
    })),
    isBlocked: task.isBlocked ?? false,
  };
}
