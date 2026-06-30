'use client';

import { ChevronDown } from 'lucide-react';
import type { ProjectAccessRole } from '@pm/contracts';
import {
  getProjectAccessRoleLabel,
  PROJECT_ACCESS_ROLE_OPTIONS,
} from '@/features/projects/lib/project-access-role';
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

type ProjectAccessRoleMenuProps = {
  value: ProjectAccessRole;
  onChange: (value: ProjectAccessRole) => void;
  className?: string;
  triggerClassName?: string;
  align?: 'start' | 'center' | 'end';
  showDescriptions?: boolean;
};

export function ProjectAccessRoleMenu({
  value,
  onChange,
  className,
  triggerClassName,
  align = 'end',
  showDescriptions = false,
}: ProjectAccessRoleMenuProps) {
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
        {getProjectAccessRoleLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Nivel de acceso
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => onChange(nextValue as ProjectAccessRole)}
          >
            {PROJECT_ACCESS_ROLE_OPTIONS.map((option) => (
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

type ProjectMemberAccessMenuProps = {
  value: ProjectAccessRole;
  onRoleChange: (value: ProjectAccessRole) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  className?: string;
};

export function ProjectMemberAccessMenu({
  value,
  onRoleChange,
  onRemove,
  canRemove = false,
  className,
}: ProjectMemberAccessMenuProps) {
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
        {getProjectAccessRoleLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => onRoleChange(nextValue as ProjectAccessRole)}
          >
            {PROJECT_ACCESS_ROLE_OPTIONS.map((option) => (
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
              Quitar del proyecto
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
