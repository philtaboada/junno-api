'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { PortfolioDetailDto } from '@pm/contracts';
import { AddPortfolioProjectForm } from '@/features/portfolios/components/add-portfolio-project-form';
import { CreatePortfolioGoalForm } from '@/features/portfolios/components/create-portfolio-goal-form';
import { PortfolioGoalsList } from '@/features/portfolios/components/portfolio-goals-list';
import { PortfolioProjectsList } from '@/features/portfolios/components/portfolio-projects-list';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/client';
import {
  addPortfolioProject,
  deleteGoal,
  fetchPortfolio,
  removePortfolioProject,
} from '@/lib/api/portfolios';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';

type PortfolioDetailSectionProps = {
  portfolioId: string;
};

export function PortfolioDetailSection({ portfolioId }: PortfolioDetailSectionProps) {
  const activeWorkspace = useActiveWorkspace();
  const [isRemovingProjectId, setIsRemovingProjectId] = useState<string | null>(null);
  const [isDeletingGoalId, setIsDeletingGoalId] = useState<string | null>(null);
  const {
    data: portfolio,
    error: loadError,
    isLoading,
    setData: setPortfolio,
  } = useAsyncResource(
    [portfolioId, activeWorkspace?.id],
    () => fetchPortfolio(portfolioId),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el portfolio',
  );
  const projectIds = useMemo(
    () => portfolio?.projects.map((item) => item.projectId) ?? [],
    [portfolio?.projects],
  );

  const portfolioProjectOptions = useMemo(
    () =>
      portfolio?.projects.map((item) => ({
        projectId: item.projectId,
        projectName: item.projectName,
      })) ?? [],
    [portfolio?.projects],
  );

  async function handleAddProject(projectId: string): Promise<void> {
    const updatedPortfolio = await addPortfolioProject(portfolioId, { projectId });
    setPortfolio(updatedPortfolio);
  }

  async function handleRemoveProject(projectId: string): Promise<void> {
    setIsRemovingProjectId(projectId);
    try {
      const updatedPortfolio = await removePortfolioProject(portfolioId, projectId);
      setPortfolio(updatedPortfolio);
      toast.success('Proyecto eliminado del portfolio');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el proyecto';
      toast.error(message);
    } finally {
      setIsRemovingProjectId(null);
    }
  }

  async function handleDeleteGoal(goalId: string): Promise<void> {
    setIsDeletingGoalId(goalId);
    try {
      await deleteGoal(goalId);
      setPortfolio((currentPortfolio) => {
        if (!currentPortfolio) {
          return currentPortfolio;
        }
        return {
          ...currentPortfolio,
          goals: currentPortfolio.goals.filter((goal) => goal.id !== goalId),
          goalCount: Math.max(0, currentPortfolio.goalCount - 1),
        };
      });
      toast.success('Goal eliminado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el goal';
      toast.error(message);
    } finally {
      setIsDeletingGoalId(null);
    }
  }

  function handleGoalCreated(goal: PortfolioDetailDto['goals'][number]): void {
    setPortfolio((currentPortfolio) => {
      if (!currentPortfolio) {
        return currentPortfolio;
      }
      return {
        ...currentPortfolio,
        goals: [goal, ...currentPortfolio.goals],
        goalCount: currentPortfolio.goalCount + 1,
      };
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando portfolio…</p>;
  }

  if (loadError || !portfolio) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{loadError ?? 'Portfolio no encontrado'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link
          href="/portfolios"
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          aria-label="Volver a portfolios"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{portfolio.name}</h1>
          {portfolio.description ? (
            <p className="mt-1 text-muted-foreground">{portfolio.description}</p>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Proyectos</h2>
          <p className="text-sm text-muted-foreground">
            {portfolio.projectCount} proyecto{portfolio.projectCount === 1 ? '' : 's'} en este portfolio.
          </p>
        </div>
        <PortfolioProjectsList
          projects={portfolio.projects}
          onRemoveProject={(projectId) => void handleRemoveProject(projectId)}
          isRemovingProjectId={isRemovingProjectId}
        />
        <AddPortfolioProjectForm
          existingProjectIds={projectIds}
          onAddProject={handleAddProject}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-muted-foreground">
            Métricas agregadas sobre los proyectos del portfolio.
          </p>
        </div>
        <CreatePortfolioGoalForm
          portfolioId={portfolioId}
          portfolioProjects={portfolioProjectOptions}
          onCreated={handleGoalCreated}
        />
        <PortfolioGoalsList
          goals={portfolio.goals}
          onDeleteGoal={(goalId) => void handleDeleteGoal(goalId)}
          isDeletingGoalId={isDeletingGoalId}
        />
      </section>
    </div>
  );
}
