'use client';

import { TeamsWorkspaceSection } from '@/features/teams/components/teams-workspace-section';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';

export default function TeamsPage() {
  const activeWorkspace = useActiveWorkspace();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Organización</p>
        <h1 className="text-3xl font-semibold tracking-tight">Equipos</h1>
        <p className="mt-2 text-muted-foreground">
          Equipos de {activeWorkspace?.name ?? 'tu workspace'}.
        </p>
      </div>
      <TeamsWorkspaceSection />
    </div>
  );
}
