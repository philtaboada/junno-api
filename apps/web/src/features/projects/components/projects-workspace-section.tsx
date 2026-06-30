'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ProjectSummaryDto, TeamSummaryDto } from '@pm/contracts';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { ProjectTemplatesSection } from '@/features/projects/components/project-templates-section';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { ApiError, fetchProjects } from '@/lib/api/projects';
import { fetchTeams } from '@/lib/api/teams';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectsWorkspaceSectionProps = {
  initialTeamId?: string;
  initialCreateOpen?: boolean;
};

export function ProjectsWorkspaceSection({
  initialTeamId = '',
  initialCreateOpen = false,
}: ProjectsWorkspaceSectionProps) {
  const activeWorkspace = useActiveWorkspace();
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [trackedInitialTeamId, setTrackedInitialTeamId] = useState(initialTeamId);
  const [showArchived, setShowArchived] = useState(false);
  const [teams, setTeams] = useState<TeamSummaryDto[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen);

  if (initialTeamId !== trackedInitialTeamId) {
    setTrackedInitialTeamId(initialTeamId);
    setSelectedTeamId(initialTeamId);
  }

  const {
    data: projects,
    error: loadError,
    isLoading,
    setData: setProjects,
  } = useAsyncResource(
    [selectedTeamId, showArchived, activeWorkspace?.id],
    () =>
      fetchProjects({
        teamId: selectedTeamId || undefined,
        status: showArchived ? 'all' : 'active',
      }),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar los proyectos',
  );

  useEffect(() => {
    void fetchTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [activeWorkspace?.id]);

  function handleProjectCreated(project: ProjectSummaryDto): void {
    if (selectedTeamId && project.teamId !== selectedTeamId) {
      return;
    }
    setProjects((currentProjects) =>
      [...(currentProjects ?? []), project].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }

  const selectClassName =
    'h-8 min-w-[12rem] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

  return (
    <div className="flex flex-col gap-4">
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Tus proyectos</h2>
          <div className="flex flex-wrap items-center gap-2">
            {teams.length > 0 ? (
              <select
                aria-label="Filtrar por equipo"
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value)}
                className={cn(selectClassName)}
                disabled={Boolean(initialTeamId)}
              >
                <option value="">Todos los equipos</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            ) : null}
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Mostrar archivados
            </label>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              Nuevo proyecto
            </Button>
          </div>
        </div>
        <ProjectsList
          projects={projects ?? []}
          isLoading={isLoading}
          onCreateClick={() => setIsCreateOpen(true)}
        />
      </div>
      <ProjectTemplatesSection />
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleProjectCreated}
        defaultTeamId={initialTeamId || selectedTeamId || undefined}
        lockTeamSelection={Boolean(initialTeamId)}
      />
    </div>
  );
}
