'use client';

import { useRef, useState } from 'react';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskAttachmentDto, TaskDetailDto } from '@pm/contracts';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import {
  ApiError as AttachmentsApiError,
  deleteTaskAttachment,
  downloadTaskAttachment,
  uploadTaskAttachment,
} from '@/lib/api/attachments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TaskAttachmentsSectionProps = {
  task: TaskDetailDto;
  canEdit: boolean;
  onAttachmentsChange: (attachments: TaskAttachmentDto[]) => void;
};

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachmentsSection({
  task,
  canEdit,
  onAttachmentsChange,
}: TaskAttachmentsSectionProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleUpload(files: FileList | null): Promise<void> {
    if (!files || files.length === 0 || !canEdit) {
      return;
    }
    setIsUploading(true);
    try {
      let nextAttachments = task.attachments;
      for (const file of Array.from(files)) {
        nextAttachments = await uploadTaskAttachment(task.id, file);
      }
      onAttachmentsChange(nextAttachments);
      toast.success(
        files.length === 1 ? 'Adjunto subido' : `${files.length} adjuntos subidos`,
      );
    } catch (error) {
      const message =
        error instanceof AttachmentsApiError
          ? error.message
          : 'No se pudo subir el adjunto';
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(attachment: TaskAttachmentDto): Promise<void> {
    setDeletingId(attachment.id);
    try {
      const nextAttachments = await deleteTaskAttachment(task.id, attachment.id);
      onAttachmentsChange(nextAttachments);
      toast.success('Adjunto eliminado');
    } catch (error) {
      const message =
        error instanceof AttachmentsApiError
          ? error.message
          : 'No se pudo eliminar el adjunto';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(attachment: TaskAttachmentDto): Promise<void> {
    setDownloadingId(attachment.id);
    try {
      await downloadTaskAttachment(task.id, attachment.id, attachment.fileName);
    } catch (error) {
      const message =
        error instanceof AttachmentsApiError
          ? error.message
          : 'No se pudo descargar el adjunto';
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {task.attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin adjuntos</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {task.attachments.map((attachment) => {
            const canDelete =
              canEdit && user?.name === attachment.uploadedByName;
            const isBusy =
              deletingId === attachment.id || downloadingId === attachment.id;
            return (
              <li
                key={attachment.id}
                className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/40"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.sizeBytes)} · {attachment.uploadedByName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isBusy}
                  aria-label={`Descargar ${attachment.fileName}`}
                  onClick={() => void handleDownload(attachment)}
                >
                  <Download className="size-4" />
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isBusy}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Eliminar ${attachment.fileName}`}
                    onClick={() => void handleDelete(attachment)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {canEdit ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="h-7 w-fit gap-1 px-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {isUploading ? 'Subiendo…' : 'Subir archivo'}
          </Button>
          <div
            className={cn(
              'hidden rounded-xl border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground',
              'sm:block',
            )}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              void handleUpload(event.dataTransfer.files);
            }}
          >
            Arrastra archivos aquí (máx. 10 MB)
          </div>
        </>
      ) : null}
    </div>
  );
}
