'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { getTeamAccessRoleLabel } from '@/features/teams/lib/team-access-role';
import {
  acceptTeamInvitation,
  ApiError,
  previewTeamInvitation,
} from '@/lib/api/teams';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { logoutUser } from '@/lib/api/client';
import { setActiveWorkspaceId } from '@/lib/auth/auth-store';
import { AppMark } from '@/components/brand/app-mark';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { user } = useAuthStore();
  const {
    data: preview,
    error: loadError,
    isLoading,
  } = useAsyncResource(
    [token],
    () => previewTeamInvitation(token),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar la invitación',
    { enabled: Boolean(token) },
  );
  const resolvedLoadError = token
    ? loadError
    : 'El enlace de invitación no es válido';
  const isPreviewLoading = Boolean(token) && isLoading;
  const [isAccepting, setIsAccepting] = useState(false);

  const redirectPath = token
    ? `/team-invite?token=${encodeURIComponent(token)}`
    : '/team-invite';

  async function handleAccept(): Promise<void> {
    if (!token) {
      return;
    }
    setIsAccepting(true);
    try {
      const result = await acceptTeamInvitation({ token });
      setActiveWorkspaceId(result.workspaceId);
      toast.success(`Te uniste al equipo ${result.teamName}`);
      router.replace(`/teams/${result.teamId}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo aceptar la invitación';
      toast.error(message);
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <div className="app-shell-bg flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <AppMark className="mx-auto" />
        <Card className="w-full border-border/80 shadow-none">
          <CardHeader>
            <CardTitle>Invitación a equipo</CardTitle>
            <CardDescription>Únete al equipo en Junno.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isPreviewLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : null}
            {resolvedLoadError ? (
              <Alert variant="destructive">
                <AlertDescription>{resolvedLoadError}</AlertDescription>
              </Alert>
            ) : null}
            {preview ? (
              <div className="text-sm leading-6 text-muted-foreground">
                <p>
                  <strong className="text-foreground">{preview.inviterName}</strong> te invitó a
                  unirte al equipo <strong className="text-foreground">{preview.teamName}</strong>{' '}
                  en <strong className="text-foreground">{preview.workspaceName}</strong>.
                </p>
                <p className="mt-2">
                  {preview.isShareLink ? (
                    <span>Enlace abierto: cualquier persona con la cuenta correcta puede unirse.</span>
                  ) : (
                    <>
                      Invitación para:{' '}
                      <span className="text-foreground">{preview.inviteeEmail}</span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-sm">
                  Acceso:{' '}
                  <span className="font-medium text-foreground">
                    {getTeamAccessRoleLabel(preview.role)}
                  </span>
                </p>
                {preview.isExpired ? (
                  <p className="mt-2 text-destructive">Esta invitación ha expirado.</p>
                ) : null}
              </div>
            ) : null}
            {user &&
            preview &&
            !preview.isExpired &&
            !preview.isShareLink &&
            preview.inviteeEmail &&
            user.email.toLowerCase() !== preview.inviteeEmail.toLowerCase() ? (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    Inicia sesión con {preview.inviteeEmail} para aceptar esta invitación.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => void logoutUser().then(() => router.refresh())}
                  >
                    Cerrar sesión e intentar de nuevo
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            {!user ? (
              <>
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                  className={buttonVariants({ className: 'w-full sm:w-auto' })}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(preview?.inviteeEmail ?? '')}`}
                  className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}
                >
                  Crear cuenta
                </Link>
              </>
            ) : null}
            {user && preview && !preview.isExpired ? (
              <Button
                className="w-full sm:w-auto"
                disabled={
                  isAccepting ||
                  (!preview.isShareLink &&
                    !!preview.inviteeEmail &&
                    user.email.toLowerCase() !== preview.inviteeEmail.toLowerCase())
                }
                onClick={() => void handleAccept()}
              >
                {isAccepting ? 'Uniéndote…' : 'Aceptar invitación'}
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
