'use client';

import { useState } from 'react';
import { UserRound, UserRoundX } from 'lucide-react';
import type { TaskAssigneeDto } from '@pm/contracts';
import { getTeamAvatarTone } from '@/features/teams/lib/team-avatar-tone';
import { getUserInitials } from '@/features/shell/lib/user-initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type AssigneePickerMember = {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
};

type TaskAssigneePickerProps = {
  assignee: TaskAssigneeDto | null;
  members: AssigneePickerMember[];
  canEdit: boolean;
  onAssigneeChange: (assigneeId: string | null) => Promise<void>;
};

export function TaskAssigneePicker({
  assignee,
  members,
  canEdit,
  onAssigneeChange,
}: TaskAssigneePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSelect(userId: string | null): Promise<void> {
    setIsSaving(true);
    try {
      await onAssigneeChange(userId);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  const avatarContent = assignee ? (
    <Avatar size="sm" className="size-7 after:border-0">
      <AvatarFallback
        className={cn(
          'text-[10px] font-medium',
          getTeamAvatarTone(assignee.userId),
        )}
      >
        {getUserInitials(assignee.name)}
      </AvatarFallback>
    </Avatar>
  ) : (
    <span className="flex size-7 items-center justify-center rounded-full border border-dashed border-border/80 text-muted-foreground">
      <UserRound className="size-3.5" />
    </span>
  );

  if (!canEdit) {
    return (
      <div className="flex justify-center" title={assignee?.name}>
        {avatarContent}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={isSaving}
            className="mx-auto flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted/80"
            aria-label={assignee ? `Asignado a ${assignee.name}` : 'Asignar responsable'}
          >
            {avatarContent}
          </button>
        }
      />
      <PopoverContent align="end" className="w-64 p-1">
        <div className="max-h-56 overflow-y-auto">
          <button
            type="button"
            disabled={isSaving}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70"
            onClick={() => void handleSelect(null)}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRoundX className="size-3.5" />
            </span>
            <span>Sin asignar</span>
          </button>
          {members.map((member) => (
            <button
              key={member.userId}
              type="button"
              disabled={isSaving}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70',
                assignee?.userId === member.userId && 'bg-brand-indigo/10',
              )}
              onClick={() => void handleSelect(member.userId)}
            >
              <Avatar size="sm" className="size-7 after:border-0">
                <AvatarFallback
                  className={cn(
                    'text-[10px] font-medium',
                    getTeamAvatarTone(member.userId),
                  )}
                >
                  {getUserInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate">
                <span className="block truncate font-medium">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {member.email}
                </span>
              </span>
            </button>
          ))}
        </div>
        {members.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No hay miembros en el proyecto.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}