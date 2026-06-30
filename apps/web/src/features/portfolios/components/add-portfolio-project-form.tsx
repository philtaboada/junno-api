'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProjectSummaryDto } from '@pm/contracts';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { fetchProjects } from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';

type AddPortfolioProjectFormProps = {
  existingProjectIds: string[];
  onAddProject: (projectId: string) => Promise<void>;
};

export function AddPortfolioProjectForm({
  existingProjectIds,
  onAddProject,
}: AddPortfolioProjectFormProps) {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableProjects = useMemo(
    () => projects.filter((project) => !existingProjectIds.includes(project.id)),
    [existingProjectIds, projects],
  );

  useEffect(() => {
    void fetchProjects({ status: 'active' })
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (
      selectedProjectId &&
      !availableProjects.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId('');
    }
  }, [availableProjects, selectedProjectId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddProject(selectedProjectId);
      setSelectedProjectId('');
      toast.success('Proyecto añadido al portfolio');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo añadir el proyecto';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-wrap items-end gap-3">
      <Field className="min-w-[16rem] flex-1">
        <FieldLabel htmlFor="portfolio-project">Añadir proyecto</FieldLabel>
        <select
          id="portfolio-project"
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Selecciona un proyecto…</option>
          {availableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" disabled={!selectedProjectId || isSubmitting}>
        {isSubmitting ? 'Añadiendo…' : 'Añadir'}
      </Button>
    </form>
  );
}
