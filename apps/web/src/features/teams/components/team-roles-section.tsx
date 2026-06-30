'use client';

import { useState, type ReactNode } from 'react';
import { Plus, Share2, UserPlus } from 'lucide-react';
import type { TeamAccessRole, TeamDetailDto } from '@pm/contracts';
import { TeamShareDialog } from '@/features/teams/components/team-share-dialog';
import {
  TeamMemberAccessMenu,
  TeamPendingAccessMenu,
} from '@/features/teams/components/team-access-role-menu';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import {
  ApiError,
  fetchTeamInvitationLink,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamInvitationRole,
  updateTeamMemberRole,
} from '@/lib/api/teams';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TeamRolesSectionProps = {
  team: TeamDetailDto;
  onUpdated: (team: TeamDetailDto) => void;
};

export function TeamRolesSection({ team, onUpdated }: TeamRolesSectionProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copyingInvitationId, setCopyingInvitationId] = useState<string | null>(null);

  const emailInvitations = team.pendingInvitations.filter(
    (invitation) => !invitation.isShareLink,
  );
  const totalCount = team.memberCount + emailInvitations.length;

  async function handleMemberRoleChange(
    userId: string,
    role: TeamAccessRole,
  ): Promise<void> {
    try {
      onUpdated(await updateTeamMemberRole(team.id, userId, { role }));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el rol';
      toast.error(message);
    }
  }

  async function handleRemoveMember(userId: string): Promise<void> {
    try {
      const updatedTeam = await removeTeamMember(team.id, userId);
      toast.success('Miembro eliminado del equipo');
      onUpdated(updatedTeam);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar al miembro';
      toast.error(message);
    }
  }

  async function handlePendingRoleChange(
    invitationId: string,
    role: TeamAccessRole,
  ): Promise<void> {
    try {
      onUpdated(await updateTeamInvitationRole(team.id, invitationId, { role }));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la invitación';
      toast.error(message);
    }
  }

  async function handleCopyInvitationLink(invitationId: string): Promise<void> {
    setCopyingInvitationId(invitationId);
    try {
      const response = await fetchTeamInvitationLink(team.id, invitationId);
      await navigator.clipboard.writeText(response.inviteUrl);
      toast.success('Enlace de invitación copiado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo copiar el enlace';
      toast.error(message);
    } finally {
      setCopyingInvitationId(null);
    }
  }

  async function handleRevokeInvitation(invitationId: string): Promise<void> {
    try {
      const updatedTeam = await revokeTeamInvitation(team.id, invitationId);
      toast.success('Invitación cancelada');
      onUpdated(updatedTeam);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo cancelar la invitación';
      toast.error(message);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Miembros del equipo</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {totalCount}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
          <Share2 className="size-3.5 text-brand-indigo" />
          Compartir
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="flex w-full items-center gap-2.5 border-b border-border/70 px-3 py-2.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
            <Plus className="size-3.5" />
          </span>
          <span className="font-medium text-foreground">Añadir miembro</span>
          <UserPlus className="ml-auto size-3.5 text-brand-indigo" />
        </button>
        <ul className="divide-y divide-border/60">
          {team.members.map((member) => (
            <li key={member.userId}>
              <MemberRow
                name={member.name}
                subtitle={member.email}
                initials={getUserInitials(member.name)}
                toneClassName={getTeamAvatarTone(member.userId)}
                trailing={
                  member.isOwner ? (
                    <span className="text-xs text-muted-foreground">Creador</span>
                  ) : (
                    <TeamMemberAccessMenu
                      value={member.role}
                      onRoleChange={(role) => void handleMemberRoleChange(member.userId, role)}
                      onRemove={() => void handleRemoveMember(member.userId)}
                      canRemove={team.memberCount > 1}
                    />
                  )
                }
              />
            </li>
          ))}
          {emailInvitations.map((invitation) => (
            <li key={invitation.id}>
              <MemberRow
                name={invitation.email ?? 'Invitación pendiente'}
                subtitle="Invitación pendiente"
                initials={
                  invitation.email
                    ? invitation.email.slice(0, 2).toUpperCase()
                    : '?'
                }
                toneClassName="bg-brand-indigo-muted text-brand-indigo ring-1 ring-dashed ring-border/70"
                trailing={
                  <TeamPendingAccessMenu
                    role={invitation.role}
                    isCopying={copyingInvitationId === invitation.id}
                    onRoleChange={(role) =>
                      void handlePendingRoleChange(invitation.id, role)
                    }
                    onCopyLink={() => void handleCopyInvitationLink(invitation.id)}
                    onRemove={() => void handleRevokeInvitation(invitation.id)}
                  />
                }
              />
            </li>
          ))}
        </ul>
      </div>
      <TeamShareDialog
        team={team}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        onUpdated={onUpdated}
      />
    </section>
  );
}

type MemberRowProps = {
  name: string;
  subtitle: string;
  initials: string;
  toneClassName: string;
  trailing: ReactNode;
};

function MemberRow({
  name,
  subtitle,
  initials,
  toneClassName,
  trailing,
}: MemberRowProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <Avatar size="sm" className="size-8 after:border-0">
        <AvatarFallback className={cn('text-[11px] font-medium', toneClassName)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}
