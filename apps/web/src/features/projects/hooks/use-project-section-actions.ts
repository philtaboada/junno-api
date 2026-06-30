'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import type { ProjectDetailDto } from '@pm/contracts';
import {
  ApiError,
  createSection,
  deleteSection,
  reorderSections,
  updateSection,
} from '@/lib/api/projects';

type UseProjectSectionActionsResult = {
  sections: ProjectDetailDto['sections'];
  handleRenameSection: (sectionId: string, name: string) => Promise<void>;
  handleDeleteSection: (sectionId: string) => Promise<void>;
  handleMoveSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;
  createSection: (name: string) => Promise<void>;
  getSectionMeta: (sectionId: string) => {
    canDelete: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
  };
};

export function useProjectSectionActions(
  project: ProjectDetailDto,
  onProjectUpdated: (project: ProjectDetailDto) => void,
): UseProjectSectionActionsResult {
  const sections = useMemo(
    () => [...project.sections].sort((left, right) => left.position - right.position),
    [project.sections],
  );

  async function handleRenameSection(sectionId: string, name: string): Promise<void> {
    try {
      onProjectUpdated(await updateSection(project.id, sectionId, { name }));
      toast.success('Sección actualizada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la sección';
      toast.error(message);
      throw error;
    }
  }

  async function handleDeleteSection(sectionId: string): Promise<void> {
    try {
      onProjectUpdated(await deleteSection(project.id, sectionId));
      toast.success('Sección eliminada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la sección';
      toast.error(message);
    }
  }

  async function handleMoveSection(
    sectionId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    const currentIndex = sections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentSection = sections[currentIndex];
    const targetSection = sections[targetIndex];
    if (!currentSection || !targetSection) {
      return;
    }
    try {
      onProjectUpdated(
        await reorderSections(project.id, {
          sections: [
            { sectionId: currentSection.id, position: targetSection.position },
            { sectionId: targetSection.id, position: currentSection.position },
          ],
        }),
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo reordenar la sección';
      toast.error(message);
    }
  }

  async function handleCreateSection(name: string): Promise<void> {
    try {
      onProjectUpdated(await createSection(project.id, { name }));
      toast.success('Sección creada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la sección';
      toast.error(message);
      throw error;
    }
  }

  function getSectionMeta(sectionId: string): {
    canDelete: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
  } {
    const index = sections.findIndex((section) => section.id === sectionId);
    return {
      canDelete: sections.length > 1,
      canMoveUp: index > 0,
      canMoveDown: index >= 0 && index < sections.length - 1,
    };
  }

  return {
    sections,
    handleRenameSection,
    handleDeleteSection,
    handleMoveSection,
    createSection: handleCreateSection,
    getSectionMeta,
  };
}
