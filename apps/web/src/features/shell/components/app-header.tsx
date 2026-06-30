'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { WorkspaceSearchBar } from '@/features/search/components/workspace-search-bar';
import { WorkspaceSwitcher } from './workspace-switcher';

export function AppHeader() {
  const activeWorkspace = useActiveWorkspace();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="hidden h-5 sm:block" />
      <div className="hidden min-w-0 flex-1 sm:block">
        <p className="truncate text-sm font-medium">{activeWorkspace?.name}</p>
        <p className="truncate text-xs text-muted-foreground capitalize">
          {activeWorkspace?.type} · {activeWorkspace?.role}
        </p>
      </div>
      <div className="hidden min-w-0 flex-1 md:block">
        <WorkspaceSearchBar />
      </div>
      <div className="ml-auto group-data-[collapsible=icon]:block sm:hidden">
        <WorkspaceSwitcher />
      </div>
    </header>
  );
}
