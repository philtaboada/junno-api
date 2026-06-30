import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { LandingRedirectIfAuth } from '@/features/landing/components/landing-redirect-if-auth';

type MarketingLayoutProps = {
  children: ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <AuthProvider>
      <LandingRedirectIfAuth>{children}</LandingRedirectIfAuth>
    </AuthProvider>
  );
}
