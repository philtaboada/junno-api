'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { RequireAuth } from '@/features/auth/components/require-auth';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <RequireAuth>{children}</RequireAuth>
    </AuthProvider>
  );
}
