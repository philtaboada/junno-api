'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Globe, Link2, Mail, X } from 'lucide-react';
import type { WorkspaceMemberDto } from '@pm/contracts';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { searchWorkspaceMembers } from '@/lib/api/workspaces';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type DraftTeamMember =
  | {
      id: string;
      kind: 'user';
      userId: string;
      name: string;
      email: string;
    }
  | {
      id: string;
      kind: 'email';
      email: string;
    };

type CreateTeamMemberPickerProps = {
  members: DraftTeamMember[];
  onMembersChange: (members: DraftTeamMember[]) => void;
  excludeUserId?: string;
  excludeEmail?: string;
  onShareLink?: () => void | Promise<void>;
  isSharingLink?: boolean;
  className?: string;
};

function createMemberId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function CreateTeamMemberPicker({
  members,
  onMembersChange,
  excludeUserId,
  excludeEmail,
  onShareLink,
  isSharingLink = false,
  className,
}: CreateTeamMemberPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkspaceMemberDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUserIds = new Set(
    members.filter((member) => member.kind === 'user').map((member) => member.userId),
  );
  const selectedEmails = new Set(
    members.filter((member) => member.kind === 'email').map((member) => member.email),
  );

  const normalizedExcludeEmail = excludeEmail?.trim().toLowerCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void searchWorkspaceMembers({ q: query.trim() || undefined })
        .then((response) => {
          setResults(
            response.members.filter(
              (member) =>
                !selectedUserIds.has(member.userId) &&
                member.userId !== excludeUserId,
            ),
          );
        })
        .finally(() => setIsSearching(false));
    }, 220);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, query, members, excludeUserId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function addUserMember(member: WorkspaceMemberDto): void {
    if (selectedUserIds.has(member.userId) || member.userId === excludeUserId) {
      return;
    }
    onMembersChange([
      ...members,
      {
        id: createMemberId(),
        kind: 'user',
        userId: member.userId,
        name: member.name,
        email: member.email,
      },
    ]);
    setQuery('');
    setIsOpen(false);
  }

  function addEmailMember(email: string): void {
    const normalizedEmail = email.trim().toLowerCase();
    if (
      !isValidEmail(normalizedEmail) ||
      selectedEmails.has(normalizedEmail) ||
      normalizedEmail === normalizedExcludeEmail
    ) {
      return;
    }
    onMembersChange([
      ...members,
      {
        id: createMemberId(),
        kind: 'email',
        email: normalizedEmail,
      },
    ]);
    setQuery('');
    setIsOpen(false);
  }

  function removeMember(memberId: string): void {
    onMembersChange(members.filter((member) => member.id !== memberId));
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' && query.trim().includes('@')) {
      event.preventDefault();
      addEmailMember(query);
    }
  }

  const trimmedQuery = query.trim();
  const isEmailQuery = trimmedQuery.includes('@');
  const canInviteByEmail =
    isValidEmail(trimmedQuery) &&
    !selectedEmails.has(trimmedQuery.toLowerCase()) &&
    trimmedQuery.toLowerCase() !== normalizedExcludeEmail;

  const showDropdown =
    isOpen && (results.length > 0 || isSearching || trimmedQuery.length > 0);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5',
          'transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
        )}
      >
        {members.map((member) => (
          <span
            key={member.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/80 bg-muted/40 py-0.5 pr-1 pl-1.5 text-sm"
          >
            {member.kind === 'user' ? (
              <Avatar size="sm" className="size-5 after:border-0">
                <AvatarFallback
                  className={cn(
                    'text-[10px] font-medium',
                    getTeamAvatarTone(member.userId),
                  )}
                >
                  {getUserInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="max-w-[10rem] truncate">
              {member.kind === 'user' ? member.email : member.email}
            </span>
            <button
              type="button"
              onClick={() => removeMember(member.id)}
              className="rounded-full p-0.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
              aria-label="Quitar miembro"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          placeholder={members.length === 0 ? 'Busca por nombre o email…' : ''}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showDropdown ? (
        <div className="absolute top-[calc(100%+4px)] z-50 max-h-56 w-full overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {isSearching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          ) : null}
          {!isSearching && results.length > 0
            ? results.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => addUserMember(member)}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none hover:bg-muted/60"
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
              ))
            : null}
          {!isSearching && results.length === 0 && isEmailQuery ? (
            normalizedExcludeEmail && trimmedQuery.toLowerCase() === normalizedExcludeEmail ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Ya formas parte del equipo como creador.
              </p>
            ) : (
              <div className="flex flex-col gap-1 p-1">
                <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                  {trimmedQuery}
                </p>
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    disabled={!canInviteByEmail}
                    onClick={() => addEmailMember(query)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-sm outline-none hover:bg-muted/60 disabled:opacity-50"
                  >
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    Invitar por email
                  </button>
                  {onShareLink ? (
                    <button
                      type="button"
                      disabled={isSharingLink}
                      onClick={() => void onShareLink()}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-brand-indigo outline-none hover:bg-brand-indigo-muted/60 disabled:opacity-50"
                    >
                      <Link2 className="size-3.5 shrink-0" />
                      {isSharingLink ? 'Copiando…' : 'Compartir URL'}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          ) : null}
          {!isSearching && results.length === 0 && trimmedQuery.length > 0 && !isEmailQuery ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
