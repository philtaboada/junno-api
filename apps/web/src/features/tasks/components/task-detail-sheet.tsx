'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Check,
  FolderKanban,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CommentDto, CustomFieldValueDto, TaskDetailDto, TaskSummaryDto } from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { TaskAssigneePicker } from '@/features/tasks/components/task-assignee-picker';
import { TaskDetailCustomFields } from '@/features/tasks/components/task-detail-custom-fields';
import { TaskProjectsSection } from '@/features/tasks/components/task-projects-section';
import { TaskAttachmentsSection } from '@/features/tasks/components/task-attachments-section';
import { TaskDependenciesSection } from '@/features/tasks/components/task-dependencies-section';
import { TaskDueDatePicker } from '@/features/tasks/components/task-due-date-picker';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import {
  ApiError as CommentApiError,
  createTaskComment,
  fetchTaskComments,
} from '@/lib/api/comments';
import {
  ApiError,
  createProjectTask,
  deleteTask,
  fetchTask,
  updateTask,
} from '@/lib/api/tasks';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type TaskDetailSheetProps = {
  taskId: string | null;
  open: boolean;
  canEdit: boolean;
  canComment?: boolean;
  members?: AssigneePickerMember[];
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: TaskSummaryDto) => void;
  onTaskDeleted: (taskId: string) => void;
};

function toSummary(task: TaskDetailDto): TaskSummaryDto {
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

function formatCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type TaskDetailFieldRowProps = {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function TaskDetailFieldRow({ label, icon, children }: TaskDetailFieldRowProps) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-x-4 gap-y-1 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function TaskDetailSheet({
  taskId,
  open,
  canEdit,
  canComment = canEdit,
  members = [],
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailSheetProps) {
  const { user } = useAuthStore();
  const {
    data,
    error: loadError,
    isLoading,
    setData,
  } = useAsyncResource(
    [taskId],
    async () => {
      const [detail, taskComments] = await Promise.all([
        fetchTask(taskId!),
        fetchTaskComments(taskId!),
      ]);
      return { detail, comments: taskComments };
    },
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar la tarea',
    { enabled: open && Boolean(taskId) },
  );
  const task = data?.detail ?? null;
  const comments = data?.comments ?? [];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formTaskId, setFormTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  if (task && formTaskId !== task.id) {
    setFormTaskId(task.id);
    setName(task.name);
    setDescription(task.description ?? '');
  }

  function updateTaskDetail(nextTask: TaskDetailDto): void {
    setData((current) =>
      current ? { ...current, detail: nextTask } : current,
    );
  }

  function updateComments(
    updater: (currentComments: CommentDto[]) => CommentDto[],
  ): void {
    setData((current) =>
      current ? { ...current, comments: updater(current.comments) } : current,
    );
  }

  async function persistTask(
    input: Parameters<typeof updateTask>[1],
    successMessage?: string,
  ): Promise<TaskDetailDto | null> {
    if (!task || !canEdit) {
      return null;
    }
    setIsSaving(true);
    try {
      const updated = await updateTask(task.id, input);
      updateTaskDetail(updated);
      onTaskUpdated(toSummary(updated));
      if (successMessage) {
        toast.success(successMessage);
      }
      return updated;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la tarea';
      toast.error(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveName(): Promise<void> {
    if (!task || name.trim() === task.name) {
      return;
    }
    await persistTask({ name: name.trim() });
  }

  async function handleSaveDescription(): Promise<void> {
    if (!task) {
      return;
    }
    const nextDescription = description.trim().length > 0 ? description.trim() : null;
    if (nextDescription === task.description) {
      return;
    }
    await persistTask({ description: nextDescription });
  }

  async function handleToggleComplete(completed: boolean): Promise<void> {
    if (!task || !canEdit) {
      return;
    }
    try {
      const updated = await updateTask(task.id, { completed });
      updateTaskDetail(updated);
      onTaskUpdated(toSummary(updated));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la tarea';
      toast.error(message);
    }
  }

  async function handleAssigneeChange(assigneeId: string | null): Promise<void> {
    await persistTask({ assigneeId });
  }

  async function handleDateRangeChange(range: {
    startAt: string | null;
    dueAt: string | null;
  }): Promise<void> {
    await persistTask({ startAt: range.startAt, dueAt: range.dueAt });
  }

  async function handleCustomFieldChange(
    fieldId: string,
    value: CustomFieldValueDto | null,
  ): Promise<void> {
    await persistTask({
      customFieldValues: value ? { [fieldId]: value } : { [fieldId]: null },
    });
  }

  async function handleAddSubtask(): Promise<void> {
    if (!task || !canEdit || !task.sectionId) {
      return;
    }
    const trimmedName = newSubtaskName.trim();
    if (trimmedName.length < 1) {
      return;
    }
    setIsAddingSubtask(true);
    try {
      const created = await createProjectTask(task.projectId, {
        name: trimmedName,
        sectionId: task.sectionId,
        parentTaskId: task.id,
      });
      updateTaskDetail({
        ...task,
        subtaskCount: task.subtasks.length + 1,
        subtasks: [...task.subtasks, toSummary(created)],
      });
      setNewSubtaskName('');
      toast.success('Subtarea creada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la subtarea';
      toast.error(message);
    } finally {
      setIsAddingSubtask(false);
    }
  }

  async function handleToggleSubtask(
    subtask: TaskSummaryDto,
    completed: boolean,
  ): Promise<void> {
    if (!task || !canEdit) {
      return;
    }
    try {
      const updatedSubtask = await updateTask(subtask.id, { completed });
      updateTaskDetail({
        ...task,
        subtasks: task.subtasks.map((item) =>
          item.id === subtask.id ? toSummary(updatedSubtask) : item,
        ),
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la subtarea';
      toast.error(message);
    }
  }

  async function handlePostComment(): Promise<void> {
    if (!task || !canComment) {
      return;
    }
    const trimmedBody = newCommentBody.trim();
    if (trimmedBody.length < 1) {
      return;
    }
    setIsPostingComment(true);
    try {
      const created = await createTaskComment(task.id, { body: trimmedBody });
      updateComments((current) => [...current, created]);
      setNewCommentBody('');
      toast.success('Comentario publicado');
    } catch (error) {
      const message =
        error instanceof CommentApiError
          ? error.message
          : 'No se pudo publicar el comentario';
      toast.error(message);
    } finally {
      setIsPostingComment(false);
    }
  }

  async function handleDeleteTask(): Promise<void> {
    if (!task || !canEdit) {
      return;
    }
    try {
      await deleteTask(task.id);
      onTaskDeleted(task.id);
      onOpenChange(false);
      toast.success('Tarea eliminada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la tarea';
      toast.error(message);
    }
  }

  const isCompleted = task?.completedAt !== null;
  const currentUserInitials = user ? getUserInitials(user.name) : '?';
  const currentUserTone = user ? getTeamAvatarTone(user.id) : 'bg-muted text-muted-foreground';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetTitle className="sr-only">Detalle de tarea</SheetTitle>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand-indigo" />
          </div>
        ) : loadError ? (
          <div className="p-6 text-sm text-destructive">{loadError}</div>
        ) : task ? (
          <>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5 py-3 pr-14">
              <Button
                type="button"
                variant={isCompleted ? 'secondary' : 'outline'}
                size="sm"
                disabled={!canEdit || isSaving}
                className={cn(
                  !isCompleted &&
                    'border-brand-coral/40 text-foreground hover:bg-brand-coral-muted',
                )}
                onClick={() => void handleToggleComplete(!isCompleted)}
              >
                <Check className="size-4" />
                {isCompleted ? 'Completada' : 'Marcar completa'}
              </Button>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isSaving}
                  aria-label="Eliminar tarea"
                  onClick={() => void handleDeleteTask()}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </header>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="text-xs text-muted-foreground">
                  {task.projectName}
                  {task.parentTaskId ? ' / Subtarea' : ''}
                </p>
                <textarea
                  value={name}
                  rows={2}
                  disabled={!canEdit || isSaving}
                  className={cn(
                    'mt-2 w-full resize-none border-0 bg-transparent p-0 text-2xl font-semibold leading-tight tracking-tight outline-none focus:ring-0',
                    isCompleted && 'text-muted-foreground line-through',
                  )}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => {
                    void handleSaveName();
                  }}
                />
                <div className="mt-4 border-t border-border/60 pt-2">
                  <TaskDetailFieldRow
                    label="Responsable"
                    icon={<UserRound className="size-3.5 shrink-0" />}
                  >
                    {members.length > 0 ? (
                      <TaskAssigneePicker
                        assignee={task.assignee}
                        members={members}
                        canEdit={canEdit}
                        onAssigneeChange={handleAssigneeChange}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {task.assignee?.name ?? 'Sin responsable'}
                      </span>
                    )}
                  </TaskDetailFieldRow>
                  <TaskDetailFieldRow
                    label="Fechas"
                    icon={<CalendarDays className="size-3.5 shrink-0" />}
                  >
                    <TaskDueDatePicker
                      startAt={task.startAt}
                      dueAt={task.dueAt}
                      completedAt={task.completedAt}
                      canEdit={canEdit}
                      onDateRangeChange={handleDateRangeChange}
                    />
                  </TaskDetailFieldRow>
                  <TaskDetailFieldRow
                    label="Proyectos"
                    icon={<FolderKanban className="size-3.5 shrink-0" />}
                  >
                    <TaskProjectsSection
                      task={task}
                      canEdit={canEdit}
                      onTaskUpdated={(updated) => {
                        updateTaskDetail(updated);
                        onTaskUpdated(toSummary(updated));
                      }}
                    />
                  </TaskDetailFieldRow>
                  <TaskDetailFieldRow
                    label="Dependencias"
                    icon={<Link2 className="size-3.5 shrink-0" />}
                  >
                    <TaskDependenciesSection
                      task={task}
                      canEdit={canEdit}
                      onDependenciesChange={(dependencies) => {
                        updateTaskDetail({ ...task, dependencies });
                      }}
                    />
                  </TaskDetailFieldRow>
                </div>
                <section className="mt-6 border-t border-border/60 pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Adjuntos</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {task.attachments.length}
                    </span>
                  </div>
                  <TaskAttachmentsSection
                    task={task}
                    canEdit={canEdit}
                    onAttachmentsChange={(attachments) => {
                      updateTaskDetail({ ...task, attachments });
                    }}
                  />
                </section>
                {task.customFields.length > 0 ? (
                  <TaskDetailCustomFields
                    customFields={task.customFields}
                    customFieldValues={task.customFieldValues}
                    members={members}
                    canEdit={canEdit}
                    onCustomFieldChange={handleCustomFieldChange}
                  />
                ) : null}
                <section className="mt-8">
                  <h3 className="mb-2 text-sm font-medium text-foreground">Descripción</h3>
                  <textarea
                    value={description}
                    disabled={!canEdit || isSaving}
                    rows={4}
                    placeholder="¿De qué trata esta tarea?"
                    className="min-h-28 w-full resize-none rounded-xl border-0 bg-muted/25 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-indigo/30 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(event) => setDescription(event.target.value)}
                    onBlur={() => {
                      void handleSaveDescription();
                    }}
                  />
                </section>
                <section className="mt-8 border-t border-border/60 pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">Subtareas</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {task.subtasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={subtask.completedAt !== null}
                          disabled={!canEdit}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              void handleToggleSubtask(subtask, checked);
                            }
                          }}
                        />
                        <span
                          className={cn(
                            'min-w-0 flex-1 text-sm',
                            subtask.completedAt !== null &&
                              'text-muted-foreground line-through',
                          )}
                        >
                          {subtask.name}
                        </span>
                        {(subtask.subtaskCount ?? 0) > 0 ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {subtask.subtaskCount} anidadas
                          </span>
                        ) : null}
                      </div>
                    ))}
                    {canEdit ? (
                      <form
                        className="flex items-center gap-2 px-1 py-1.5"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleAddSubtask();
                        }}
                      >
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                        <input
                          type="text"
                          value={newSubtaskName}
                          disabled={isAddingSubtask}
                          placeholder="Añadir subtarea…"
                          className="h-8 w-full min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                          onChange={(event) => setNewSubtaskName(event.target.value)}
                        />
                      </form>
                    ) : null}
                  </div>
                </section>
                {comments.length > 0 ? (
                  <section className="mt-8 border-t border-border/60 pt-6">
                    <h3 className="mb-4 text-sm font-medium text-foreground">
                      Comentarios
                    </h3>
                    <div className="flex flex-col gap-4">
                      {comments.map((comment) => (
                        <article key={comment.id} className="flex gap-3">
                          <Avatar size="sm" className="size-8 shrink-0 after:border-0">
                            <AvatarFallback
                              className={cn(
                                'text-xs font-medium',
                                getTeamAvatarTone(comment.author.userId),
                              )}
                            >
                              {getUserInitials(comment.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <p className="text-sm font-medium">{comment.author.name}</p>
                              <time className="text-xs text-muted-foreground">
                                {formatCommentDate(comment.createdAt)}
                              </time>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-foreground">
                              {comment.body}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
              {canComment ? (
              <footer className="shrink-0 border-t border-border/70 bg-card px-5 py-4">
                <form
                  className="flex items-start gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handlePostComment();
                  }}
                >
                  <Avatar size="sm" className="size-8 shrink-0 after:border-0">
                    <AvatarFallback className={cn('text-xs font-medium', currentUserTone)}>
                      {currentUserInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <textarea
                      value={newCommentBody}
                      disabled={isPostingComment}
                      rows={2}
                      placeholder="Añadir un comentario…"
                      className="min-h-11 w-full resize-none rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-brand-indigo/40 focus-visible:ring-2 focus-visible:ring-brand-indigo/20 disabled:cursor-not-allowed disabled:opacity-50"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handlePostComment();
                        }
                      }}
                      onChange={(event) => setNewCommentBody(event.target.value)}
                    />
                  </div>
                </form>
              </footer>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
