'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamDetailDto } from '@pm/contracts';
import { ApiError, deleteTeam } from '@/lib/api/teams';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TeamDeleteSectionProps = {
  team: TeamDetailDto;
};

export function TeamDeleteSection({ team }: TeamDeleteSectionProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteTeam(team.id);
      toast.success(`Equipo "${team.name}" eliminado`);
      setIsDialogOpen(false);
      router.push('/teams');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el equipo';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Eliminar equipo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se quitarán los miembros y las invitaciones pendientes. Esta acción no se puede
          deshacer.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => {
            setDeleteError(null);
            setIsDialogOpen(true);
          }}
        >
          <Trash2 className="size-3.5" />
          Eliminar equipo
        </Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>¿Eliminar {team.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El equipo y su configuración de acceso se eliminarán permanentemente del
            workspace.
          </p>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar equipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
