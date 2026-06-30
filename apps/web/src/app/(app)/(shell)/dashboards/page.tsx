'use client';

import { DashboardWorkspaceSection } from '@/features/dashboards/components/dashboard-workspace-section';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';

export default function DashboardsPage() {
  const activeWorkspace = useActiveWorkspace();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Análisis</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Métricas de {activeWorkspace?.name ?? 'tu workspace'}.
        </p>
      </div>
      <DashboardWorkspaceSection />
    </div>
  );
}
