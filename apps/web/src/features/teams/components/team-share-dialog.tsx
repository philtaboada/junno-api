'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Info, Link2, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';
import type {
  TeamAccessRole,
  TeamDetailDto,
  TeamNotificationPreferencesDto,
  WorkspaceMemberDto,
  WorkspaceTeamGroupDto,
} from '@pm/contracts';
import {
  TeamMemberAccessMenu,
  TeamPendingAccessMenu,
} from '@/features/teams/components/team-access-role-menu';
import { TeamInviteCombobox } from '@/features/teams/components/team-invite-combobox';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import {
  ApiError,
  addTeamMember,
  addTeamMembersFromTeam,
  fetchTeam,
  fetchTeamInvitationLink,
  fetchTeamNotificationPreferences,
  fetchTeamShareLink,
  inviteTeamMember,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamInvitationRole,
  updateTeamMemberRole,
  updateTeamNotificationPreferences,
} from '@/lib/api/teams';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type TeamShareDialogProps = {
  team: TeamDetailDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (team: TeamDetailDto) => void;
};

const DEFAULT_NOTIFICATION_PREFS: TeamNotificationPreferencesDto = {
  notifyOnInvite: true,
  notifyOnJoin: true,
};

export function TeamShareDialog({
  team,
  open,
  onOpenChange,
  onUpdated,
}: TeamShareDialogProps) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamAccessRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isTeamLinkCopied, setIsTeamLinkCopied] = useState(false);
  const [copyingInvitationId, setCopyingInvitationId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] =
    useState<TeamNotificationPreferencesDto>(DEFAULT_NOTIFICATION_PREFS);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [prefsLoadKey, setPrefsLoadKey] = useState('');

  const currentPrefsLoadKey = open ? team.id : '';
  if (currentPrefsLoadKey !== prefsLoadKey) {
    setPrefsLoadKey(currentPrefsLoadKey);
    setIsLoadingPrefs(Boolean(currentPrefsLoadKey));
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    void fetchTeamNotificationPreferences(team.id)
      .then(setNotificationPrefs)
      .catch(() => setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS))
      .finally(() => setIsLoadingPrefs(false));
  }, [open, team.id]);

  function handleOpenChange(nextOpen: boolean): void {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setInviteQuery('');
      setInviteRole('editor');
      setInviteError(null);
      setIsNotificationsOpen(false);
      setIsTeamLinkCopied(false);
    }
  }

  useEffect(() => {
    if (!isTeamLinkCopied) {
      return;
    }
    const timeoutId = window.setTimeout(() => setIsTeamLinkCopied(false), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [isTeamLinkCopied]);

  async function persistNotificationPrefs(
    nextPrefs: TeamNotificationPreferencesDto,
  ): Promise<void> {
    setNotificationPrefs(nextPrefs);
    try {
      const savedPrefs = await updateTeamNotificationPreferences(team.id, nextPrefs);
      setNotificationPrefs(savedPrefs);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudieron guardar las preferencias';
      toast.error(message);
    }
  }

  async function handleInviteByEmail(): Promise<void> {
    const email = inviteQuery.trim();
    if (!email.includes('@')) {
      setInviteError('Selecciona una persona de la lista o escribe un email válido.');
      return;
    }
    setInviteError(null);
    setIsInviting(true);
    try {
      const response = await inviteTeamMember(team.id, {
        email,
        role: inviteRole,
      });
      toast.success(response.message);
      setInviteQuery('');
      onUpdated(await fetchTeam(team.id));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo enviar la invitación';
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleSelectMember(member: WorkspaceMemberDto): Promise<void> {
    setInviteError(null);
    setIsInviting(true);
    try {
      const updatedTeam = await addTeamMember(team.id, {
        userId: member.userId,
        role: inviteRole,
      });
      toast.success(`${member.name} se añadió al equipo`);
      onUpdated(updatedTeam);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo añadir al miembro';
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleSelectTeam(sourceTeam: WorkspaceTeamGroupDto): Promise<void> {
    setInviteError(null);
    setIsInviting(true);
    try {
      const response = await addTeamMembersFromTeam(team.id, {
        sourceTeamId: sourceTeam.id,
        role: inviteRole,
      });
      toast.success(response.message);
      onUpdated(await fetchTeam(team.id));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo añadir el equipo';
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCopyTeamLink(): Promise<void> {
    setIsCopyingLink(true);
    try {
      const response = await fetchTeamShareLink(team.id);
      await navigator.clipboard.writeText(response.inviteUrl);
      setIsTeamLinkCopied(true);
      toast.success('Enlace del equipo copiado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo copiar el enlace';
      toast.error(message);
    } finally {
      setIsCopyingLink(false);
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

  async function handleMemberRoleChange(
    userId: string,
    value: TeamAccessRole,
  ): Promise<void> {
    try {
      const updatedTeam = await updateTeamMemberRole(team.id, userId, { role: value });
      onUpdated(updatedTeam);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el rol';
      toast.error(message);
    }
  }

  async function handlePendingRoleChange(
    invitationId: string,
    value: TeamAccessRole,
  ): Promise<void> {
    try {
      const updatedTeam = await updateTeamInvitationRole(team.id, invitationId, {
        role: value,
      });
      onUpdated(updatedTeam);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la invitación';
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

  const emailInvitations = team.pendingInvitations.filter(
    (invitation) => !invitation.isShareLink,
  );
  const accessCount = team.memberCount + emailInvitations.length;
  const canInviteByEmail = inviteQuery.trim().includes('@') && !isInviting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[34rem]" showCloseButton>
        <DialogHeader className="border-b border-border/70 px-6 py-4">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Compartir {team.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 px-6 py-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-foreground">Invitar por email</h3>
            <div className="flex gap-2">
              <TeamInviteCombobox
                teamId={team.id}
                inviteRole={inviteRole}
                onInviteRoleChange={setInviteRole}
                query={inviteQuery}
                onQueryChange={setInviteQuery}
                onSelectMember={(member) => void handleSelectMember(member)}
                onSelectTeam={(sourceTeam) => void handleSelectTeam(sourceTeam)}
              />
              <Button
                type="button"
                disabled={!canInviteByEmail}
                className="shrink-0 px-5"
                onClick={() => void handleInviteByEmail()}
              >
                {isInviting ? '…' : 'Invitar'}
              </Button>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox
                checked={notificationPrefs.notifyOnInvite}
                disabled={isLoadingPrefs}
                onCheckedChange={(checked) =>
                  void persistNotificationPrefs({
                    ...notificationPrefs,
                    notifyOnInvite: checked === true,
                  })
                }
                className="mt-0.5"
              />
              <span className="text-sm leading-snug text-muted-foreground">
                Notificar cuando se añadan miembros al equipo.
              </span>
            </label>
            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Configuración de acceso</h3>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-indigo-muted">
                  <Lock className="size-4 text-brand-indigo" />
                </span>
                <span className="font-medium">Privado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Solo miembros del workspace</span>
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex text-muted-foreground outline-none hover:text-foreground"
                    render={<button type="button" aria-label="Más información" />}
                  >
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-56 text-center">
                    Solo personas que ya pertenecen al workspace pueden unirse a este equipo.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground">Quién tiene acceso</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((current) => !current)}
                  className="text-xs font-medium text-brand-indigo outline-none hover:underline focus-visible:underline"
                >
                  Gestionar notificaciones
                </button>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {accessCount}
                </span>
              </div>
            </div>
            {isNotificationsOpen ? (
              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/15 px-3.5 py-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={notificationPrefs.notifyOnInvite}
                    disabled={isLoadingPrefs}
                    onCheckedChange={(checked) =>
                      void persistNotificationPrefs({
                        ...notificationPrefs,
                        notifyOnInvite: checked === true,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug text-muted-foreground">
                    Avisarme cuando invite a alguien al equipo.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={notificationPrefs.notifyOnJoin}
                    disabled={isLoadingPrefs}
                    onCheckedChange={(checked) =>
                      void persistNotificationPrefs({
                        ...notificationPrefs,
                        notifyOnJoin: checked === true,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug text-muted-foreground">
                    Avisarme cuando alguien se una con un enlace.
                  </span>
                </label>
              </div>
            ) : null}
            <div className="max-h-72 space-y-0.5 overflow-y-auto pr-0.5">
              {team.members.map((member) => (
                <AccessRow
                  key={member.userId}
                  name={member.name}
                  email={member.email}
                  initials={getUserInitials(member.name)}
                  toneClassName={getTeamAvatarTone(member.userId)}
                  trailing={
                    member.isOwner ? (
                      <span className="px-2 text-sm text-muted-foreground">
                        Admin del equipo
                      </span>
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
              ))}
              {emailInvitations.map((invitation) => (
                <AccessRow
                  key={invitation.id}
                  name={invitation.email ?? 'Invitación pendiente'}
                  email="Invitación enviada · aún no aceptada"
                  initials={
                    invitation.email
                      ? invitation.email.slice(0, 2).toUpperCase()
                      : '?'
                  }
                  toneClassName="bg-brand-indigo-muted text-brand-indigo ring-1 ring-dashed ring-border/80"
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
              ))}
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-6 py-3.5">
          <button
            type="button"
            disabled={isCopyingLink}
            onClick={() => void handleCopyTeamLink()}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all outline-none',
              'focus-visible:ring-3 focus-visible:ring-brand-indigo/30',
              'disabled:pointer-events-none disabled:opacity-50',
              isTeamLinkCopied
                ? 'border-brand-indigo/25 bg-brand-indigo-muted text-brand-indigo'
                : 'border-border/80 bg-background text-foreground hover:border-border hover:bg-muted/50',
            )}
          >
            {isCopyingLink ? (
              <>
                <span className="size-4 animate-pulse rounded-full bg-muted-foreground/30" />
                Copiando…
              </>
            ) : isTeamLinkCopied ? (
              <>
                <Check className="size-4 text-brand-indigo" />
                Enlace copiado
              </>
            ) : (
              <>
                <Link2 className="size-4 text-brand-indigo" />
                Copiar enlace del equipo
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AccessRowProps = {
  name: string;
  email: string;
  initials: string;
  toneClassName: string;
  trailing: ReactNode;
};

function AccessRow({
  name,
  email,
  initials,
  toneClassName,
  trailing,
}: AccessRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-muted/35">
      <Avatar size="sm" className="after:border-0">
        <AvatarFallback className={cn('text-xs font-medium', toneClassName)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}
