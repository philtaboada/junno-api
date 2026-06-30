'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ApiError, registerUser } from '@/lib/api/client';
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

const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Introduce un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
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

  async function handleSubmit(values: RegisterFormValues): Promise<void> {
    setFormError(null);
    try {
      const session = await registerUser(values);
      toast.success('Cuenta creada correctamente');
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }
      if (session.workspaces.length > 1) {
        router.push('/workspaces');
        return;
      }
      router.push('/home');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la cuenta';
      setFormError(message);
    }
  }

  return (
    <Card className="w-full border-border/80 shadow-none">
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Registro abierto. Se creará tu workspace personal automáticamente.
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
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
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
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...form.register('password')}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creando…' : 'Crear cuenta'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          href={
            redirectPath
              ? `/login?redirect=${encodeURIComponent(redirectPath)}`
              : '/login'
          }
          className="ml-1 font-medium text-brand-indigo underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
