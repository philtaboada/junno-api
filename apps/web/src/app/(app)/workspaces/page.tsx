'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WorkspacePicker } from '@/features/auth/components/workspace-picker';
import { useActiveWorkspace, useAuthStore } from '@/features/auth/hooks/use-auth';
import { AppMark } from '@/components/brand/app-mark';
import { buttonVariants } from '@/components/ui/button';

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces } = useAuthStore();
  const activeWorkspace = useActiveWorkspace();

  useEffect(() => {
    if (activeWorkspace) {
      router.replace('/home');
    }
  }, [activeWorkspace, router]);

  return (
    <div className="app-shell-bg flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <AppMark className="mx-auto" />
        {workspaces.length <= 1 ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Solo tienes un workspace por ahora.
            </p>
            <Link href="/home" className={buttonVariants()}>
              Ir al inicio
            </Link>
          </div>
        ) : (
          <WorkspacePicker workspaces={workspaces} />
        )}
      </div>
    </div>
  );
}
