'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth';

type RedirectIfAuthenticatedProps = {
  children: React.ReactNode;
};

export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      router.replace(redirectPath ?? '/home');
    }
  }, [accessToken, redirectPath, router]);

  if (accessToken) {
    return null;
  }

  return children;
}
