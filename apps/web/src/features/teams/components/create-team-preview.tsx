'use client';

import { Users } from 'lucide-react';
import type { AuthUserDto } from '@pm/contracts';
import type { DraftTeamMember } from '@/features/teams/components/create-team-member-picker';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type CreateTeamPreviewProps = {
  teamName: string;
  currentUser: AuthUserDto;
  draftMembers: DraftTeamMember[];
};

type PreviewMember = {
  id: string;
  label: string;
  initials: string;
  toneClassName: string;
};

const PLACEHOLDER_COUNT = 7;

export function CreateTeamPreview({
  teamName,
  currentUser,
  draftMembers,
}: CreateTeamPreviewProps) {
  const previewMembers: PreviewMember[] = [
    {
      id: currentUser.id,
      label: currentUser.name,
      initials: getUserInitials(currentUser.name),
      toneClassName: getTeamAvatarTone(currentUser.id),
    },
    ...draftMembers.map((member) => {
      if (member.kind === 'user') {
        return {
          id: member.id,
          label: member.name,
          initials: getUserInitials(member.name),
          toneClassName: getTeamAvatarTone(member.userId),
        };
      }
      return {
        id: member.id,
        label: member.email,
        initials: member.email.slice(0, 2).toUpperCase(),
        toneClassName: 'bg-brand-indigo-muted text-brand-indigo',
      };
    }),
  ];
  const displayName = teamName.trim() || 'Nombre del equipo';

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-indigo-muted text-brand-indigo">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">{displayName}</p>
            <p className="text-xs text-muted-foreground">Vista previa del equipo</p>
          </div>
        </div>
      </div>
      <div className="space-y-6 px-5 py-5">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Miembros</h3>
          <div className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4">
            {previewMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-2 text-center">
                <Avatar size="lg" className="size-10 after:border-0">
                  <AvatarFallback
                    className={cn('text-xs font-medium', member.toneClassName)}
                  >
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <p className="line-clamp-2 w-full text-xs leading-tight text-muted-foreground">
                  {member.label}
                </p>
              </div>
            ))}
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="size-10 rounded-full border-2 border-dashed border-muted-foreground/25" />
                <span className="h-3 w-12 rounded bg-muted/50" />
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-muted-foreground">
            Proyectos
          </h3>
          <p className="rounded-lg border border-border/60 px-3 py-2.5 text-sm text-muted-foreground">
            Tras crear el equipo podrás añadir proyectos desde la página del equipo o
            desde Proyectos.
          </p>
        </section>
      </div>
    </div>
  );
}
