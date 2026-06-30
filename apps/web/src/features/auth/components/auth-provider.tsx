'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { bootstrapSession } from '@/lib/api/client';
import { useAuthStore } from '@/features/auth/hooks/use-auth';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { accessToken } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function initializeSession(): Promise<void> {
      await bootstrapSession();
      if (isMounted) {
        setIsBootstrapping(false);
      }
    }
    void initializeSession();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isBootstrapping && !accessToken) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  return children;
}
