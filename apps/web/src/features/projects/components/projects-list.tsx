'use client';

import Link from 'next/link';
import type { ProjectSummaryDto } from '@pm/contracts';
import { ChevronRight, FolderKanban, Layers, Plus, Users } from 'lucide-react';
import { getProjectColorSwatchClassName } from '@/features/projects/lib/project-color';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectsListProps = {
  projects: ProjectSummaryDto[];
  isLoading: boolean;
  onCreateClick?: () => void;
};

export function ProjectsList({
  projects,
  isLoading,
  onCreateClick,
}: ProjectsListProps) {
  if (isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">Cargando proyectos…</p>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border/80 px-6 py-10">
        <div className="flex items-center gap-3 text-muted-foreground">
          <FolderKanban className="size-5 shrink-0 text-brand-indigo" />
          <p className="text-sm">
            Aún no hay proyectos en este workspace.
          </p>
        </div>
        {onCreateClick ? (
          <Button type="button" size="sm" className="gap-1.5" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Crear primer proyecto
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/80 border-y border-border/80">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md text-white',
                getProjectColorSwatchClassName(project.color),
              )}
            >
              <FolderKanban className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{project.name}</p>
                {project.status === 'archived' ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Archivado
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {project.teamName}
                {project.description?.trim()
                  ? ` · ${project.description.trim()}`
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-brand-indigo" />
              {project.memberCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-4 text-brand-indigo" />
              {project.sectionCount}
            </span>
            <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  );
}
