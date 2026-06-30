'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { PortfolioDetailDto } from '@pm/contracts';
import { createPortfolio } from '@/lib/api/portfolios';
import { ApiError } from '@/lib/api/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const createPortfolioSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

type CreatePortfolioFormValues = z.infer<typeof createPortfolioSchema>;

type CreatePortfolioFormProps = {
  onCreated: (portfolio: PortfolioDetailDto) => void;
};

export function CreatePortfolioForm({ onCreated }: CreatePortfolioFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreatePortfolioFormValues>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function handleSubmit(values: CreatePortfolioFormValues): Promise<void> {
    setFormError(null);
    try {
      const portfolio = await createPortfolio({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast.success(`Portfolio "${portfolio.name}" creado`);
      form.reset();
      onCreated(portfolio);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el portfolio';
      setFormError(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex max-w-xl flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Crear portfolio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrupa proyectos relacionados y define goals con métricas.
        </p>
      </div>
      <FieldGroup className="gap-5">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="portfolio-name">Nombre</FieldLabel>
          <Input
            id="portfolio-name"
            placeholder="Por ejemplo: «Lanzamiento Q3»"
            {...form.register('name')}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="portfolio-description">Descripción</FieldLabel>
          <textarea
            id="portfolio-description"
            placeholder="Opcional"
            rows={3}
            className="flex min-h-[5rem] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            {...form.register('description')}
          />
        </Field>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creando…' : 'Crear portfolio'}
        </Button>
      </FieldGroup>
    </form>
  );
}
