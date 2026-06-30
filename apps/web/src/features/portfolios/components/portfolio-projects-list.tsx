'use client';

import Link from 'next/link';
import type { PortfolioProjectDto } from '@pm/contracts';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { getProjectColorSwatchClassName } from '@/features/projects/lib/project-color';

type PortfolioProjectsListProps = {
  projects: PortfolioProjectDto[];
  onRemoveProject: (projectId: string) => void;
  isRemovingProjectId: string | null;
};

export function PortfolioProjectsList({
  projects,
  onRemoveProject,
  isRemovingProjectId,
}: PortfolioProjectsListProps) {
  if (projects.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Aún no hay proyectos en este portfolio. Añade uno con el selector de abajo.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/80 border-y border-border/80">
      {projects.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`size-2.5 shrink-0 rounded-full ${getProjectColorSwatchClassName(item.projectColor)}`}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{item.projectName}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {item.projectStatus}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/projects/${item.projectId}`}
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              aria-label={`Abrir ${item.projectName}`}
            >
              <ExternalLink className="size-4" />
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isRemovingProjectId === item.projectId}
              onClick={() => onRemoveProject(item.projectId)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
