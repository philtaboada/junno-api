'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError, resetPassword } from '@/lib/api/client';
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
import { PasswordInput } from '@/components/ui/password-input';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function handleSubmit(values: ResetPasswordFormValues): Promise<void> {
    setFormError(null);
    try {
      await resetPassword({ token, password: values.password });
      router.push('/login?reset=success');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo restablecer la contraseña';
      setFormError(message);
    }
  }

  return (
    <Card className="w-full border-border/80 shadow-none">
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>
          Elige una contraseña segura de al menos 8 caracteres.
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
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...form.register('password')}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
              />
              <FieldError errors={[form.formState.errors.confirmPassword]} />
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Guardando…' : 'Restablecer contraseña'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand-indigo underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
