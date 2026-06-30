'use client';

import type { PortfolioSummaryDto } from '@pm/contracts';
import { CreatePortfolioForm } from '@/features/portfolios/components/create-portfolio-form';
import { PortfoliosList } from '@/features/portfolios/components/portfolios-list';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/client';
import { fetchPortfolios } from '@/lib/api/portfolios';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PortfoliosWorkspaceSection() {
  const activeWorkspace = useActiveWorkspace();
  const {
    data: portfolios,
    error: loadError,
    isLoading,
    setData: setPortfolios,
  } = useAsyncResource(
    [activeWorkspace?.id],
    () => fetchPortfolios(),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudieron cargar los portfolios',
  );

  function handlePortfolioCreated(portfolio: PortfolioSummaryDto): void {
    setPortfolios((currentPortfolios) =>
      [portfolio, ...(currentPortfolios ?? [])].sort((left, right) =>
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
      <CreatePortfolioForm onCreated={handlePortfolioCreated} />
      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Tus portfolios</h2>
        <PortfoliosList portfolios={portfolios ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
