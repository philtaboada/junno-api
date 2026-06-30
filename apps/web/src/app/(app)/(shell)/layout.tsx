'use client';

import type { ReactNode } from 'react';
import { RequireWorkspace } from '@/features/auth/components/require-workspace';
import { AppShell } from '@/features/shell/components/app-shell';

type ShellLayoutProps = {
  children: ReactNode;
};

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <RequireWorkspace>
      <AppShell>{children}</AppShell>
    </RequireWorkspace>
  );
}
