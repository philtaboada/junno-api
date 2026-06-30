'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearActiveWorkspaceId,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from '@/lib/auth/auth-store';
import { useActiveWorkspace, useAuthStore } from '@/features/auth/hooks/use-auth';

type RequireWorkspaceProps = {
  children: React.ReactNode;
};

export function RequireWorkspace({ children }: RequireWorkspaceProps) {
  const router = useRouter();
  const { workspaces } = useAuthStore();
  const activeWorkspace = useActiveWorkspace();

  useEffect(() => {
    if (workspaces.length === 0) {
      return;
    }
    const activeWorkspaceId = getActiveWorkspaceId();
    if (!activeWorkspaceId && workspaces.length === 1) {
      setActiveWorkspaceId(workspaces[0].id);
      return;
    }
    if (!activeWorkspaceId) {
      router.replace('/workspaces');
      return;
    }
    const isValidWorkspace = workspaces.some(
      (workspace) => workspace.id === activeWorkspaceId,
    );
    if (!isValidWorkspace) {
      clearActiveWorkspaceId();
      router.replace('/workspaces');
    }
  }, [router, workspaces]);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Preparando workspace…
      </div>
    );
  }

  return children;
}
