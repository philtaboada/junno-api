'use client';

import { ChevronDown } from 'lucide-react';
import type { TeamAccessRole } from '@pm/contracts';
import {
  getTeamAccessRoleLabel,
  TEAM_ACCESS_ROLE_OPTIONS,
} from '@/features/teams/lib/team-access-role';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TeamAccessRoleMenuProps = {
  value: TeamAccessRole;
  onChange: (value: TeamAccessRole) => void;
  className?: string;
  triggerClassName?: string;
  align?: 'start' | 'center' | 'end';
  showDescriptions?: boolean;
};

export function TeamAccessRoleMenu({
  value,
  onChange,
  className,
  triggerClassName,
  align = 'end',
  showDescriptions = false,
}: TeamAccessRoleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('outline-none', className)}
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1 px-2 font-normal text-muted-foreground hover:text-foreground',
              triggerClassName,
            )}
          />
        }
      >
        {getTeamAccessRoleLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Nivel de acceso
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => onChange(nextValue as TeamAccessRole)}
          >
            {TEAM_ACCESS_ROLE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <span className="flex flex-col gap-0.5">
                  <span>{option.label}</span>
                  {showDescriptions ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type TeamMemberAccessMenuProps = {
  value: TeamAccessRole;
  onRoleChange: (value: TeamAccessRole) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  className?: string;
};

export function TeamMemberAccessMenu({
  value,
  onRoleChange,
  onRemove,
  canRemove = false,
  className,
}: TeamMemberAccessMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('outline-none', className)}
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-w-[7.5rem] gap-1 px-2 font-normal text-muted-foreground hover:text-foreground"
          />
        }
      >
        {getTeamAccessRoleLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => onRoleChange(nextValue as TeamAccessRole)}
          >
            {TEAM_ACCESS_ROLE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {canRemove && onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              Quitar del equipo
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type TeamPendingAccessMenuProps = {
  role: TeamAccessRole;
  onRoleChange: (value: TeamAccessRole) => void;
  onCopyLink: () => void;
  onRemove: () => void;
  isCopying?: boolean;
};

export function TeamPendingAccessMenu({
  role,
  onRoleChange,
  onCopyLink,
  onRemove,
  isCopying = false,
}: TeamPendingAccessMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-w-[7.5rem] gap-1 px-2 font-normal text-muted-foreground hover:text-foreground"
          />
        }
      >
        {getTeamAccessRoleLabel(role)} · Pendiente
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={role}
            onValueChange={(nextValue) => onRoleChange(nextValue as TeamAccessRole)}
          >
            {TEAM_ACCESS_ROLE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCopyLink} disabled={isCopying}>
          {isCopying ? 'Copiando…' : 'Copiar enlace de invitación'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          Cancelar invitación
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
