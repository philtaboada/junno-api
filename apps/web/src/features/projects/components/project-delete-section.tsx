'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetailDto } from '@pm/contracts';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { ApiError, deleteProject, updateProject } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ProjectDeleteSectionProps = {
  project: ProjectDetailDto;
  onUpdated?: (project: ProjectDetailDto) => void;
};

export function ProjectDeleteSection({
  project,
  onUpdated,
}: ProjectDeleteSectionProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const canManage = canEditProject(project, user?.id);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!canManage) {
    return null;
  }

  async function handleArchive(): Promise<void> {
    setActionError(null);
    setIsArchiving(true);
    try {
      const updatedProject = await updateProject(project.id, {
        status: project.status === 'archived' ? 'active' : 'archived',
      });
      onUpdated?.(updatedProject);
      toast.success(
        project.status === 'archived'
          ? 'Proyecto restaurado'
          : 'Proyecto archivado',
      );
      setIsArchiveDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el proyecto';
      setActionError(message);
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setActionError(null);
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success(`Proyecto "${project.name}" eliminado`);
      setIsDeleteDialogOpen(false);
      router.push('/projects');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el proyecto';
      setActionError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="rounded-xl border border-border/80 bg-card px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Archivar proyecto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.status === 'archived'
            ? 'Restaura el proyecto para que vuelva a aparecer como activo.'
            : 'Oculta el proyecto de los listados sin eliminar su contenido.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setActionError(null);
            setIsArchiveDialogOpen(true);
          }}
        >
          <Archive className="size-3.5 text-brand-indigo" />
          {project.status === 'archived' ? 'Restaurar proyecto' : 'Archivar proyecto'}
        </Button>
      </div>
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Eliminar proyecto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se eliminarán las secciones y los miembros del proyecto. Esta acción no se puede
          deshacer.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => {
            setActionError(null);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="size-3.5" />
          Eliminar proyecto
        </Button>
      </div>
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>
              {project.status === 'archived'
                ? `¿Restaurar ${project.name}?`
                : `¿Archivar ${project.name}?`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {project.status === 'archived'
              ? 'El proyecto volverá a mostrarse como activo en el workspace.'
              : 'El proyecto quedará marcado como archivado. Podrás restaurarlo después.'}
          </p>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isArchiving}
              onClick={() => setIsArchiveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isArchiving}
              onClick={() => void handleArchive()}
            >
              {isArchiving
                ? 'Guardando…'
                : project.status === 'archived'
                  ? 'Restaurar'
                  : 'Archivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>¿Eliminar {project.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El proyecto y toda su configuración se eliminarán permanentemente del workspace.
          </p>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar proyecto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
