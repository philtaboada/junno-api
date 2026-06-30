'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth';

type LandingRedirectIfAuthProps = {
  children: React.ReactNode;
};

export function LandingRedirectIfAuth({ children }: LandingRedirectIfAuthProps) {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      router.replace('/home');
    }
  }, [accessToken, router]);

  if (accessToken) {
    return null;
  }

  return children;
}
