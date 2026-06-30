'use client';

import { useEffect, useState } from 'react';
import type { CustomFieldDefinitionDto, DashboardDetailDto, DashboardWidgetType } from '@pm/contracts';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { addDashboardWidget } from '@/lib/api/dashboards';
import { fetchProject, fetchProjects } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type SelectFieldOption = {
  readonly fieldId: string;
  readonly label: string;
};

type AddDashboardWidgetFormProps = {
  dashboard: DashboardDetailDto;
  teamId: string;
  onAdded: (dashboard: DashboardDetailDto) => void;
};

const WIDGET_TYPE_LABELS: Record<DashboardWidgetType, string> = {
  overdue_count: 'Tareas vencidas',
  tasks_by_assignee: 'Tareas por asignado',
  custom_field_breakdown: 'Desglose por campo',
};

export function AddDashboardWidgetForm({
  dashboard,
  teamId,
  onAdded,
}: AddDashboardWidgetFormProps) {
  const [widgetType, setWidgetType] = useState<DashboardWidgetType>('overdue_count');
  const [title, setTitle] = useState(WIDGET_TYPE_LABELS.overdue_count);
  const [projectId, setProjectId] = useState('');
  const [customFieldDefinitionId, setCustomFieldDefinitionId] = useState('');
  const [selectFieldOptions, setSelectFieldOptions] = useState<SelectFieldOption[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void fetchProjects({
      teamId: teamId || undefined,
      status: 'active',
    })
      .then((items) => setProjects(items.map((item) => ({ id: item.id, name: item.name }))))
      .catch(() => setProjects([]));
  }, [teamId]);

  useEffect(() => {
    if (widgetType !== 'custom_field_breakdown') {
      setSelectFieldOptions([]);
      return;
    }
    if (projects.length === 0) {
      setSelectFieldOptions([]);
      return;
    }
    let isCancelled = false;
    setIsLoadingFields(true);
    void Promise.all(projects.map((project) => fetchProject(project.id)))
      .then((projectDetails) => {
        if (isCancelled) {
          return;
        }
        const options: SelectFieldOption[] = [];
        for (const project of projectDetails) {
          for (const field of project.customFields) {
            if (field.type === 'select' || field.type === 'multiselect') {
              options.push({
                fieldId: field.id,
                label: `${project.name} · ${field.name}`,
              });
            }
          }
        }
        setSelectFieldOptions(options);
      })
      .catch(() => {
        if (!isCancelled) {
          setSelectFieldOptions([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingFields(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [widgetType, projects]);

  function handleWidgetTypeChange(nextType: DashboardWidgetType): void {
    setWidgetType(nextType);
    setTitle(WIDGET_TYPE_LABELS[nextType]);
    setCustomFieldDefinitionId('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (widgetType === 'custom_field_breakdown' && !customFieldDefinitionId) {
      toast.error('Selecciona un campo de selección');
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedDashboard = await addDashboardWidget(dashboard.id, {
        type: widgetType,
        title: title.trim(),
        config:
          widgetType === 'custom_field_breakdown'
            ? {
                customFieldDefinitionId,
                projectId: projectId || undefined,
              }
            : { projectId: projectId || undefined },
      });
      toast.success('Widget añadido');
      setTitle(WIDGET_TYPE_LABELS.overdue_count);
      setWidgetType('overdue_count');
      setProjectId('');
      setCustomFieldDefinitionId('');
      onAdded(updatedDashboard);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo añadir el widget';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4 rounded-xl border border-dashed border-border/80 p-4"
    >
      <div>
        <h3 className="font-medium">Añadir widget</h3>
        <p className="text-sm text-muted-foreground">
          Personaliza el dashboard con métricas agregadas.
        </p>
      </div>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="widget-type">Tipo</FieldLabel>
          <select
            id="widget-type"
            value={widgetType}
            onChange={(event) =>
              handleWidgetTypeChange(event.target.value as DashboardWidgetType)
            }
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="overdue_count">Tareas vencidas</option>
            <option value="tasks_by_assignee">Tareas por asignado</option>
            <option value="custom_field_breakdown">Desglose por campo</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="widget-title">Título</FieldLabel>
          <Input
            id="widget-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="widget-project">Filtrar por proyecto</FieldLabel>
          <select
            id="widget-project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Todos los proyectos del ámbito</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
        {widgetType === 'custom_field_breakdown' ? (
          <Field>
            <FieldLabel htmlFor="widget-custom-field">Campo select</FieldLabel>
            <select
              id="widget-custom-field"
              value={customFieldDefinitionId}
              onChange={(event) => setCustomFieldDefinitionId(event.target.value)}
              disabled={isLoadingFields || selectFieldOptions.length === 0}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
            >
              <option value="">
                {isLoadingFields ? 'Cargando campos…' : 'Selecciona un campo…'}
              </option>
              {selectFieldOptions.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.label}
                </option>
              ))}
            </select>
            {!isLoadingFields && selectFieldOptions.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Crea un campo tipo selección en la vista Lista de un proyecto.
              </p>
            ) : null}
          </Field>
        ) : null}
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            (widgetType === 'custom_field_breakdown' &&
              (isLoadingFields || selectFieldOptions.length === 0))
          }
        >
          {isSubmitting ? 'Añadiendo…' : 'Añadir widget'}
        </Button>
      </FieldGroup>
    </form>
  );
}
