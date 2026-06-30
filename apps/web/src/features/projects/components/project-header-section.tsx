'use client';

import { useState } from 'react';
import { FolderKanban, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectColor, ProjectDetailDto } from '@pm/contracts';
import {
  PROJECT_COLOR_OPTIONS,
  getProjectColorSwatchClassName,
} from '@/features/projects/lib/project-color';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { ApiError, updateProject } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProjectHeaderSectionProps = {
  project: ProjectDetailDto;
  onUpdated: (project: ProjectDetailDto) => void;
};

export function ProjectHeaderSection({
  project,
  onUpdated,
}: ProjectHeaderSectionProps) {
  const { user } = useAuthStore();
  const canEdit = canEditProject(project, user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [color, setColor] = useState<ProjectColor | null>(project.color);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel(): void {
    setName(project.name);
    setDescription(project.description ?? '');
    setColor(project.color);
    setError(null);
    setIsEditing(false);
  }

  async function handleSave(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updatedProject = await updateProject(project.id, {
        name: trimmedName,
        description: description.trim() || null,
        color,
      });
      onUpdated(updatedProject);
      setIsEditing(false);
      toast.success('Proyecto actualizado');
    } catch (saveError) {
      const message =
        saveError instanceof ApiError
          ? saveError.message
          : 'No se pudo actualizar el proyecto';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="project-edit-name" className="text-sm font-medium">
            Nombre del proyecto
          </label>
          <Input
            id="project-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="project-edit-description" className="text-sm font-medium">
            Descripción
            <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="project-edit-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Añade una descripción breve"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Color</span>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={color === option.value}
                onClick={() => setColor(option.value)}
                className={cn(
                  'size-8 rounded-md border-2 transition-transform hover:scale-105',
                  option.swatchClassName,
                  color === option.value
                    ? 'border-foreground ring-2 ring-ring/40'
                    : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={isSaving || name.trim().length < 2}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-white',
            getProjectColorSwatchClassName(project.color),
          )}
        >
          <FolderKanban className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            {project.status === 'archived' ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                Archivado
              </span>
            ) : null}
          </div>
          {project.description?.trim() ? (
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
      </div>
      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setName(project.name);
            setDescription(project.description ?? '');
            setColor(project.color);
            setIsEditing(true);
          }}
        >
          <Pencil className="size-3.5 text-brand-indigo" />
          Editar
        </Button>
      ) : null}
    </div>
  );
}
