'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type {
  ProjectDetailDto,
  ProjectTaskDependencyEdgeDto,
  TaskSummaryDto,
} from '@pm/contracts';
import { TaskBlockedBadge } from '@/features/tasks/components/task-blocked-badge';
import { groupTasksBySection } from '@/features/tasks/lib/group-tasks-by-section';
import { toTaskSummary } from '@/features/tasks/lib/task-summary';
import {
  buildTimelineDays,
  formatTimelineDayLabel,
  formatTimelineRangeTitle,
  getTaskTimelineBar,
  shiftTaskDatesByDays,
  shiftTimelineRange,
  startOfLocalWeek,
  TIMELINE_DAY_WIDTH,
  TIMELINE_DEFAULT_DAY_COUNT,
  TIMELINE_HEADER_HEIGHT,
  TIMELINE_LABEL_WIDTH,
  TIMELINE_ROW_HEIGHT,
} from '@/features/tasks/lib/timeline-utils';
import { getProjectColorSwatchClassName } from '@/features/projects/lib/project-color';
import { ApiError, updateTask } from '@/lib/api/tasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimelineRow =
  | { type: 'section'; key: string; name: string; visualRow: number }
  | { type: 'task'; key: string; task: TaskSummaryDto; visualRow: number };

type ProjectTasksTimelineViewProps = {
  project: ProjectDetailDto;
  tasks: TaskSummaryDto[];
  dependencies: ProjectTaskDependencyEdgeDto[];
  canEdit: boolean;
  onTasksChange: React.Dispatch<React.SetStateAction<TaskSummaryDto[]>>;
  onOpenTask: (taskId: string) => void;
};

type DragState = {
  taskId: string;
  startClientX: number;
  deltaDays: number;
};

export function ProjectTasksTimelineView({
  project,
  tasks,
  dependencies,
  canEdit,
  onTasksChange,
  onOpenTask,
}: ProjectTasksTimelineViewProps) {
  const [rangeStart, setRangeStart] = useState(() => startOfLocalWeek(new Date()));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const pendingDragRef = useRef<DragState | null>(null);
  const dayCount = TIMELINE_DEFAULT_DAY_COUNT;
  const timelineDays = useMemo(
    () => buildTimelineDays(rangeStart, dayCount),
    [rangeStart, dayCount],
  );
  const sectionGroups = useMemo(
    () => groupTasksBySection(project.sections, tasks),
    [project.sections, tasks],
  );
  const rows = useMemo(() => {
    const nextRows: TimelineRow[] = [];
    let visualRow = 0;
    for (const group of sectionGroups) {
      nextRows.push({
        type: 'section',
        key: `section-${group.sectionId ?? 'none'}`,
        name: group.sectionName,
        visualRow,
      });
      visualRow += 1;
      for (const task of group.tasks) {
        if (task.parentTaskId) {
          continue;
        }
        nextRows.push({
          type: 'task',
          key: task.id,
          task,
          visualRow,
        });
        visualRow += 1;
      }
    }
    return nextRows;
  }, [sectionGroups]);
  const taskRowById = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.type === 'task') {
        map.set(row.task.id, row.visualRow);
      }
    }
    return map;
  }, [rows]);
  const barByTaskId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getTaskTimelineBar>>();
    for (const row of rows) {
      if (row.type !== 'task') {
        continue;
      }
      map.set(row.task.id, getTaskTimelineBar(row.task, rangeStart, dayCount));
    }
    return map;
  }, [rows, rangeStart, dayCount]);
  const dependencyPaths = useMemo(() => {
    const paths: string[] = [];
    for (const edge of dependencies) {
      const predecessorRow = taskRowById.get(edge.predecessorTaskId);
      const successorRow = taskRowById.get(edge.successorTaskId);
      const predecessorBar = barByTaskId.get(edge.predecessorTaskId);
      const successorBar = barByTaskId.get(edge.successorTaskId);
      if (
        predecessorRow === undefined ||
        successorRow === undefined ||
        !predecessorBar ||
        !successorBar
      ) {
        continue;
      }
      const x1 = (predecessorBar.endIndex + 1) * TIMELINE_DAY_WIDTH - 6;
      const y1 = TIMELINE_HEADER_HEIGHT + predecessorRow * TIMELINE_ROW_HEIGHT + TIMELINE_ROW_HEIGHT / 2;
      const x2 = successorBar.startIndex * TIMELINE_DAY_WIDTH + 6;
      const y2 = TIMELINE_HEADER_HEIGHT + successorRow * TIMELINE_ROW_HEIGHT + TIMELINE_ROW_HEIGHT / 2;
      const elbowX = x1 + 14;
      paths.push(`M ${x1} ${y1} H ${elbowX} V ${y2} H ${x2}`);
    }
    return paths;
  }, [dependencies, taskRowById, barByTaskId]);
  const gridWidth = dayCount * TIMELINE_DAY_WIDTH;
  const gridHeight = TIMELINE_HEADER_HEIGHT + rows.length * TIMELINE_ROW_HEIGHT;

  async function persistTaskDates(
    taskId: string,
    range: { startAt: string | null; dueAt: string | null },
  ): Promise<void> {
    const previousTasks = tasks;
    onTasksChange(
      tasks.map((item) =>
        item.id === taskId ? { ...item, startAt: range.startAt, dueAt: range.dueAt } : item,
      ),
    );
    try {
      const updated = await updateTask(taskId, range);
      onTasksChange((current) =>
        (current ?? []).map((item) => (item.id === taskId ? toTaskSummary(updated) : item)),
      );
    } catch (error) {
      onTasksChange(previousTasks);
      const message =
        error instanceof ApiError ? error.message : 'No se pudo mover la tarea';
      toast.error(message);
    }
  }

  function handleBarPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    task: TaskSummaryDto,
  ): void {
    if (!canEdit) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const nextDrag: DragState = {
      taskId: task.id,
      startClientX: event.clientX,
      deltaDays: 0,
    };
    pendingDragRef.current = nextDrag;
    setDragState(nextDrag);
  }

  function handleBarPointerMove(event: React.PointerEvent<HTMLButtonElement>): void {
    const currentDrag = pendingDragRef.current;
    if (!currentDrag) {
      return;
    }
    const deltaPx = event.clientX - currentDrag.startClientX;
    const deltaDays = Math.round(deltaPx / TIMELINE_DAY_WIDTH);
    if (deltaDays === currentDrag.deltaDays) {
      return;
    }
    const nextDrag = { ...currentDrag, deltaDays };
    pendingDragRef.current = nextDrag;
    setDragState(nextDrag);
  }

  async function handleBarPointerUp(event: React.PointerEvent<HTMLButtonElement>): Promise<void> {
    const currentDrag = pendingDragRef.current;
    if (!currentDrag) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    pendingDragRef.current = null;
    setDragState(null);
    if (currentDrag.deltaDays === 0) {
      onOpenTask(currentDrag.taskId);
      return;
    }
    const task = tasks.find((item) => item.id === currentDrag.taskId);
    if (!task) {
      return;
    }
    await persistTaskDates(task.id, shiftTaskDatesByDays(task, currentDrag.deltaDays));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium capitalize text-foreground">
          {formatTimelineRangeTitle(rangeStart, dayCount)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Semanas anteriores"
            onClick={() => setRangeStart((current) => shiftTimelineRange(current, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRangeStart(startOfLocalWeek(new Date()))}
          >
            Hoy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Semanas siguientes"
            onClick={() => setRangeStart((current) => shiftTimelineRange(current, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card">
        <div className="flex min-w-max">
          <div
            className="sticky left-0 z-20 shrink-0 border-r border-border/80 bg-card"
            style={{ width: TIMELINE_LABEL_WIDTH }}
          >
            <div
              className="flex items-end border-b border-border/80 px-4 pb-2 text-xs font-medium text-muted-foreground"
              style={{ height: TIMELINE_HEADER_HEIGHT }}
            >
              Tarea
            </div>
            {rows.map((row) =>
              row.type === 'section' ? (
                <div
                  key={row.key}
                  className="flex items-center border-b border-border/50 bg-muted/30 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ height: TIMELINE_ROW_HEIGHT }}
                >
                  {row.name}
                </div>
              ) : (
                <div
                  key={row.key}
                  className="flex items-center gap-2 border-b border-border/40 px-4"
                  style={{ height: TIMELINE_ROW_HEIGHT }}
                >
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-sm',
                      getProjectColorSwatchClassName(project.color),
                    )}
                  />
                  <button
                    type="button"
                    className={cn(
                      'min-w-0 flex-1 truncate text-left text-sm hover:text-brand-indigo',
                      row.task.completedAt !== null &&
                        'text-muted-foreground line-through',
                    )}
                    onClick={() => onOpenTask(row.task.id)}
                  >
                    {row.task.name}
                  </button>
                  <TaskBlockedBadge isBlocked={row.task.isBlocked} />
                </div>
              ),
            )}
          </div>
          <div className="relative shrink-0" style={{ width: gridWidth, height: gridHeight }}>
            <div
              className="grid border-b border-border/80"
              style={{
                height: TIMELINE_HEADER_HEIGHT,
                gridTemplateColumns: `repeat(${dayCount}, ${TIMELINE_DAY_WIDTH}px)`,
              }}
            >
              {timelineDays.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={cn(
                    'flex flex-col items-center justify-end border-r border-border/40 pb-1 text-[10px]',
                    day.isWeekend && 'bg-muted/20',
                    day.isToday && 'bg-brand-indigo-muted/40',
                  )}
                >
                  <span className="text-muted-foreground">{formatTimelineDayLabel(day.date)}</span>
                </div>
              ))}
            </div>
            {rows.map((row) =>
              row.type === 'section' ? (
                <div
                  key={`grid-${row.key}`}
                  className="border-b border-border/50 bg-muted/20"
                  style={{ height: TIMELINE_ROW_HEIGHT }}
                />
              ) : (
                <div
                  key={`grid-${row.key}`}
                  className="relative border-b border-border/40"
                  style={{ height: TIMELINE_ROW_HEIGHT }}
                >
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${dayCount}, ${TIMELINE_DAY_WIDTH}px)`,
                    }}
                  >
                    {timelineDays.map((day) => (
                      <div
                        key={`${row.key}-${day.date.toISOString()}`}
                        className={cn(
                          'border-r border-border/30',
                          day.isWeekend && 'bg-muted/10',
                          day.isToday && 'bg-brand-indigo-muted/20',
                        )}
                      />
                    ))}
                  </div>
                  {(() => {
                    const baseBar = barByTaskId.get(row.task.id);
                    const previewDelta =
                      dragState?.taskId === row.task.id ? dragState.deltaDays : 0;
                    const bar =
                      baseBar && previewDelta !== 0
                        ? getTaskTimelineBar(
                            {
                              ...row.task,
                              ...shiftTaskDatesByDays(row.task, previewDelta),
                            },
                            rangeStart,
                            dayCount,
                          )
                        : baseBar;
                    if (!bar) {
                      return null;
                    }
                    const left = bar.startIndex * TIMELINE_DAY_WIDTH + 4;
                    const width =
                      (bar.endIndex - bar.startIndex + 1) * TIMELINE_DAY_WIDTH - 8;
                    const isCompleted = row.task.completedAt !== null;
                    return (
                      <button
                        type="button"
                        className={cn(
                          'absolute top-1/2 z-10 h-6 -translate-y-1/2 rounded-md px-2 text-left text-[11px] font-medium text-white shadow-sm',
                          getProjectColorSwatchClassName(project.color),
                          isCompleted && 'opacity-50',
                          canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                          dragState?.taskId === row.task.id && 'ring-2 ring-brand-indigo/40',
                        )}
                        style={{ left, width: Math.max(width, 12) }}
                        title={canEdit ? 'Arrastra para mover · Clic para abrir' : row.task.name}
                        onPointerDown={(event) => handleBarPointerDown(event, row.task)}
                        onPointerMove={handleBarPointerMove}
                        onPointerUp={(event) => void handleBarPointerUp(event)}
                      >
                        <span className="block truncate">{row.task.name}</span>
                      </button>
                    );
                  })()}
                </div>
              ),
            )}
            {dependencyPaths.length > 0 ? (
              <svg
                className="pointer-events-none absolute inset-0 z-[5]"
                width={gridWidth}
                height={gridHeight}
              >
                {dependencyPaths.map((path, index) => (
                  <path
                    key={`dep-${index}`}
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-muted-foreground/70"
                    markerEnd="url(#timeline-arrow)"
                  />
                ))}
                <defs>
                  <marker
                    id="timeline-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" className="fill-muted-foreground/70" />
                  </marker>
                </defs>
              </svg>
            ) : null}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Las tareas sin fechas no muestran barra. Arrastra una barra para reprogramar (editor+).
      </p>
    </div>
  );
}
