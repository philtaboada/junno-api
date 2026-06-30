'use client';

import Link from 'next/link';
import type { TeamSummaryDto } from '@pm/contracts';
import { ChevronRight, Users } from 'lucide-react';

type TeamsListProps = {
  teams: TeamSummaryDto[];
  isLoading: boolean;
};

export function TeamsList({ teams, isLoading }: TeamsListProps) {
  if (isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">Cargando equipos…</p>
    );
  }

  if (teams.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Aún no hay equipos en este workspace. Crea el primero con el formulario de arriba.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/80 border-y border-border/80">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="group flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/30"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{team.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {team.description?.trim() || 'Sin descripción'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-brand-indigo" />
              {team.memberCount}
            </span>
            <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  );
}
