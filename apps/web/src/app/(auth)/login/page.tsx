'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
    }
  }, [searchParams]);

  return <LoginForm />;
}
