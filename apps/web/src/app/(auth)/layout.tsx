import type { ReactNode } from 'react';
import { AppMark } from '@/components/brand/app-mark';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { RedirectIfAuthenticated } from '@/features/auth/components/redirect-if-authenticated';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <RedirectIfAuthenticated>
        <div className="app-shell-bg flex min-h-full flex-1 items-center justify-center px-4 py-12">
          <div className="flex w-full max-w-md flex-col gap-8">
            <AppMark className="mx-auto" />
            {children}
          </div>
        </div>
      </RedirectIfAuthenticated>
    </AuthProvider>
  );
}
