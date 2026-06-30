'use client';

import Link from 'next/link';
import type { PortfolioSummaryDto } from '@pm/contracts';
import { Briefcase, ChevronRight, Target } from 'lucide-react';

type PortfoliosListProps = {
  portfolios: PortfolioSummaryDto[];
  isLoading: boolean;
};

export function PortfoliosList({ portfolios, isLoading }: PortfoliosListProps) {
  if (isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">Cargando portfolios…</p>
    );
  }

  if (portfolios.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Aún no hay portfolios. Crea el primero con el formulario de arriba.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/80 border-y border-border/80">
      {portfolios.map((portfolio) => (
        <Link
          key={portfolio.id}
          href={`/portfolios/${portfolio.id}`}
          className="group flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/30"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{portfolio.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {portfolio.description?.trim() || 'Sin descripción'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4 text-brand-indigo" />
              {portfolio.projectCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="size-4 text-brand-coral" />
              {portfolio.goalCount}
            </span>
            <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  );
}
