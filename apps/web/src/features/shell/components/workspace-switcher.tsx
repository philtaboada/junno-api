'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, LayoutGrid, Plus } from 'lucide-react';
import type { WorkspaceSummaryDto } from '@pm/contracts';
import { useActiveWorkspace, useAuthStore } from '@/features/auth/hooks/use-auth';
import { setActiveWorkspaceId } from '@/lib/auth/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspaces } = useAuthStore();
  const activeWorkspace = useActiveWorkspace();

  function handleSwitchWorkspace(workspace: WorkspaceSummaryDto): void {
    setActiveWorkspaceId(workspace.id);
    router.push('/home');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="max-w-[240px] justify-between gap-2 border-border/80 bg-background"
          />
        }
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <LayoutGrid className="size-4 shrink-0 text-brand-indigo" />
          <span className="truncate">{activeWorkspace?.name ?? 'Workspace'}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tus workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitchWorkspace(workspace)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{workspace.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {workspace.type} · {workspace.role}
                </span>
              </span>
              {workspace.id === activeWorkspace?.id ? (
                <Check className="size-4 text-brand-indigo" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href="/workspaces" />}
            nativeButton={false}
          >
            <Plus className="size-4" />
            Gestionar workspaces
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
