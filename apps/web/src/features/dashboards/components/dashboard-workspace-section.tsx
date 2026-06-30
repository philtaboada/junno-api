'use client';

import { useEffect, useState } from 'react';
import type { TeamSummaryDto } from '@pm/contracts';
import { AddDashboardWidgetForm } from '@/features/dashboards/components/add-dashboard-widget-form';
import { DashboardWidgetCard } from '@/features/dashboards/components/dashboard-widget-card';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/client';
import { deleteDashboardWidget, fetchDashboard } from '@/lib/api/dashboards';
import { fetchTeams } from '@/lib/api/teams';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function DashboardWorkspaceSection() {
  const activeWorkspace = useActiveWorkspace();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teams, setTeams] = useState<TeamSummaryDto[]>([]);
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null);

  const {
    data: dashboard,
    error: loadError,
    isLoading,
    setData: setDashboard,
    reload,
  } = useAsyncResource(
    [selectedTeamId, activeWorkspace?.id],
    () => fetchDashboard(selectedTeamId || undefined),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el dashboard',
  );

  useEffect(() => {
    void fetchTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [activeWorkspace?.id]);

  async function handleDeleteWidget(widgetId: string): Promise<void> {
    if (!dashboard) {
      return;
    }
    setDeletingWidgetId(widgetId);
    try {
      const updatedDashboard = await deleteDashboardWidget(dashboard.id, widgetId);
      setDashboard(updatedDashboard);
      toast.success('Widget eliminado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el widget';
      toast.error(message);
    } finally {
      setDeletingWidgetId(null);
    }
  }

  const selectClassName =
    'h-9 min-w-[14rem] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

  return (
    <div className="flex flex-col gap-6">
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Ámbito</p>
          <select
            value={selectedTeamId}
            onChange={(event) => setSelectedTeamId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Todo el workspace</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="h-9 rounded-lg border border-input px-3 text-sm hover:bg-muted/40"
        >
          Actualizar datos
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando dashboard…</p>
      ) : null}
      {dashboard ? (
        <>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{dashboard.name}</h2>
            <p className="text-sm text-muted-foreground">
              {dashboard.teamName
                ? `Métricas del equipo ${dashboard.teamName}`
                : 'Métricas de todo el workspace'}
              {' · '}
              {dashboard.widgetCount} widget{dashboard.widgetCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.widgets.map((widget) => (
              <DashboardWidgetCard
                key={widget.id}
                widget={widget}
                onDelete={(widgetId) => void handleDeleteWidget(widgetId)}
                isDeleting={deletingWidgetId === widget.id}
              />
            ))}
          </div>
          <AddDashboardWidgetForm
            dashboard={dashboard}
            teamId={selectedTeamId}
            onAdded={setDashboard}
          />
        </>
      ) : null}
    </div>
  );
}
