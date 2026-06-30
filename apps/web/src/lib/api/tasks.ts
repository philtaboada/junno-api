import type {
  AddTaskMembershipRequestDto,
  CreateTaskDependencyRequestDto,
  CreateTaskRequestDto,
  MyTasksDto,
  ProjectTasksDto,
  ReorderTasksRequestDto,
  TaskDependenciesDto,
  TaskDetailDto,
  UpdateListColumnsRequestDto,
  UpdateTaskRequestDto,
} from '@pm/contracts';
import { apiRequest, ApiError } from '@/lib/api/client';

export async function fetchProjectTasks(
  projectId: string,
): Promise<ProjectTasksDto> {
  return apiRequest<ProjectTasksDto>(`/projects/${projectId}/tasks`, {
    method: 'GET',
  });
}

export async function createProjectTask(
  projectId: string,
  input: CreateTaskRequestDto,
): Promise<TaskDetailDto> {
  return apiRequest<TaskDetailDto>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: input,
  });
}

export async function reorderProjectTasks(
  projectId: string,
  input: ReorderTasksRequestDto,
): Promise<ProjectTasksDto> {
  return apiRequest<ProjectTasksDto>(`/projects/${projectId}/tasks/reorder`, {
    method: 'PATCH',
    body: input,
  });
}

export async function updateMyTasksListColumns(
  input: UpdateListColumnsRequestDto,
): Promise<MyTasksDto> {
  return apiRequest<MyTasksDto>('/tasks/my/list-columns', {
    method: 'PATCH',
    body: input,
  });
}

export async function fetchMyTasks(): Promise<MyTasksDto> {
  return apiRequest<MyTasksDto>('/tasks/my', {
    method: 'GET',
  });
}

export async function fetchTask(taskId: string): Promise<TaskDetailDto> {
  return apiRequest<TaskDetailDto>(`/tasks/${taskId}`, {
    method: 'GET',
  });
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskRequestDto,
): Promise<TaskDetailDto> {
  return apiRequest<TaskDetailDto>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function addTaskMembership(
  taskId: string,
  input: AddTaskMembershipRequestDto,
): Promise<TaskDetailDto> {
  return apiRequest<TaskDetailDto>(`/tasks/${taskId}/memberships`, {
    method: 'POST',
    body: input,
  });
}

export async function removeTaskMembership(
  taskId: string,
  projectId: string,
): Promise<TaskDetailDto> {
  return apiRequest<TaskDetailDto>(`/tasks/${taskId}/memberships/${projectId}`, {
    method: 'DELETE',
  });
}

export async function createTaskDependency(
  taskId: string,
  input: CreateTaskDependencyRequestDto,
): Promise<TaskDependenciesDto> {
  return apiRequest<TaskDependenciesDto>(`/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: input,
  });
}

export async function removeTaskDependency(
  taskId: string,
  dependencyId: string,
): Promise<TaskDependenciesDto> {
  return apiRequest<TaskDependenciesDto>(
    `/tasks/${taskId}/dependencies/${dependencyId}`,
    { method: 'DELETE' },
  );
}

export { ApiError };
