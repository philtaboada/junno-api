'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { GoalSummaryDto } from '@pm/contracts';
import { ApiError } from '@/lib/api/client';
import { fetchProject } from '@/lib/api/projects';
import { createPortfolioGoal } from '@/lib/api/portfolios';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const createGoalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  metricType: z.enum(['tasks_completion_percent', 'custom_field_rollup']),
  targetValue: z.string().optional(),
  customFieldDefinitionId: z.string().optional(),
  aggregation: z.enum(['sum', 'avg']).optional(),
});

type CreateGoalFormValues = z.infer<typeof createGoalSchema>;

type NumberFieldOption = {
  readonly fieldId: string;
  readonly label: string;
};

type PortfolioProjectOption = {
  readonly projectId: string;
  readonly projectName: string;
};

type CreatePortfolioGoalFormProps = {
  portfolioId: string;
  portfolioProjects: PortfolioProjectOption[];
  onCreated: (goal: GoalSummaryDto) => void;
};

export function CreatePortfolioGoalForm({
  portfolioId,
  portfolioProjects,
  onCreated,
}: CreatePortfolioGoalFormProps) {
  const projectIdsKey = portfolioProjects
    .map((project) => project.projectId)
    .sort()
    .join(',');
  const projectIds = projectIdsKey.length > 0 ? projectIdsKey.split(',') : [];
  const [numberFields, setNumberFields] = useState<NumberFieldOption[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [loadFieldsError, setLoadFieldsError] = useState<string | null>(null);
  const [fieldsReloadToken, setFieldsReloadToken] = useState(0);
  const form = useForm<CreateGoalFormValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: '',
      metricType: 'tasks_completion_percent',
      targetValue: '100',
      customFieldDefinitionId: '',
      aggregation: 'sum',
    },
  });
  const metricType = form.watch('metricType');

  useEffect(() => {
    if (metricType !== 'custom_field_rollup') {
      return;
    }
    if (projectIds.length === 0) {
      setNumberFields([]);
      setLoadFieldsError(null);
      setIsLoadingFields(false);
      return;
    }
    let isCancelled = false;
    setIsLoadingFields(true);
    setLoadFieldsError(null);
    void Promise.all(projectIds.map((projectId) => fetchProject(projectId)))
      .then((projects) => {
        if (isCancelled) {
          return;
        }
        const options: NumberFieldOption[] = [];
        for (const project of projects) {
          for (const field of project.customFields) {
            if (field.type === 'number') {
              options.push({
                fieldId: field.id,
                label: `${project.name} · ${field.name}`,
              });
            }
          }
        }
        setNumberFields(options);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : 'No se pudieron cargar los campos de los proyectos';
        setLoadFieldsError(message);
        setNumberFields([]);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingFields(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [metricType, projectIdsKey, fieldsReloadToken]);

  async function handleSubmit(values: CreateGoalFormValues): Promise<void> {
    const parsedTarget = values.targetValue?.trim()
      ? Number.parseFloat(values.targetValue)
      : undefined;
    if (values.metricType === 'custom_field_rollup') {
      if (!values.customFieldDefinitionId) {
        toast.error('Selecciona un campo numérico');
        return;
      }
    }
    try {
      const goal = await createPortfolioGoal(portfolioId, {
        name: values.name.trim(),
        metricType: values.metricType,
        targetValue:
          parsedTarget !== undefined && !Number.isNaN(parsedTarget)
            ? parsedTarget
            : undefined,
        metricConfig:
          values.metricType === 'custom_field_rollup'
            ? {
                customFieldDefinitionId: values.customFieldDefinitionId!,
                aggregation: values.aggregation ?? 'sum',
              }
            : undefined,
      });
      toast.success(`Goal "${goal.name}" creado`);
      form.reset({
        name: '',
        metricType: 'tasks_completion_percent',
        targetValue: '100',
        customFieldDefinitionId: '',
        aggregation: 'sum',
      });
      onCreated(goal);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el goal';
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 rounded-xl border border-dashed border-border/80 p-4">
      <div>
        <h3 className="font-medium">Nuevo goal</h3>
        <p className="text-sm text-muted-foreground">
          Mide el progreso agregado de los proyectos del portfolio.
        </p>
      </div>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="goal-name">Nombre</FieldLabel>
          <Input id="goal-name" placeholder="Por ejemplo: «80% tareas hechas»" {...form.register('name')} />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="goal-metric-type">Métrica</FieldLabel>
          <select
            id="goal-metric-type"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            {...form.register('metricType')}
          >
            <option value="tasks_completion_percent">% tareas completadas</option>
            <option value="custom_field_rollup">Rollup campo numérico</option>
          </select>
        </Field>
        {metricType === 'custom_field_rollup' ? (
          <>
            <Field>
              <FieldLabel htmlFor="goal-custom-field">Campo numérico</FieldLabel>
              <select
                id="goal-custom-field"
                disabled={isLoadingFields || numberFields.length === 0}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                {...form.register('customFieldDefinitionId')}
              >
                <option value="">
                  {isLoadingFields ? 'Cargando campos…' : 'Selecciona un campo…'}
                </option>
                {numberFields.map((field) => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.label}
                  </option>
                ))}
              </select>
              {loadFieldsError ? (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{loadFieldsError}</AlertDescription>
                </Alert>
              ) : null}
              {!isLoadingFields && !loadFieldsError && projectIds.length > 0 && numberFields.length === 0 ? (
                <div className="mt-2 space-y-2 rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p>
                    Esta métrica usa un <strong className="text-foreground">campo personalizado tipo Número</strong>{' '}
                    en alguno de los proyectos del portfolio. Aún no hay ninguno.
                  </p>
                  <ol className="list-decimal space-y-1 pl-4">
                    <li>Abre un proyecto del portfolio (vista Lista).</li>
                    <li>Añade una columna → tipo <strong className="text-foreground">Número</strong> (p. ej. «Presupuesto», «Story points»).</li>
                    <li>Vuelve aquí y pulsa «Recargar campos».</li>
                  </ol>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {portfolioProjects.map((project) => (
                      <Link
                        key={project.projectId}
                        href={`/projects/${project.projectId}`}
                        className="text-brand-indigo underline-offset-2 hover:underline"
                      >
                        {project.projectName}
                      </Link>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFieldsReloadToken((token) => token + 1)}
                  >
                    Recargar campos
                  </Button>
                </div>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="goal-aggregation">Agregación</FieldLabel>
              <select
                id="goal-aggregation"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...form.register('aggregation')}
              >
                <option value="sum">Suma</option>
                <option value="avg">Promedio</option>
              </select>
            </Field>
          </>
        ) : null}
        <Field>
          <FieldLabel htmlFor="goal-target">Objetivo</FieldLabel>
          <Input
            id="goal-target"
            type="number"
            min={0}
            step="any"
            placeholder={metricType === 'tasks_completion_percent' ? '100' : '1'}
            {...form.register('targetValue')}
          />
        </Field>
        <Button
          type="submit"
          disabled={
            form.formState.isSubmitting ||
            projectIds.length === 0 ||
            (metricType === 'custom_field_rollup' &&
              (isLoadingFields || numberFields.length === 0))
          }
        >
          {form.formState.isSubmitting ? 'Creando…' : 'Crear goal'}
        </Button>
        {projectIds.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Añade al menos un proyecto al portfolio antes de crear goals.
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
