'use client';

import type { ProjectSummaryDto } from '@pm/contracts';
import { CreateProjectForm } from '@/features/projects/components/create-project-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: ProjectSummaryDto) => void;
  defaultTeamId?: string;
  lockTeamSelection?: boolean;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
  defaultTeamId,
  lockTeamSelection = false,
}: CreateProjectDialogProps) {
  function handleCreated(project: ProjectSummaryDto): void {
    onCreated(project);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Los proyectos viven dentro de un equipo.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <CreateProjectForm
            compact
            onCreated={handleCreated}
            defaultTeamId={defaultTeamId}
            lockTeamSelection={lockTeamSelection}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
