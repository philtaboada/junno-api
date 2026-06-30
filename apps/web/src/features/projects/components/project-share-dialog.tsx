'use client';

import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import type {
  ProjectAccessRole,
  ProjectDetailDto,
  WorkspaceMemberDto,
  WorkspaceTeamGroupDto,
} from '@pm/contracts';
import { ProjectInviteCombobox } from '@/features/projects/components/project-invite-combobox';
import { ProjectMemberAccessMenu } from '@/features/projects/components/project-access-role-menu';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import {
  ApiError,
  addProjectMember,
  addProjectMembersFromTeam,
  fetchProject,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/lib/api/projects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ProjectShareDialogProps = {
  project: ProjectDetailDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (project: ProjectDetailDto) => void;
};

export function ProjectShareDialog({
  project,
  open,
  onOpenChange,
  onUpdated,
}: ProjectShareDialogProps) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectAccessRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  function handleOpenChange(nextOpen: boolean): void {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setInviteQuery('');
      setInviteRole('editor');
      setInviteError(null);
    }
  }

  async function handleSelectMember(member: WorkspaceMemberDto): Promise<void> {
    setInviteError(null);
    setIsInviting(true);
    try {
      const updatedProject = await addProjectMember(project.id, {
        userId: member.userId,
        role: inviteRole,
      });
      toast.success(`${member.name} se añadió al proyecto`);
      onUpdated(updatedProject);
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
      const response = await addProjectMembersFromTeam(project.id, {
        sourceTeamId: sourceTeam.id,
        role: inviteRole,
      });
      toast.success(response.message);
      onUpdated(await fetchProject(project.id));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo añadir el equipo';
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleMemberRoleChange(
    userId: string,
    role: ProjectAccessRole,
  ): Promise<void> {
    try {
      onUpdated(await updateProjectMemberRole(project.id, userId, { role }));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el rol';
      toast.error(message);
    }
  }

  async function handleRemoveMember(userId: string): Promise<void> {
    try {
      const updatedProject = await removeProjectMember(project.id, userId);
      toast.success('Miembro eliminado del proyecto');
      onUpdated(updatedProject);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar al miembro';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>Compartir {project.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-col gap-2">
            <ProjectInviteCombobox
              projectId={project.id}
              inviteRole={inviteRole}
              onInviteRoleChange={setInviteRole}
              query={inviteQuery}
              onQueryChange={setInviteQuery}
              onSelectMember={handleSelectMember}
              onSelectTeam={handleSelectTeam}
            />
            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}
            {isInviting ? (
              <p className="text-sm text-muted-foreground">Añadiendo miembro…</p>
            ) : null}
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
            <p>
              Solo miembros del workspace pueden añadirse al proyecto. Las invitaciones por
              email llegarán en una fase posterior.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80">
            <ul className="divide-y divide-border/60">
              {project.members.map((member) => (
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
                        <ProjectMemberAccessMenu
                          value={member.role}
                          onRoleChange={(role) =>
                            void handleMemberRoleChange(member.userId, role)
                          }
                          onRemove={() => void handleRemoveMember(member.userId)}
                          canRemove={project.memberCount > 1}
                        />
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/70 px-5 py-3">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
