'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TeamHeaderSection } from '@/features/teams/components/team-header-section';
import { TeamProjectsSection } from '@/features/teams/components/team-projects-section';
import { TeamRolesSection } from '@/features/teams/components/team-roles-section';
import { TeamDeleteSection } from '@/features/teams/components/team-delete-section';
import { ApiError, fetchTeam } from '@/lib/api/teams';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const {
    data: team,
    error: loadError,
    isLoading,
    setData: setTeam,
  } = useAsyncResource(
    [teamId],
    () => fetchTeam(teamId),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el equipo',
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full max-w-3xl" />
      </div>
    );
  }

  if (loadError || !team) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Link href="/teams" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Volver a equipos
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? 'Equipo no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/teams"
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit px-0 text-brand-indigo hover:bg-transparent' })}
        >
          <ArrowLeft className="size-4" />
          Equipos
        </Link>
        <TeamHeaderSection team={team} onUpdated={setTeam} />
      </div>
      <Separator />
      <TeamProjectsSection teamId={team.id} teamName={team.name} />
      <Separator />
      <TeamRolesSection team={team} onUpdated={setTeam} />
      <TeamDeleteSection team={team} />
    </div>
  );
}
