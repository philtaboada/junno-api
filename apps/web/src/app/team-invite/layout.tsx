import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/components/auth-provider';

type TeamInviteLayoutProps = {
  children: ReactNode;
};

export default function TeamInviteLayout({ children }: TeamInviteLayoutProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
