'use client';

import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import type {
  ProjectAccessRole,
  WorkspaceMemberDto,
  WorkspaceTeamGroupDto,
} from '@pm/contracts';
import { ProjectAccessRoleMenu } from '@/features/projects/components/project-access-role-menu';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { searchWorkspaceMembers } from '@/lib/api/workspaces';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ProjectInviteComboboxProps = {
  projectId: string;
  inviteRole: ProjectAccessRole;
  onInviteRoleChange: (role: ProjectAccessRole) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectMember: (member: WorkspaceMemberDto) => void;
  onSelectTeam: (team: WorkspaceTeamGroupDto) => void;
  className?: string;
};

export function ProjectInviteCombobox({
  projectId,
  inviteRole,
  onInviteRoleChange,
  query,
  onQueryChange,
  onSelectMember,
  onSelectTeam,
  className,
}: ProjectInviteComboboxProps) {
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [teams, setTeams] = useState<WorkspaceTeamGroupDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void searchWorkspaceMembers({
        q: query.trim() || undefined,
        excludeProjectId: projectId,
      })
        .then((response) => {
          setMembers(response.members);
          setTeams(response.teams);
        })
        .finally(() => setIsSearching(false));
    }, 220);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, query, projectId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const hasResults = members.length > 0 || teams.length > 0;
  const showDropdown = isOpen && (hasResults || isSearching || query.trim().length > 0);

  return (
    <div ref={containerRef} className={cn('relative min-w-0 flex-1', className)}>
      <div className="flex items-center overflow-hidden rounded-lg border border-input bg-background shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <input
          type="text"
          placeholder="Añade miembros por nombre o email…"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="shrink-0 border-l border-border/80">
          <ProjectAccessRoleMenu
            value={inviteRole}
            onChange={onInviteRoleChange}
            showDescriptions
            triggerClassName="h-9 rounded-none px-3"
          />
        </div>
      </div>
      {showDropdown ? (
        <div className="absolute top-[calc(100%+4px)] z-50 max-h-64 w-full overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {isSearching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          ) : null}
          {!isSearching && teams.length > 0 ? (
            <div className="py-1">
              <p className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Equipos del workspace
              </p>
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onSelectTeam(team);
                    setIsOpen(false);
                    onQueryChange('');
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-indigo-muted text-brand-indigo">
                    <Users className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{team.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {team.memberCount} {team.memberCount === 1 ? 'persona' : 'personas'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {!isSearching && members.length > 0 ? (
            <div className="py-1">
              <p className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Personas
              </p>
              {members.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => {
                    onSelectMember(member);
                    setIsOpen(false);
                    onQueryChange('');
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <Avatar size="sm" className="after:border-0">
                    <AvatarFallback
                      className={cn(
                        'text-xs font-medium',
                        getTeamAvatarTone(member.userId),
                      )}
                    >
                      {getUserInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {!isSearching && !hasResults && query.trim().length > 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados. Prueba con otro nombre o email.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
