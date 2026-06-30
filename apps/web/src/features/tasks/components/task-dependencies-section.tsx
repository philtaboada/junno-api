'use client';

import { useMemo, useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type {
  TaskDependenciesDto,
  TaskDependencyItemDto,
  TaskDependencyRelation,
  TaskDetailDto,
} from '@pm/contracts';
import { fetchProjectTasks } from '@/lib/api/tasks';
import {
  ApiError as TasksApiError,
  createTaskDependency,
  removeTaskDependency,
} from '@/lib/api/tasks';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type TaskDependenciesSectionProps = {
  task: TaskDetailDto;
  canEdit: boolean;
  onDependenciesChange: (dependencies: TaskDependenciesDto) => void;
};

type DependencyGroupProps = {
  label: string;
  items: TaskDependencyItemDto[];
  canEdit: boolean;
  isSaving: boolean;
  onRemove: (dependencyId: string) => void;
};

function DependencyGroup({
  label,
  items,
  canEdit,
  isSaving,
  onRemove,
}: DependencyGroupProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5"
        >
          <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm',
                item.task.completedAt !== null &&
                  'text-muted-foreground line-through',
              )}
            >
              {item.task.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {item.task.projectName}
            </p>
          </div>
          {canEdit ? (
            <button
              type="button"
              disabled={isSaving}
              className="rounded-sm text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Quitar dependencia con ${item.task.name}`}
              onClick={() => onRemove(item.id)}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TaskDependenciesSection({
  task,
  canEdit,
  onDependenciesChange,
}: TaskDependenciesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [relation, setRelation] = useState<TaskDependencyRelation>('blocked_by');
  const linkedTaskIds = useMemo(() => {
    const ids = new Set<string>([task.id]);
    for (const item of task.dependencies.blockedBy) {
      ids.add(item.task.id);
    }
    for (const item of task.dependencies.blocking) {
      ids.add(item.task.id);
    }
    return ids;
  }, [task]);
  const {
    data: projectTasks,
    isLoading,
    reload: reloadProjectTasks,
  } = useAsyncResource(
    [isOpen ? task.projectId : 'closed'],
    () => fetchProjectTasks(task.projectId),
    () => 'No se pudieron cargar las tareas',
    { enabled: isOpen },
  );
  const availableTasks = useMemo(() => {
    const tasks = projectTasks?.tasks ?? [];
    return tasks.filter((candidate) => !linkedTaskIds.has(candidate.id));
  }, [projectTasks, linkedTaskIds]);

  async function handleAddDependency(relatedTaskId: string): Promise<void> {
    setIsSaving(true);
    try {
      const updated = await createTaskDependency(task.id, {
        relatedTaskId,
        relation,
      });
      onDependenciesChange(updated);
      setIsOpen(false);
      toast.success('Dependencia añadida');
    } catch (error) {
      const message =
        error instanceof TasksApiError
          ? error.message
          : 'No se pudo añadir la dependencia';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveDependency(dependencyId: string): Promise<void> {
    setIsSaving(true);
    try {
      const updated = await removeTaskDependency(task.id, dependencyId);
      onDependenciesChange(updated);
      toast.success('Dependencia eliminada');
    } catch (error) {
      const message =
        error instanceof TasksApiError
          ? error.message
          : 'No se pudo eliminar la dependencia';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  const hasDependencies =
    task.dependencies.blockedBy.length > 0 ||
    task.dependencies.blocking.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!hasDependencies ? (
        <p className="text-sm text-muted-foreground">Sin dependencias</p>
      ) : null}
      <DependencyGroup
        label="Bloqueada por"
        items={task.dependencies.blockedBy}
        canEdit={canEdit}
        isSaving={isSaving}
        onRemove={(dependencyId) => void handleRemoveDependency(dependencyId)}
      />
      <DependencyGroup
        label="Bloquea a"
        items={task.dependencies.blocking}
        canEdit={canEdit}
        isSaving={isSaving}
        onRemove={(dependencyId) => void handleRemoveDependency(dependencyId)}
      />
      {canEdit ? (
        <Popover
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              reloadProjectTasks();
            }
          }}
        >
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                className="h-7 w-fit gap-1 px-2 text-xs"
              >
                <Plus className="size-3.5" />
                Añadir dependencia
              </Button>
            }
          />
          <PopoverContent align="start" className="w-72 p-2">
            <div className="mb-2 flex gap-1 rounded-lg bg-muted/50 p-1">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-md px-2 py-1 text-xs font-medium',
                  relation === 'blocked_by'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
                onClick={() => setRelation('blocked_by')}
              >
                Bloqueada por
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-md px-2 py-1 text-xs font-medium',
                  relation === 'blocking'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
                onClick={() => setRelation('blocking')}
              >
                Bloquea a
              </button>
            </div>
            {isLoading ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Cargando…</p>
            ) : availableTasks.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No hay más tareas en {task.projectName}.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {availableTasks.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    disabled={isSaving}
                    className={cn(
                      'flex w-full flex-col rounded-md px-2 py-2 text-left',
                      'hover:bg-muted/60',
                    )}
                    onClick={() => void handleAddDependency(candidate.id)}
                  >
                    <span className="truncate text-sm">{candidate.name}</span>
                    {candidate.completedAt ? (
                      <span className="text-xs text-muted-foreground">Completada</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
