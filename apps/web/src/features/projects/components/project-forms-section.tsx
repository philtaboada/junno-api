'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardCopy, ExternalLink, FileInput, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FormDetailDto, FormSummaryDto, ProjectDetailDto } from '@pm/contracts';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/client';
import {
  addFormField,
  createProjectForm,
  deleteForm,
  fetchForm,
  fetchProjectForms,
} from '@/lib/api/forms';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type ProjectFormsSectionProps = {
  project: ProjectDetailDto;
};

export function ProjectFormsSection({ project }: ProjectFormsSectionProps) {
  const { user } = useAuthStore();
  const canManage = canEditProject(project, user?.id);
  const [forms, setForms] = useState<FormSummaryDto[]>([]);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [expandedForm, setExpandedForm] = useState<FormDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newFormName, setNewFormName] = useState('');
  const [newFormPublic, setNewFormPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadForms = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      setForms(await fetchProjectForms(project.id));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudieron cargar los formularios';
      toast.error(message);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  async function handleCreateForm(): Promise<void> {
    if (newFormName.trim().length < 2) {
      return;
    }
    setIsCreating(true);
    try {
      const form = await createProjectForm(project.id, {
        name: newFormName.trim(),
        isPublic: newFormPublic,
      });
      toast.success(`Formulario "${form.name}" creado`);
      setNewFormName('');
      setNewFormPublic(false);
      await loadForms();
      setExpandedFormId(form.id);
      setExpandedForm(form);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el formulario';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleExpandForm(formId: string): Promise<void> {
    if (expandedFormId === formId) {
      setExpandedFormId(null);
      setExpandedForm(null);
      return;
    }
    try {
      const form = await fetchForm(formId);
      setExpandedFormId(formId);
      setExpandedForm(form);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo cargar el formulario';
      toast.error(message);
    }
  }

  async function handleDeleteForm(formId: string): Promise<void> {
    try {
      await deleteForm(formId);
      toast.success('Formulario eliminado');
      if (expandedFormId === formId) {
        setExpandedFormId(null);
        setExpandedForm(null);
      }
      await loadForms();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el formulario';
      toast.error(message);
    }
  }

  async function handleAddField(
    formId: string,
    type: 'task_description' | 'due_at' | 'custom_field',
    customFieldDefinitionId?: string,
  ): Promise<void> {
    const labels = {
      task_description: 'Descripción',
      due_at: 'Fecha de vencimiento',
      custom_field: 'Campo personalizado',
    };
    try {
      const updatedForm = await addFormField(formId, {
        type,
        label: labels[type],
        required: false,
        customFieldDefinitionId,
      });
      setExpandedForm(updatedForm);
      toast.success('Campo añadido');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo añadir el campo';
      toast.error(message);
    }
  }

  async function copyLink(path: string): Promise<void> {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    toast.success('Enlace copiado');
  }

  const supportedCustomFields = project.customFields.filter((field) =>
    ['text', 'number', 'select', 'multiselect', 'date'].includes(field.type),
  );

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Formularios</h2>
        <p className="text-sm text-muted-foreground">
          Crea tareas en este proyecto desde un formulario interno o enlace público.
        </p>
      </div>
      {canManage ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/80 p-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="new-form-name">Nuevo formulario</FieldLabel>
              <Input
                id="new-form-name"
                placeholder="Por ejemplo: «Solicitud de diseño»"
                value={newFormName}
                onChange={(event) => setNewFormName(event.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={newFormPublic}
                onCheckedChange={(checked) => setNewFormPublic(checked === true)}
              />
              Permitir envíos públicos (sin iniciar sesión)
            </label>
            <Button
              type="button"
              disabled={isCreating || newFormName.trim().length < 2}
              onClick={() => void handleCreateForm()}
            >
              <Plus className="size-4" />
              {isCreating ? 'Creando…' : 'Crear formulario'}
            </Button>
          </FieldGroup>
        </div>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando formularios…</p>
      ) : null}
      {!isLoading && forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay formularios en este proyecto.
        </p>
      ) : null}
      <div className="divide-y divide-border/80 border-y border-border/80">
        {forms.map((form) => (
          <div key={form.id} className="py-4">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => void handleExpandForm(form.id)}
              >
                <p className="flex items-center gap-2 font-medium">
                  <FileInput className="size-4 text-brand-indigo" />
                  {form.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.fieldCount} campos · {form.isPublic ? 'Público' : 'Solo interno'}
                  {!form.isActive ? ' · Desactivado' : ''}
                </p>
              </button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleDeleteForm(form.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </div>
            {expandedFormId === form.id && expandedForm ? (
              <div className="mt-4 space-y-4 rounded-lg border border-border/80 p-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={expandedForm.internalUrl}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <ExternalLink className="size-4" />
                    Abrir (interno)
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyLink(expandedForm.internalUrl)}
                  >
                    <ClipboardCopy className="size-4" />
                    Copiar enlace interno
                  </Button>
                  {expandedForm.isPublic ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyLink(expandedForm.publicUrl)}
                    >
                      <ClipboardCopy className="size-4" />
                      Copiar enlace público
                    </Button>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleAddField(form.id, 'task_description')}
                    >
                      + Descripción
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleAddField(form.id, 'due_at')}
                    >
                      + Vencimiento
                    </Button>
                    {supportedCustomFields.map((field) => (
                      <Button
                        key={field.id}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          void handleAddField(form.id, 'custom_field', field.id)
                        }
                      >
                        + {field.name}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {expandedForm.fields.map((field) => (
                    <li key={field.id}>
                      {field.label} ({field.type}){field.required ? ' *' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
