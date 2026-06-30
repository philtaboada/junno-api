'use client';

import { use } from 'react';
import { FormRenderer } from '@/features/forms/components/form-renderer';
import { AppMark } from '@/components/brand/app-mark';
import { ApiError } from '@/lib/api/client';
import { fetchPublicForm, submitPublicForm } from '@/lib/api/public-forms';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PublicFormPageProps = {
  params: Promise<{ slug: string }>;
};

export default function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = use(params);
  const {
    data: form,
    error: loadError,
    isLoading,
  } = useAsyncResource(
    [slug],
    () => fetchPublicForm(slug),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el formulario',
  );

  return (
    <div className="app-shell-bg flex min-h-svh flex-col items-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <AppMark className="mx-auto" />
        <Card className="w-full border-border/80 shadow-none">
          <CardHeader>
            <CardTitle>{isLoading ? 'Cargando…' : (form?.name ?? 'Formulario')}</CardTitle>
            <CardDescription>
              {form
                ? `${form.workspaceName} · ${form.projectName}`
                : 'Envía una solicitud para crear una tarea.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <Alert variant="destructive">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : null}
            {form ? (
              <>
                {form.description ? (
                  <p className="mb-4 text-sm text-muted-foreground">{form.description}</p>
                ) : null}
                <FormRenderer
                  fields={form.fields}
                  onSubmit={async (values) => {
                    await submitPublicForm(slug, { values });
                  }}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
