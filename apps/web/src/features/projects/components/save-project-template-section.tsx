'use client';

import { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetailDto } from '@pm/contracts';
import { canEditSections } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { createProjectTemplate } from '@/lib/api/project-templates';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SaveProjectTemplateSectionProps = {
  project: ProjectDetailDto;
};

export function SaveProjectTemplateSection({ project }: SaveProjectTemplateSectionProps) {
  const { user } = useAuthStore();
  const canSave = canEditSections(project, user?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState(`${project.name} (plantilla)`);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!canSave) {
    return null;
  }

  async function handleSave(): Promise<void> {
    if (name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setIsSaving(true);
    try {
      await createProjectTemplate({
        sourceProjectId: project.id,
        name: name.trim(),
        includeTasks,
      });
      toast.success('Plantilla guardada');
      setIsDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo guardar la plantilla';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="size-4 text-brand-indigo" />
        <h2 className="text-lg font-semibold tracking-tight">Plantilla</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Guarda secciones, campos personalizados y opcionalmente las tareas de este proyecto
        como plantilla reutilizable.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setIsDialogOpen(true)}
      >
        Guardar como plantilla
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar como plantilla</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Nombre de la plantilla</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeTasks}
                onCheckedChange={(checked) => setIncludeTasks(checked === true)}
              />
              Incluir tareas del proyecto
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
