'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="w-full border-border/80 shadow-none">
        <CardHeader>
          <CardTitle>Enlace no válido</CardTitle>
          <CardDescription>
            Falta el token de recuperación. Solicita un nuevo enlace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Este enlace no es válido o ha expirado.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/forgot-password" className={buttonVariants()}>
            Solicitar nuevo enlace
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
