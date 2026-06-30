'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutTemplate, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectTemplateSummaryDto } from '@pm/contracts';
import {
  deleteProjectTemplate,
  fetchProjectTemplates,
} from '@/lib/api/project-templates';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function ProjectTemplatesSection() {
  const [templates, setTemplates] = useState<ProjectTemplateSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      setTemplates(await fetchProjectTemplates());
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudieron cargar las plantillas';
      toast.error(message);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  async function handleDelete(templateId: string, name: string): Promise<void> {
    try {
      await deleteProjectTemplate(templateId);
      setTemplates((current) => current.filter((item) => item.id !== templateId));
      toast.success(`Plantilla "${name}" eliminada`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la plantilla';
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando plantillas…</p>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="size-4 text-brand-indigo" />
        <h2 className="text-lg font-semibold tracking-tight">Plantillas</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Reutiliza la estructura de un proyecto al crear uno nuevo.
      </p>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <ul className="divide-y divide-border/60">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-start gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {template.sectionCount} secciones
                  {template.customFieldCount > 0
                    ? ` · ${template.customFieldCount} campos`
                    : ''}
                  {template.hasTasks
                    ? ` · ${template.taskCount} tareas`
                    : ''}
                  {template.sourceProjectName
                    ? ` · desde «${template.sourceProjectName}»`
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar plantilla ${template.name}`}
                onClick={() => void handleDelete(template.id, template.name)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
