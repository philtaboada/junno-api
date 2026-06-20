export type TaskDependencyType = 'finish_to_start';

export type TaskDependencyRelation = 'blocked_by' | 'blocking';

export interface TaskDependencyTaskDto {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly completedAt: string | null;
}

export interface TaskDependencyItemDto {
  readonly id: string;
  readonly type: TaskDependencyType;
  readonly task: TaskDependencyTaskDto;
}

export interface TaskDependenciesDto {
  readonly blockedBy: TaskDependencyItemDto[];
  readonly blocking: TaskDependencyItemDto[];
}

export interface CreateTaskDependencyRequestDto {
  readonly relatedTaskId: string;
  readonly relation: TaskDependencyRelation;
}
