'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { ProjectHeaderSection } from '@/features/projects/components/project-header-section';
import {
  ProjectViewTabs,
  type ProjectViewMode,
} from '@/features/projects/components/project-view-tabs';
import { ProjectTasksWorkspace } from '@/features/tasks/components/project-tasks-workspace';
import { ApiError, fetchProject } from '@/lib/api/projects';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [activeView, setActiveView] = useState<ProjectViewMode>('list');
  const {
    data: project,
    error: loadError,
    isLoading,
    setData: setProject,
  } = useAsyncResource(
    [projectId],
    () => fetchProject(projectId),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el proyecto',
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full max-w-3xl" />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Link
          href="/projects"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ArrowLeft className="size-4" />
          Volver a proyectos
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? 'Proyecto no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/projects"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'h-auto px-0 text-brand-indigo hover:bg-transparent',
              })}
            >
              <ArrowLeft className="size-4" />
              Proyectos
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href={`/teams/${project.teamId}`}
              className="font-medium text-brand-indigo hover:underline"
            >
              {project.teamName}
            </Link>
          </div>
          <Link
            href={`/projects/${project.id}/settings`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Settings className="size-3.5 text-brand-indigo" />
            Configuración
          </Link>
        </div>
        <ProjectHeaderSection project={project} onUpdated={setProject} />
      </div>
      <ProjectViewTabs activeView={activeView} onViewChange={setActiveView} />
      <ProjectTasksWorkspace
        project={project}
        activeView={activeView}
        onProjectUpdated={setProject}
      />
    </div>
  );
}
