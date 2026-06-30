'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetailDto, ProjectSectionDto, TaskSummaryDto } from '@pm/contracts';
import { ProjectSectionHeader } from '@/features/projects/components/project-section-header';
import { CustomFieldBoardBadges } from '@/features/tasks/components/custom-field-board-badges';
import { TaskBlockedBadge } from '@/features/tasks/components/task-blocked-badge';
import { useCollapsedSections } from '@/features/projects/hooks/use-collapsed-sections';
import { useProjectSectionActions } from '@/features/projects/hooks/use-project-section-actions';
import { groupTasksBySection } from '@/features/tasks/lib/group-tasks-by-section';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import {
  dueDateToneClassName,
  formatTaskDateRange,
} from '@/features/tasks/lib/format-due-date';
import { ApiError, createProjectTask, reorderProjectTasks } from '@/lib/api/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProjectTasksBoardViewProps = {
  project: ProjectDetailDto;
  tasks: TaskSummaryDto[];
  canEdit: boolean;
  onTasksChange: (tasks: TaskSummaryDto[]) => void;
  onProjectUpdated: (project: ProjectDetailDto) => void;
  onOpenTask: (taskId: string) => void;
};

type BoardColumnProps = {
  section: ProjectSectionDto;
  tasks: TaskSummaryDto[];
  customFields: ProjectDetailDto['customFields'];
  memberNamesById: ReadonlyMap<string, string>;
  canEdit: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRenameSection: (sectionId: string, name: string) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onMoveSectionUp: (sectionId: string) => Promise<void>;
  onMoveSectionDown: (sectionId: string) => Promise<void>;
  onOpenTask: (taskId: string) => void;
  onDropTask: (taskId: string, targetSectionId: string, targetIndex: number) => void;
  onAddTask: (sectionId: string, name: string) => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

function BoardColumn({
  section,
  tasks,
  customFields,
  memberNamesById,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  onRenameSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onOpenTask,
  onDropTask,
  onAddTask,
  isCollapsed,
  onToggleCollapse,
}: BoardColumnProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  function handleDragOver(event: React.DragEvent, index: number): void {
    event.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(event: React.DragEvent, index: number): void {
    event.preventDefault();
    setDragOverIndex(null);
    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId) {
      return;
    }
    onDropTask(taskId, section.id, index);
  }

  async function handleCreateTask(): Promise<void> {
    const trimmedName = newTaskName.trim();
    if (trimmedName.length < 1) {
      toast.error('Escribe un nombre para la tarea');
      return;
    }
    setIsCreating(true);
    try {
      await onAddTask(section.id, trimmedName);
      setNewTaskName('');
      setIsAdding(false);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section
      className="flex w-72 shrink-0 flex-col rounded-xl border border-border/80 bg-muted/20"
      onDragOver={(event) => {
        event.preventDefault();
        setDragOverIndex(tasks.length);
      }}
      onDrop={(event) => handleDrop(event, tasks.length)}
      onDragLeave={() => setDragOverIndex(null)}
    >
      <div className="border-b border-border/70 px-3 py-2.5">
        <ProjectSectionHeader
          key={`${section.id}:${section.name}`}
          section={section}
          canEdit={canEdit}
          canDelete={canDelete}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          isCollapsed={isCollapsed}
          taskCount={tasks.length}
          onToggleCollapse={onToggleCollapse}
          onRename={onRenameSection}
          onDelete={onDeleteSection}
          onMoveUp={onMoveSectionUp}
          onMoveDown={onMoveSectionDown}
        />
      </div>
      {!isCollapsed ? (
      <div className="flex flex-1 flex-col gap-2 p-2">
        {tasks.map((task, index) => {
          const dateRange = formatTaskDateRange(task.startAt, task.dueAt, task.completedAt);
          const isCompleted = task.completedAt !== null;
          return (
            <div
              key={task.id}
              draggable={canEdit}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/task-id', task.id);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={(event) => handleDrop(event, index)}
              className={cn(
                'rounded-lg border border-border/70 bg-card p-3 shadow-none transition-colors',
                dragOverIndex === index && 'border-brand-indigo ring-2 ring-brand-indigo/20',
                canEdit && 'cursor-grab active:cursor-grabbing',
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className={cn(
                    'min-w-0 flex-1 text-left text-sm font-medium',
                    isCompleted && 'text-muted-foreground line-through',
                    !isCompleted && 'hover:text-brand-indigo',
                  )}
                  onClick={() => onOpenTask(task.id)}
                >
                  {task.name}
                </button>
                <TaskBlockedBadge isBlocked={task.isBlocked} className="mt-0.5" />
              </div>
              {dateRange ? (
                <p
                  className={cn(
                    'mt-2 text-xs font-medium',
                    dueDateToneClassName(dateRange.tone),
                  )}
                >
                  {dateRange.label}
                </p>
              ) : null}
              <CustomFieldBoardBadges
                task={task}
                customFields={customFields}
                memberNamesById={memberNamesById}
              />
            </div>
          );
        })}
        {dragOverIndex === tasks.length ? (
          <div className="h-2 rounded-full bg-brand-indigo/30" />
        ) : null}
        {canEdit ? (
          isAdding ? (
            <form
              className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 p-2"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateTask();
              }}
            >
              <Input
                value={newTaskName}
                onChange={(event) => setNewTaskName(event.target.value)}
                placeholder="Nueva tarea"
                disabled={isCreating}
                autoFocus
                className="h-8"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isCreating}>
                  Añadir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    setIsAdding(false);
                    setNewTaskName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start text-brand-indigo"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4" />
              Añadir tarea
            </Button>
          )
        ) : null}
      </div>
      ) : null}
    </section>
  );
}

function buildReorderUpdates(
  tasks: TaskSummaryDto[],
  taskId: string,
  targetSectionId: string,
  targetIndex: number,
): { nextTasks: TaskSummaryDto[]; updates: { taskId: string; sectionId: string; position: number }[] } {
  const movedTask = tasks.find((task) => task.id === taskId);
  if (!movedTask) {
    return { nextTasks: tasks, updates: [] };
  }
  const sourceSectionId = movedTask.sectionId;
  const sourceTasks = tasks
    .filter((task) => task.sectionId === sourceSectionId && task.id !== taskId)
    .sort((left, right) => left.position - right.position);
  const targetTasks = tasks
    .filter((task) => task.sectionId === targetSectionId && task.id !== taskId)
    .sort((left, right) => left.position - right.position);
  targetTasks.splice(targetIndex, 0, {
    ...movedTask,
    sectionId: targetSectionId,
  });
  const nextSourceTasks = sourceSectionId === targetSectionId
    ? targetTasks
    : sourceTasks;
  const updates: { taskId: string; sectionId: string; position: number }[] = [];
  nextSourceTasks.forEach((task, index) => {
    updates.push({
      taskId: task.id,
      sectionId: task.sectionId ?? targetSectionId,
      position: index,
    });
  });
  if (sourceSectionId !== targetSectionId) {
    sourceTasks.forEach((task, index) => {
      updates.push({
        taskId: task.id,
        sectionId: sourceSectionId ?? targetSectionId,
        position: index,
      });
    });
  }
  const updatesByTaskId = new Map(updates.map((update) => [update.taskId, update]));
  const nextTasks = tasks.map((task) => {
    const update = updatesByTaskId.get(task.id);
    if (!update) {
      return task;
    }
    return {
      ...task,
      sectionId: update.sectionId,
      position: update.position,
    };
  });
  return { nextTasks, updates };
}

export function ProjectTasksBoardView({
  project,
  tasks,
  canEdit,
  onTasksChange,
  onProjectUpdated,
  onOpenTask,
}: ProjectTasksBoardViewProps) {
  const {
    sections,
    handleRenameSection,
    handleDeleteSection,
    handleMoveSection,
    createSection,
    getSectionMeta,
  } = useProjectSectionActions(project, onProjectUpdated);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const { isSectionCollapsed, toggleSectionCollapsed } = useCollapsedSections(project.id);
  const memberNamesById = useMemo(
    () => new Map(project.members.map((member) => [member.userId, member.name])),
    [project.members],
  );
  const groups = groupTasksBySection(sections, tasks).filter(
    (group) => group.sectionId !== null,
  );

  async function handleAddTask(sectionId: string, name: string): Promise<void> {
    try {
      const created = await createProjectTask(project.id, {
        name,
        sectionId,
      });
      onTasksChange([...tasks, toTaskSummary(created)]);
      toast.success('Tarea creada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la tarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleDropTask(
    taskId: string,
    targetSectionId: string,
    targetIndex: number,
  ): Promise<void> {
    if (!canEdit) {
      return;
    }
    const { nextTasks, updates } = buildReorderUpdates(
      tasks,
      taskId,
      targetSectionId,
      targetIndex,
    );
    if (updates.length === 0) {
      return;
    }
    onTasksChange(nextTasks);
    try {
      const result = await reorderProjectTasks(project.id, { tasks: updates });
      onTasksChange(result.tasks);
    } catch (error) {
      onTasksChange(tasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo mover la tarea';
      toast.error(message);
    }
  }

  async function handleCreateSection(): Promise<void> {
    const trimmedName = newSectionName.trim();
    if (trimmedName.length < 1) {
      toast.error('Escribe un nombre para la sección');
      return;
    }
    setIsCreatingSection(true);
    try {
      await createSection(trimmedName);
      setNewSectionName('');
      setIsAddingSection(false);
    } finally {
      setIsCreatingSection(false);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groups.map((group) => {
        const section = sections.find((item) => item.id === group.sectionId);
        if (!section) {
          return null;
        }
        const meta = getSectionMeta(section.id);
        return (
          <BoardColumn
            key={section.id}
            section={section}
            tasks={group.tasks}
            customFields={project.customFields}
            memberNamesById={memberNamesById}
            canEdit={canEdit}
            canDelete={canEdit && meta.canDelete}
            canMoveUp={canEdit && meta.canMoveUp}
            canMoveDown={canEdit && meta.canMoveDown}
            onRenameSection={handleRenameSection}
            onDeleteSection={handleDeleteSection}
            onMoveSectionUp={(sectionId) => handleMoveSection(sectionId, 'up')}
            onMoveSectionDown={(sectionId) => handleMoveSection(sectionId, 'down')}
            onOpenTask={onOpenTask}
            onDropTask={(taskId, sectionId, index) => {
              void handleDropTask(taskId, sectionId, index);
            }}
            onAddTask={handleAddTask}
            isCollapsed={isSectionCollapsed(section.id)}
            onToggleCollapse={() => toggleSectionCollapsed(section.id)}
          />
        );
      })}
      {canEdit ? (
        isAddingSection ? (
          <section className="flex w-72 shrink-0 flex-col rounded-xl border border-dashed border-border/80 bg-muted/10 p-4">
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateSection();
              }}
            >
              <Input
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                placeholder="Nombre de la nueva sección"
                disabled={isCreatingSection}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isCreatingSection}>
                  {isCreatingSection ? 'Creando…' : 'Añadir'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isCreatingSection}
                  onClick={() => {
                    setIsAddingSection(false);
                    setNewSectionName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-auto w-72 shrink-0 justify-start gap-2 rounded-xl border-dashed px-4 py-3 text-brand-indigo"
            onClick={() => setIsAddingSection(true)}
          >
            <Plus className="size-4" />
            Añadir sección
          </Button>
        )
      ) : null}
    </div>
  );
}
