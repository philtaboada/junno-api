'use client';

import { use } from 'react';
import Link from 'next/link';
import { FormRenderer } from '@/features/forms/components/form-renderer';
import { ApiError } from '@/lib/api/client';
import { fetchForm, submitForm } from '@/lib/api/forms';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';

type InternalFormPageProps = {
  params: Promise<{ formId: string }>;
};

export default function InternalFormPage({ params }: InternalFormPageProps) {
  const { formId } = use(params);
  const {
    data: form,
    error: loadError,
    isLoading,
  } = useAsyncResource(
    [formId],
    () => fetchForm(formId),
    (error) =>
      error instanceof ApiError ? error.message : 'No se pudo cargar el formulario',
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">Cargando formulario…</p>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? 'Formulario no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Formulario interno</p>
        <h1 className="text-3xl font-semibold tracking-tight">{form.name}</h1>
        {form.description ? (
          <p className="mt-2 text-muted-foreground">{form.description}</p>
        ) : null}
      </div>
      <div className="max-w-xl">
        <FormRenderer
          fields={form.fields}
          onSubmit={async (values) => {
            await submitForm(form.id, { values });
          }}
        />
      </div>
      <Link
        href={`/projects/${form.projectId}`}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Volver al proyecto
      </Link>
    </div>
  );
}
