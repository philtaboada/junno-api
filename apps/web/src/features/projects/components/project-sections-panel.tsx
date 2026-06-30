'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetailDto, ProjectSectionDto } from '@pm/contracts';
import { canEditSections } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import {
  ApiError,
  createSection,
  deleteSection,
  reorderSections,
  updateSection,
} from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProjectSectionsPanelProps = {
  project: ProjectDetailDto;
  onUpdated: (project: ProjectDetailDto) => void;
};

type SectionRowProps = {
  section: ProjectSectionDto;
  canEdit: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (sectionId: string, name: string) => Promise<void>;
  onDelete: (sectionId: string) => Promise<void>;
  onMoveUp: (sectionId: string) => Promise<void>;
  onMoveDown: (sectionId: string) => Promise<void>;
};

function SectionRow({
  section,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveName(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      toast.error('El nombre de la sección no puede estar vacío');
      return;
    }
    if (trimmedName === section.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onRename(section.id, trimmedName);
      setIsEditing(false);
    } catch {
      setName(section.name);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/80 bg-card">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        {isEditing ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveName();
            }}
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              autoFocus
              className="h-8"
            />
            <Button type="submit" size="sm" disabled={isSaving}>
              Guardar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                setName(section.name);
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
          </form>
        ) : (
          <>
            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 truncate text-left text-sm font-semibold tracking-tight',
                canEdit && 'hover:text-brand-indigo',
              )}
              disabled={!canEdit}
              onClick={() => canEdit && setIsEditing(true)}
            >
              {section.name}
            </button>
            {canEdit ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canMoveUp}
                  onClick={() => void onMoveUp(section.id)}
                  aria-label="Mover sección arriba"
                >
                  <ChevronUp className="size-4 text-brand-indigo" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canMoveDown}
                  onClick={() => void onMoveDown(section.id)}
                  aria-label="Mover sección abajo"
                >
                  <ChevronDown className="size-4 text-brand-indigo" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canDelete}
                  onClick={() => void onDelete(section.id)}
                  aria-label="Eliminar sección"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Las tareas llegarán en la siguiente fase. Esta sección está lista para organizarlas.
      </div>
    </section>
  );
}

export function ProjectSectionsPanel({
  project,
  onUpdated,
}: ProjectSectionsPanelProps) {
  const { user } = useAuthStore();
  const canEdit = canEditSections(project, user?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const sections = [...project.sections].sort(
    (left, right) => left.position - right.position,
  );

  async function handleRename(sectionId: string, name: string): Promise<void> {
    try {
      onUpdated(await updateSection(project.id, sectionId, { name }));
      toast.success('Sección actualizada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la sección';
      toast.error(message);
      throw error;
    }
  }

  async function handleDelete(sectionId: string): Promise<void> {
    try {
      onUpdated(await deleteSection(project.id, sectionId));
      toast.success('Sección eliminada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la sección';
      toast.error(message);
    }
  }

  async function handleMove(sectionId: string, direction: 'up' | 'down'): Promise<void> {
    const currentIndex = sections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentSection = sections[currentIndex];
    const targetSection = sections[targetIndex];
    if (!currentSection || !targetSection) {
      return;
    }
    try {
      onUpdated(
        await reorderSections(project.id, {
          sections: [
            { sectionId: currentSection.id, position: targetSection.position },
            { sectionId: targetSection.id, position: currentSection.position },
          ],
        }),
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo reordenar la sección';
      toast.error(message);
    }
  }

  async function handleCreateSection(): Promise<void> {
    const trimmedName = newSectionName.trim();
    if (trimmedName.length < 1) {
      toast.error('Escribe un nombre para la sección');
      return;
    }
    setIsCreating(true);
    try {
      onUpdated(await createSection(project.id, { name: trimmedName }));
      toast.success('Sección creada');
      setNewSectionName('');
      setIsAdding(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la sección';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, index) => (
        <SectionRow
          key={section.id}
          section={section}
          canEdit={canEdit}
          canDelete={canEdit && sections.length > 1}
          canMoveUp={canEdit && index > 0}
          canMoveDown={canEdit && index < sections.length - 1}
          onRename={handleRename}
          onDelete={handleDelete}
          onMoveUp={(sectionId) => handleMove(sectionId, 'up')}
          onMoveDown={(sectionId) => handleMove(sectionId, 'down')}
        />
      ))}
      {canEdit ? (
        isAdding ? (
          <form
            className="flex flex-col gap-2 rounded-xl border border-dashed border-border/80 p-4 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateSection();
            }}
          >
            <Input
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              placeholder="Nombre de la nueva sección"
              disabled={isCreating}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando…' : 'Añadir'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => {
                  setIsAdding(false);
                  setNewSectionName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="size-4 text-brand-indigo" />
            Añadir sección
          </Button>
        )
      ) : null}
    </div>
  );
}
