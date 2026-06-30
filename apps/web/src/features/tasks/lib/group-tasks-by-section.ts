import type { ProjectSectionDto, TaskSummaryDto } from '@pm/contracts';

export type TaskSectionGroup = {
  readonly sectionId: string | null;
  readonly sectionName: string;
  readonly tasks: TaskSummaryDto[];
};

export function groupTasksBySection(
  sections: ProjectSectionDto[],
  tasks: TaskSummaryDto[],
): TaskSectionGroup[] {
  const sortedSections = [...sections].sort(
    (left, right) => left.position - right.position,
  );
  const sectionIds = new Set(sortedSections.map((section) => section.id));
  const groups: TaskSectionGroup[] = sortedSections.map((section) => ({
    sectionId: section.id,
    sectionName: section.name,
    tasks: tasks
      .filter((task) => task.sectionId === section.id)
      .sort((left, right) => left.position - right.position),
  }));
  const unsectionedTasks = tasks
    .filter((task) => !task.sectionId || !sectionIds.has(task.sectionId))
    .sort((left, right) => left.position - right.position);
  if (unsectionedTasks.length > 0) {
    groups.push({
      sectionId: null,
      sectionName: 'Sin sección',
      tasks: unsectionedTasks,
    });
  }
  return groups;
}
