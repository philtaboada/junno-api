'use client';

import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { ApiError, fetchProjects } from '@/lib/api/projects';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { buttonVariants } from '@/components/ui/button';

type TeamProjectsSectionProps = {
  teamId: string;
  teamName: string;
};

export function TeamProjectsSection({ teamId, teamName }: TeamProjectsSectionProps) {
  const activeWorkspace = useActiveWorkspace();
  const {
    data: projects,
    error: loadError,
    isLoading,
  } = useAsyncResource(
    [teamId, activeWorkspace?.id],
    () => fetchProjects({ teamId, status: 'active' }),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar los proyectos',
  );

  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Proyectos del equipo</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {(projects ?? []).length}
          </span>
        </div>
        <Link
          href={`/projects?teamId=${teamId}&create=1`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Plus className="size-3.5 text-brand-indigo" />
          Nuevo proyecto
        </Link>
      </div>
      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : (
        <ProjectsList projects={projects ?? []} isLoading={isLoading} />
      )}
      {(projects ?? []).length === 0 && !isLoading && !loadError ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
          <FolderKanban className="size-4 shrink-0 text-brand-indigo" />
          <span>
            {teamName} aún no tiene proyectos.{' '}
            <Link
              href={`/projects?teamId=${teamId}&create=1`}
              className="font-medium text-brand-indigo hover:underline"
            >
              Crear el primero
            </Link>
            .
          </span>
        </div>
      ) : null}
    </section>
  );
}
