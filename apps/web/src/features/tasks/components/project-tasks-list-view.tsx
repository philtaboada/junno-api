'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CustomFieldSettingsDto,
  CustomFieldType,
  CustomFieldValueDto,
  ProjectDetailDto,
  ProjectSectionDto,
  TaskSummaryDto,
} from '@pm/contracts';
import { ProjectSectionHeader } from '@/features/projects/components/project-section-header';
import { useProjectSectionActions } from '@/features/projects/hooks/use-project-section-actions';
import { useCollapsedSections } from '@/features/projects/hooks/use-collapsed-sections';
import { EditCustomFieldDialog } from '@/features/tasks/components/custom-field-dialogs';
import { InlineAddTaskRow } from '@/features/tasks/components/inline-add-task-row';
import { ListColumnsSettingsMenu } from '@/features/tasks/components/list-columns-settings-menu';
import { TaskListTaskGroup } from '@/features/tasks/components/task-list-task-group';
import { TaskListColumnHeaders } from '@/features/tasks/components/task-list-column-headers';
import { groupTasksBySection } from '@/features/tasks/lib/group-tasks-by-section';
import { FALLBACK_LIST_COLUMNS } from '@/features/tasks/lib/list-column-registry';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import {
  appendSubtask,
  createOptimisticTaskSummary,
  mapTaskOrSubtask,
  mergeTaskInList,
} from '@/features/tasks/lib/task-list-mutations';
import { ApiError, createProjectTask, updateTask } from '@/lib/api/tasks';
import {
  createProjectCustomField,
  deleteProjectCustomField,
  updateProjectCustomField,
  updateProjectListColumns,
} from '@/lib/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProjectTasksListViewProps = {
  project: ProjectDetailDto;
  tasks: TaskSummaryDto[];
  canEdit: boolean;
  onTasksChange: (tasks: TaskSummaryDto[]) => void;
  onProjectUpdated: (project: ProjectDetailDto) => void;
  onOpenTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
};

type SectionBlockProps = {
  section: ProjectSectionDto;
  tasks: TaskSummaryDto[];
  project: ProjectDetailDto;
  canEdit: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRenameSection: (sectionId: string, name: string) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onMoveSectionUp: (sectionId: string) => Promise<void>;
  onMoveSectionDown: (sectionId: string) => Promise<void>;
  onOpenTask: (taskId: string) => void;
  onNameChange: (taskId: string, name: string) => Promise<void>;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => Promise<void>;
  onDateRangeChange: (
    taskId: string,
    range: { startAt: string | null; dueAt: string | null },
  ) => Promise<void>;
  onCustomFieldChange: (
    taskId: string,
    fieldId: string,
    value: CustomFieldValueDto | null,
  ) => Promise<void>;
  onAddTask: (sectionId: string, name: string) => Promise<string | void>;
  onAddSubtask: (parentTaskId: string, name: string) => Promise<void>;
  isAddingTask?: boolean;
  onAddingTaskChange?: (adding: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isLastSection: boolean;
};

function SectionBlock({
  section,
  tasks,
  project,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  onRenameSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onOpenTask,
  onNameChange,
  onToggleComplete,
  onAssigneeChange,
  onCustomFieldChange,
  onAddTask,
  onDateRangeChange,
  onAddSubtask,
  isAddingTask = false,
  onAddingTaskChange,
  isCollapsed,
  onToggleCollapse,
  isLastSection,
}: SectionBlockProps) {
  const [isAddingLocal, setIsAddingLocal] = useState(false);
  const isAdding = isAddingTask || isAddingLocal;
  const listColumns =
    project.listColumns.length > 0 ? project.listColumns : FALLBACK_LIST_COLUMNS;

  useEffect(() => {
    if (isAddingTask && isCollapsed) {
      onToggleCollapse();
    }
  }, [isAddingTask, isCollapsed, onToggleCollapse]);

  function handleCancelAdding(): void {
    setIsAddingLocal(false);
    onAddingTaskChange?.(false);
  }

  function handleStartAdding(): void {
    setIsAddingLocal(true);
    if (isCollapsed) {
      onToggleCollapse();
    }
  }

  async function handleInlineAdd(name: string): Promise<string | void> {
    const taskId = await onAddTask(section.id, name);
    setIsAddingLocal(true);
    return taskId;
  }

  return (
    <div className={cn(!isLastSection && 'border-b border-border/70')}>
      <div className="border-b border-border/60 bg-muted/15 px-4 py-2.5">
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
      {!isCollapsed && tasks.length > 0 ? (
        <div>
          {tasks.map((task) => (
            <TaskListTaskGroup
              key={task.id}
              task={task}
              listColumns={listColumns}
              customFields={project.customFields}
              members={project.members}
              canEdit={canEdit}
              showTrailingActions={canEdit}
              onOpen={onOpenTask}
              onNameChange={onNameChange}
              onToggleComplete={onToggleComplete}
              onAssigneeChange={onAssigneeChange}
              onDateRangeChange={onDateRangeChange}
              onCustomFieldChange={onCustomFieldChange}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      ) : !isCollapsed && !isAdding ? (
        <div className="px-4 py-5 text-center text-sm text-muted-foreground">
          No hay tareas en esta sección.
        </div>
      ) : null}
      {!isCollapsed && canEdit ? (
        <div>
          {isAdding ? (
            <InlineAddTaskRow
              listColumns={listColumns}
              customFields={project.customFields}
              showTrailingActions={canEdit}
              onAdd={handleInlineAdd}
              onOpenTask={onOpenTask}
              onCancel={handleCancelAdding}
            />
          ) : (
            <div className="border-t border-border/40 px-4 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-brand-indigo"
                onClick={handleStartAdding}
              >
                <Plus className="size-4" />
                Añadir tarea
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectTasksListView({
  project,
  tasks,
  canEdit,
  onTasksChange,
  onProjectUpdated,
  onOpenTask,
  onToggleComplete,
}: ProjectTasksListViewProps) {
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
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isSavingField, setIsSavingField] = useState(false);
  const [addingTaskSectionId, setAddingTaskSectionId] = useState<string | null>(null);
  const { isSectionCollapsed, toggleSectionCollapsed } = useCollapsedSections(project.id);
  const sectionGroups = groupTasksBySection(sections, tasks).filter(
    (group) => group.sectionId !== null,
  );
  const listColumns =
    project.listColumns.length > 0 ? project.listColumns : FALLBACK_LIST_COLUMNS;

  function updateTaskInList(taskId: string, nextTask: TaskSummaryDto): void {
    onTasksChange(mergeTaskInList(tasks, taskId, nextTask));
  }

  async function handleNameChange(taskId: string, name: string): Promise<void> {
    const previousTasks = tasks;
    onTasksChange(
      mapTaskOrSubtask(tasks, taskId, (task) => ({ ...task, name })),
    );
    try {
      const updated = await updateTask(taskId, { name });
      updateTaskInList(taskId, toTaskSummary(updated));
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo renombrar la tarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleAssigneeChange(
    taskId: string,
    assigneeId: string | null,
  ): Promise<void> {
    const previousTasks = tasks;
    const member = assigneeId
      ? project.members.find((item) => item.userId === assigneeId)
      : null;
    onTasksChange(
      mapTaskOrSubtask(tasks, taskId, (task) => ({
        ...task,
        assignee: member
          ? {
              userId: member.userId,
              name: member.name,
              email: member.email,
            }
          : null,
      })),
    );
    try {
      const updated = await updateTask(taskId, { assigneeId });
      updateTaskInList(taskId, toTaskSummary(updated));
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo asignar la tarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleDateRangeChange(
    taskId: string,
    range: { startAt: string | null; dueAt: string | null },
  ): Promise<void> {
    const previousTasks = tasks;
    onTasksChange(
      mapTaskOrSubtask(tasks, taskId, (task) => ({
        ...task,
        startAt: range.startAt,
        dueAt: range.dueAt,
      })),
    );
    try {
      const updated = await updateTask(taskId, {
        startAt: range.startAt,
        dueAt: range.dueAt,
      });
      updateTaskInList(taskId, toTaskSummary(updated));
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la fecha';
      toast.error(message);
      throw error;
    }
  }

  async function handleCustomFieldChange(
    taskId: string,
    fieldId: string,
    value: CustomFieldValueDto | null,
  ): Promise<void> {
    const previousTasks = tasks;
    onTasksChange(
      mapTaskOrSubtask(tasks, taskId, (task) => ({
        ...task,
        customFieldValues: {
          ...task.customFieldValues,
          ...(value ? { [fieldId]: value } : {}),
        },
      })),
    );
    try {
      const updated = await updateTask(taskId, {
        customFieldValues: value ? { [fieldId]: value } : { [fieldId]: null },
      });
      updateTaskInList(taskId, toTaskSummary(updated));
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el campo';
      toast.error(message);
      throw error;
    }
  }

  async function handleAddSubtask(parentTaskId: string, name: string): Promise<void> {
    const parentTask = tasks.find((task) => task.id === parentTaskId);
    if (!parentTask) {
      return;
    }
    const optimisticSubtask = createOptimisticTaskSummary({
      name,
      projectId: project.id,
      projectName: project.name,
      sectionId: parentTask.sectionId,
      parentTaskId,
      position: (parentTask.subtasks ?? []).length,
    });
    const previousTasks = tasks;
    const tasksWithOptimistic = appendSubtask(tasks, parentTaskId, optimisticSubtask);
    onTasksChange(tasksWithOptimistic);
    try {
      const created = await createProjectTask(project.id, {
        name,
        parentTaskId,
        sectionId: parentTask.sectionId ?? undefined,
      });
      onTasksChange(
        mapTaskOrSubtask(tasksWithOptimistic, optimisticSubtask.id, () => ({
          ...toTaskSummary(created),
          subtasks: [],
          subtaskCount: 0,
        })),
      );
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la subtarea';
      toast.error(message);
      throw error;
    }
  }

  async function handleCreateCustomField(input: {
    name: string;
    type: CustomFieldType;
    settings: CustomFieldSettingsDto;
  }): Promise<void> {
    setIsCreatingField(true);
    try {
      const updatedProject = await createProjectCustomField(project.id, input);
      onProjectUpdated(updatedProject);
      toast.success('Campo creado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el campo';
      toast.error(message);
      throw error;
    } finally {
      setIsCreatingField(false);
    }
  }

  async function handleSaveCustomField(input: {
    name: string;
    settings: CustomFieldSettingsDto;
  }): Promise<void> {
    if (!editingFieldId) {
      return;
    }
    setIsSavingField(true);
    try {
      const updatedProject = await updateProjectCustomField(
        project.id,
        editingFieldId,
        input,
      );
      onProjectUpdated(updatedProject);
      setEditingFieldId(null);
      toast.success('Campo actualizado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el campo';
      toast.error(message);
      throw error;
    } finally {
      setIsSavingField(false);
    }
  }

  async function handleDeleteCustomField(): Promise<void> {
    if (!editingFieldId) {
      return;
    }
    setIsSavingField(true);
    try {
      const updatedProject = await deleteProjectCustomField(project.id, editingFieldId);
      onProjectUpdated(updatedProject);
      setEditingFieldId(null);
      toast.success('Campo eliminado');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar el campo';
      toast.error(message);
      throw error;
    } finally {
      setIsSavingField(false);
    }
  }

  async function handleSaveListColumns(
    columns: Parameters<typeof updateProjectListColumns>[1]['columns'],
  ): Promise<void> {
    const updatedProject = await updateProjectListColumns(project.id, { columns });
    onProjectUpdated(updatedProject);
  }

  async function handleAddTask(sectionId: string, name: string): Promise<string | void> {
    const optimisticTask = createOptimisticTaskSummary({
      name,
      projectId: project.id,
      projectName: project.name,
      sectionId,
      position: tasks.filter((task) => task.sectionId === sectionId).length,
    });
    const previousTasks = tasks;
    const tasksWithOptimistic = [...tasks, optimisticTask];
    onTasksChange(tasksWithOptimistic);
    try {
      const created = await createProjectTask(project.id, {
        name,
        sectionId,
      });
      onTasksChange(
        mapTaskOrSubtask(tasksWithOptimistic, optimisticTask.id, () => ({
          ...toTaskSummary(created),
          subtasks: [],
          subtaskCount: 0,
        })),
      );
      return created.id;
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la tarea';
      toast.error(message);
      throw error;
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

  function handleStartAddTask(): void {
    const firstSection = sections[0];
    if (!firstSection) {
      toast.error('Crea una sección antes de añadir tareas');
      return;
    }
    setAddingTaskSectionId(firstSection.id);
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleStartAddTask}
          >
            <Plus className="size-3.5 text-brand-indigo" />
            Añadir tarea
          </Button>
          <ListColumnsSettingsMenu
            listColumns={listColumns}
            customFields={project.customFields}
            canEdit={canEdit}
            onSave={handleSaveListColumns}
          />
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-none">
        <div className="w-full min-w-0">
          <TaskListColumnHeaders
            listColumns={listColumns}
            customFields={project.customFields}
            canEdit={canEdit}
            showTrailingActions={canEdit}
            isCreatingField={isCreatingField}
            onAddCustomField={handleCreateCustomField}
            onEditCustomField={setEditingFieldId}
          />
          {sectionGroups.map((group, index) => {
          const section = sections.find((item) => item.id === group.sectionId);
          if (!section) {
            return null;
          }
          const meta = getSectionMeta(section.id);
          return (
            <SectionBlock
              key={section.id}
              section={section}
              tasks={group.tasks}
              project={project}
              canEdit={canEdit}
              canDelete={canEdit && meta.canDelete}
              canMoveUp={canEdit && meta.canMoveUp}
              canMoveDown={canEdit && meta.canMoveDown}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
              onMoveSectionUp={(sectionId) => handleMoveSection(sectionId, 'up')}
              onMoveSectionDown={(sectionId) => handleMoveSection(sectionId, 'down')}
              onOpenTask={onOpenTask}
              onNameChange={handleNameChange}
              onToggleComplete={onToggleComplete}
              onAssigneeChange={handleAssigneeChange}
              onDateRangeChange={handleDateRangeChange}
              onCustomFieldChange={handleCustomFieldChange}
              onAddTask={handleAddTask}
              onAddSubtask={handleAddSubtask}
              isAddingTask={addingTaskSectionId === section.id}
              onAddingTaskChange={(adding) => {
                if (!adding && addingTaskSectionId === section.id) {
                  setAddingTaskSectionId(null);
                }
              }}
              isCollapsed={isSectionCollapsed(section.id)}
              onToggleCollapse={() => toggleSectionCollapsed(section.id)}
              isLastSection={index === sectionGroups.length - 1}
            />
          );
        })}
        </div>
      </div>
      {canEdit ? (
        isAddingSection ? (
          <form
            className="flex flex-col gap-2 rounded-xl border border-dashed border-border/80 p-4 sm:flex-row sm:items-center"
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
              <Button type="submit" disabled={isCreatingSection}>
                {isCreatingSection ? 'Creando…' : 'Añadir'}
              </Button>
              <Button
                type="button"
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
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setIsAddingSection(true)}
          >
            <Plus className="size-4 text-brand-indigo" />
            Añadir sección
          </Button>
        )
      ) : null}
      <EditCustomFieldDialog
        field={
          project.customFields.find((field) => field.id === editingFieldId) ?? null
        }
        open={editingFieldId !== null}
        isSaving={isSavingField}
        onOpenChange={(open) => {
          if (!open) {
            setEditingFieldId(null);
          }
        }}
        onSave={handleSaveCustomField}
        onDelete={handleDeleteCustomField}
      />
    </div>
  );
}
