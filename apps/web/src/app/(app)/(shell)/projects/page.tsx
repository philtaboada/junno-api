'use client';

import { useSearchParams } from 'next/navigation';
import { ProjectsWorkspaceSection } from '@/features/projects/components/projects-workspace-section';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';

export default function ProjectsPage() {
  const activeWorkspace = useActiveWorkspace();
  const searchParams = useSearchParams();
  const initialTeamId = searchParams.get('teamId') ?? '';
  const initialCreateOpen = searchParams.get('create') === '1';

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Organización</p>
        <h1 className="text-3xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-2 text-muted-foreground">
          Proyectos de {activeWorkspace?.name ?? 'tu workspace'}.
        </p>
      </div>
      <ProjectsWorkspaceSection
        initialTeamId={initialTeamId}
        initialCreateOpen={initialCreateOpen}
      />
    </div>
  );
}
