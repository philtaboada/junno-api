'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ApiError, loginUser } from '@/lib/api/client';
import { getActiveWorkspaceId } from '@/lib/auth/auth-store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

const loginSchema = z.object({
  email: z.email('Introduce un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: '',
    },
  });

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      form.setValue('email', email);
    }
  }, [form, searchParams]);

  async function handleSubmit(values: LoginFormValues): Promise<void> {
    setFormError(null);
    try {
      const session = await loginUser(values);
      toast.success(`Bienvenido, ${session.user.name}`);
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }
      if (session.workspaces.length > 1 && !getActiveWorkspaceId()) {
        router.push('/workspaces');
        return;
      }
      router.push('/home');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo iniciar sesión';
      setFormError(message);
    }
  }

  return (
    <Card className="w-full border-border/80 shadow-none">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Accede a tus workspaces y proyectos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.password}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-indigo underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          href={
            redirectPath
              ? `/register?redirect=${encodeURIComponent(redirectPath)}`
              : '/register'
          }
          className="ml-1 font-medium text-brand-indigo underline-offset-4 hover:underline"
        >
          Regístrate
        </Link>
      </CardFooter>
    </Card>
  );
}
