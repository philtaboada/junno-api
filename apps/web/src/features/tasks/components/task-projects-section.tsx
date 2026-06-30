'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectSummaryDto, TaskDetailDto, TaskMembershipDto } from '@pm/contracts';
import { fetchProjects } from '@/lib/api/projects';
import {
  addTaskMembership,
  ApiError as TasksApiError,
  removeTaskMembership,
} from '@/lib/api/tasks';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type TaskProjectsSectionProps = {
  task: TaskDetailDto;
  canEdit: boolean;
  onTaskUpdated: (task: TaskDetailDto) => void;
};

export function TaskProjectsSection({
  task,
  canEdit,
  onTaskUpdated,
}: TaskProjectsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {
    data: projects,
    isLoading,
    reload: reloadProjects,
  } = useAsyncResource(
    [isOpen ? 'open' : 'closed'],
    () => fetchProjects({ status: 'active' }),
    () => 'No se pudieron cargar los proyectos',
    { enabled: isOpen },
  );
  const existingProjectIds = useMemo(
    () => new Set(task.memberships.map((membership) => membership.projectId)),
    [task.memberships],
  );
  const availableProjects = useMemo(
    () =>
      (projects ?? []).filter((project) => !existingProjectIds.has(project.id)),
    [projects, existingProjectIds],
  );

  async function handleAddProject(project: ProjectSummaryDto): Promise<void> {
    setIsSaving(true);
    try {
      const updated = await addTaskMembership(task.id, { projectId: project.id });
      onTaskUpdated(updated);
      setIsOpen(false);
      toast.success(`Añadida a ${project.name}`);
    } catch (error) {
      const message =
        error instanceof TasksApiError ? error.message : 'No se pudo añadir al proyecto';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveProject(membership: TaskMembershipDto): Promise<void> {
    if (task.memberships.length <= 1) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await removeTaskMembership(task.id, membership.projectId);
      onTaskUpdated(updated);
      toast.success(`Quitada de ${membership.projectName}`);
    } catch (error) {
      const message =
        error instanceof TasksApiError ? error.message : 'No se pudo quitar del proyecto';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {task.memberships.map((membership) => (
        <span
          key={membership.id}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-sm"
        >
          <span className="size-2 shrink-0 rounded-sm bg-brand-indigo" />
          <span className="truncate">{membership.projectName}</span>
          {canEdit && task.memberships.length > 1 ? (
            <button
              type="button"
              disabled={isSaving}
              className="rounded-sm text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Quitar de ${membership.projectName}`}
              onClick={() => void handleRemoveProject(membership)}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      {canEdit ? (
        <Popover
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              reloadProjects();
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
                className="h-7 gap-1 px-2 text-xs"
              >
                <Plus className="size-3.5" />
                Añadir a proyecto
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64 p-2">
            {isLoading ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Cargando…</p>
            ) : availableProjects.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No hay más proyectos disponibles.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {availableProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    disabled={isSaving}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                      'hover:bg-muted/60',
                    )}
                    onClick={() => void handleAddProject(project)}
                  >
                    <span className="size-2 shrink-0 rounded-sm bg-brand-indigo" />
                    <span className="truncate">{project.name}</span>
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
