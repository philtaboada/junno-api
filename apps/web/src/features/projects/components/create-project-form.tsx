'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ProjectColor, ProjectSummaryDto, TeamSummaryDto } from '@pm/contracts';
import {
  PROJECT_COLOR_OPTIONS,
  getProjectColorOption,
} from '@/features/projects/lib/project-color';
import { ApiError, createProject } from '@/lib/api/projects';
import { createProjectFromTemplate, fetchProjectTemplates } from '@/lib/api/project-templates';
import type { ProjectTemplateSummaryDto } from '@pm/contracts';
import { ApiError as TeamsApiError, fetchTeams } from '@/lib/api/teams';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PROJECT_COLORS = [
  'coral',
  'indigo',
  'emerald',
  'amber',
  'rose',
  'sky',
  'slate',
  'violet',
] as const satisfies readonly ProjectColor[];

const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  teamId: z.string().uuid('Selecciona un equipo'),
  description: z.string().optional(),
  color: z.enum(PROJECT_COLORS).optional(),
  templateId: z.string().optional(),
  includeTasksFromTemplate: z.boolean().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

type CreateProjectFormProps = {
  onCreated: (project: ProjectSummaryDto) => void;
  defaultTeamId?: string;
  lockTeamSelection?: boolean;
  compact?: boolean;
};

const selectClassName =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30';

export function CreateProjectForm({
  onCreated,
  defaultTeamId,
  lockTeamSelection = false,
  compact = false,
}: CreateProjectFormProps) {
  const [teams, setTeams] = useState<TeamSummaryDto[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplateSummaryDto[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      teamId: '',
      description: '',
      color: 'indigo',
      templateId: '',
      includeTasksFromTemplate: false,
    },
  });
  const projectName = form.watch('name');
  const selectedTeamId = form.watch('teamId');
  const selectedColor = form.watch('color');
  const selectedTemplateId = form.watch('templateId');
  const includeTasksFromTemplate = form.watch('includeTasksFromTemplate');
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  useEffect(() => {
    setIsLoadingTeams(true);
    setTeamsError(null);
    void fetchTeams()
      .then((nextTeams) => {
        setTeams(nextTeams);
        const preferredTeamId =
          defaultTeamId && nextTeams.some((team) => team.id === defaultTeamId)
            ? defaultTeamId
            : nextTeams.length === 1
              ? nextTeams[0].id
              : '';
        if (preferredTeamId) {
          form.setValue('teamId', preferredTeamId);
        }
      })
      .catch((error) => {
        const message =
          error instanceof TeamsApiError
            ? error.message
            : 'No se pudieron cargar los equipos';
        setTeamsError(message);
        setTeams([]);
      })
      .finally(() => setIsLoadingTeams(false));
  }, [defaultTeamId, form]);

  useEffect(() => {
    void fetchProjectTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  async function handleSubmit(values: CreateProjectFormValues): Promise<void> {
    setFormError(null);
    try {
      const project = values.templateId
        ? await createProjectFromTemplate(values.templateId, {
            name: values.name.trim(),
            teamId: values.teamId,
            description: values.description?.trim() || undefined,
            color: values.color,
            includeTasks: values.includeTasksFromTemplate,
          })
        : await createProject({
            name: values.name.trim(),
            teamId: values.teamId,
            description: values.description?.trim() || undefined,
            color: values.color,
          });
      toast.success(`Proyecto "${project.name}" creado`);
      form.reset({
        name: '',
        teamId:
          defaultTeamId && teams.some((team) => team.id === defaultTeamId)
            ? defaultTeamId
            : teams.length === 1
              ? teams[0].id
              : '',
        description: '',
        color: 'indigo',
        templateId: '',
        includeTasksFromTemplate: false,
      });
      onCreated(project);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el proyecto';
      setFormError(message);
    }
  }

  if (isLoadingTeams) {
    return (
      <p className="text-sm text-muted-foreground">Cargando equipos disponibles…</p>
    );
  }

  if (teamsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{teamsError}</AlertDescription>
      </Alert>
    );
  }

  if (teams.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Necesitas al menos un equipo para crear un proyecto.{' '}
          <Link href="/teams" className="font-medium text-brand-indigo hover:underline">
            Crear equipo
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={
        compact
          ? 'flex flex-col gap-5'
          : 'grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start'
      }
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
        {!compact ? (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Crear un proyecto nuevo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Los proyectos viven dentro de un equipo.
            </p>
          </div>
        ) : null}
        <FieldGroup className="gap-5">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <Field>
            <FieldLabel htmlFor="project-name">Nombre del proyecto</FieldLabel>
            <Input
              id="project-name"
              placeholder="Por ejemplo: «Lanzamiento Q3»"
              {...form.register('name')}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-team">Equipo</FieldLabel>
            {lockTeamSelection && selectedTeam ? (
              <div className="space-y-2">
                <Input
                  id="project-team"
                  value={selectedTeam.name}
                  readOnly
                  disabled
                />
                <input type="hidden" {...form.register('teamId')} />
              </div>
            ) : (
              <select
                id="project-team"
                className={selectClassName}
                {...form.register('teamId')}
              >
                <option value="">Selecciona un equipo</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <FieldError errors={[form.formState.errors.teamId]} />
          </Field>
          {templates.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="project-template">Plantilla (opcional)</FieldLabel>
              <select
                id="project-template"
                className={selectClassName}
                {...form.register('templateId')}
              >
                <option value="">Sin plantilla</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {selectedTemplate?.hasTasks ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={includeTasksFromTemplate ?? false}
                onChange={(event) =>
                  form.setValue('includeTasksFromTemplate', event.target.checked)
                }
              />
              Incluir tareas de la plantilla ({selectedTemplate.taskCount})
            </label>
          ) : null}
          <Field>
            <FieldLabel htmlFor="project-description">Descripción</FieldLabel>
            <Input
              id="project-description"
              placeholder="Opcional"
              {...form.register('description')}
            />
          </Field>
          <Field>
            <FieldLabel>Color</FieldLabel>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={option.label}
                      aria-pressed={field.value === option.value}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'size-8 rounded-md border-2 transition-transform hover:scale-105',
                        option.swatchClassName,
                        field.value === option.value
                          ? 'border-foreground ring-2 ring-ring/40'
                          : 'border-transparent',
                      )}
                    />
                  ))}
                </div>
              )}
            />
          </Field>
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              projectName.trim().length < 2 ||
              !selectedTeamId
            }
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Creando…' : 'Crear proyecto'}
          </Button>
        </FieldGroup>
      </form>
      {!compact ? (
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-lg text-white',
                getProjectColorOption(selectedColor).swatchClassName,
              )}
            >
              <span className="text-sm font-semibold">
                {(projectName.trim() || 'P').slice(0, 1).toUpperCase()}
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">
                {projectName.trim() || 'Nombre del proyecto'}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTeam?.name ?? 'Selecciona un equipo'}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 px-5 py-5">
          <p className="text-sm font-semibold tracking-tight text-muted-foreground">
            Secciones
          </p>
          <div className="rounded-lg border border-border/60 px-3 py-2.5 text-sm text-muted-foreground">
            Sin título
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}
