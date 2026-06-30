'use client';

import { useState, type ReactNode } from 'react';
import { Plus, Share2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectAccessRole, ProjectDetailDto } from '@pm/contracts';
import { ProjectShareDialog } from '@/features/projects/components/project-share-dialog';
import { ProjectMemberAccessMenu } from '@/features/projects/components/project-access-role-menu';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import {
  ApiError,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/lib/api/projects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectMembersSectionProps = {
  project: ProjectDetailDto;
  onUpdated: (project: ProjectDetailDto) => void;
};

export function ProjectMembersSection({
  project,
  onUpdated,
}: ProjectMembersSectionProps) {
  const { user } = useAuthStore();
  const canManage = canEditProject(project, user?.id);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Miembros del proyecto</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {project.memberCount}
          </span>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="size-3.5 text-brand-indigo" />
            Compartir
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        {canManage ? (
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
        ) : null}
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
                  ) : canManage ? (
                    <ProjectMemberAccessMenu
                      value={member.role}
                      onRoleChange={(role) =>
                        void handleMemberRoleChange(member.userId, role)
                      }
                      onRemove={() => void handleRemoveMember(member.userId)}
                      canRemove={project.memberCount > 1}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                  )
                }
              />
            </li>
          ))}
        </ul>
      </div>
      {canManage ? (
        <ProjectShareDialog
          project={project}
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          onUpdated={onUpdated}
        />
      ) : null}
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
