import type { TaskAttachmentDto } from '@pm/contracts';
import { apiDownloadBlob, apiRequest, apiUploadFormData, ApiError } from '@/lib/api/client';

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
): Promise<TaskAttachmentDto[]> {
  const formData = new FormData();
  formData.append('file', file);
  return apiUploadFormData<TaskAttachmentDto[]>(
    `/tasks/${taskId}/attachments`,
    formData,
  );
}

export async function deleteTaskAttachment(
  taskId: string,
  attachmentId: string,
): Promise<TaskAttachmentDto[]> {
  return apiRequest<TaskAttachmentDto[]>(
    `/tasks/${taskId}/attachments/${attachmentId}`,
    { method: 'DELETE' },
  );
}

export async function downloadTaskAttachment(
  taskId: string,
  attachmentId: string,
  fileName: string,
): Promise<void> {
  const blob = await apiDownloadBlob(
    `/tasks/${taskId}/attachments/${attachmentId}/file`,
  );
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export { ApiError };
