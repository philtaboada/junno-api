'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProjectFormsSection } from '@/features/projects/components/project-forms-section';
import { ProjectIntegrationsSection } from '@/features/projects/components/project-integrations-section';
import { ProjectAutomationRulesSection } from '@/features/projects/components/project-automation-rules-section';
import { SaveProjectTemplateSection } from '@/features/projects/components/save-project-template-section';
import { ProjectDeleteSection } from '@/features/projects/components/project-delete-section';
import { ProjectHeaderSection } from '@/features/projects/components/project-header-section';
import { ProjectMembersSection } from '@/features/projects/components/project-members-section';
import { ApiError, fetchProject } from '@/lib/api/projects';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
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
        <Skeleton className="h-24 w-full max-w-3xl" />
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
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/projects/${project.id}`}
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className: 'h-auto px-0 text-brand-indigo hover:bg-transparent',
            })}
          >
            <ArrowLeft className="size-4" />
            {project.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Configuración</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Proyecto</p>
          <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
        </div>
        <ProjectHeaderSection project={project} onUpdated={setProject} />
      </div>
      <Separator />
      <ProjectMembersSection project={project} onUpdated={setProject} />
      <Separator />
      <SaveProjectTemplateSection project={project} />
      <Separator />
      <ProjectAutomationRulesSection project={project} />
      <Separator />
      <ProjectFormsSection project={project} />
      <Separator />
      <ProjectIntegrationsSection project={project} />
      <Separator />
      <ProjectDeleteSection project={project} onUpdated={setProject} />
    </div>
  );
}
