export interface TaskAttachmentDto {
  readonly id: string;
  readonly taskId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedByName: string;
  readonly createdAt: string;
}
