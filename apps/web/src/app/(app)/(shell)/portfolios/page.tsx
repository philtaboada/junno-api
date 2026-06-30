'use client';

import { PortfoliosWorkspaceSection } from '@/features/portfolios/components/portfolios-workspace-section';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';

export default function PortfoliosPage() {
  const activeWorkspace = useActiveWorkspace();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Organización</p>
        <h1 className="text-3xl font-semibold tracking-tight">Portfolios</h1>
        <p className="mt-2 text-muted-foreground">
          Portfolios de {activeWorkspace?.name ?? 'tu workspace'}.
        </p>
      </div>
      <PortfoliosWorkspaceSection />
    </div>
  );
}
