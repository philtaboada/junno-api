import type { CommentDto, CreateCommentRequestDto } from '@pm/contracts';
import { apiRequest, ApiError } from '@/lib/api/client';

export async function fetchTaskComments(taskId: string): Promise<CommentDto[]> {
  return apiRequest<CommentDto[]>(`/tasks/${taskId}/comments`, {
    method: 'GET',
  });
}

export async function createTaskComment(
  taskId: string,
  input: CreateCommentRequestDto,
): Promise<CommentDto> {
  return apiRequest<CommentDto>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: input,
  });
}

export { ApiError };
