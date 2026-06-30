'use client';

import type { TeamSummaryDto } from '@pm/contracts';
import { ApiError, fetchTeams } from '@/lib/api/teams';
import { CreateTeamForm } from '@/features/teams/components/create-team-form';
import { TeamsList } from '@/features/teams/components/teams-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { useAsyncResource } from '@/hooks/use-async-resource';

export function TeamsWorkspaceSection() {
  const activeWorkspace = useActiveWorkspace();
  const {
    data: teams,
    error: loadError,
    isLoading,
    setData: setTeams,
  } = useAsyncResource(
    [activeWorkspace?.id],
    () => fetchTeams(),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar los equipos',
  );

  function handleTeamCreated(team: TeamSummaryDto): void {
    setTeams((currentTeams) =>
      [...(currentTeams ?? []), team].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}
      <CreateTeamForm onCreated={handleTeamCreated} />
      <TeamsList teams={teams ?? []} isLoading={isLoading} />
    </div>
  );
}
