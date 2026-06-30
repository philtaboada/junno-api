'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { InboxEventDto, InboxEventType } from '@pm/contracts';
import {
  getInboxEventPresentation,
  groupInboxEventsByDay,
  notifyInboxUpdated,
} from '@/features/inbox/lib/inbox-events';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { useWorkspaceTaskChanged } from '@/hooks/use-workspace-task-changed';
import {
  fetchInboxEvents,
  markAllInboxEventsRead,
  markInboxEventRead,
} from '@/lib/api/inbox';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function getInboxEventIcon(type: InboxEventType): React.ReactNode {
  switch (type) {
    case 'team_member_joined':
      return <Users className="size-4 text-brand-indigo" />;
    case 'task_assigned':
      return <UserPlus className="size-4 text-brand-indigo" />;
    case 'task_comment_added':
      return <MessageSquare className="size-4 text-brand-indigo" />;
    case 'task_completed':
      return <CheckCircle2 className="size-4 text-brand-indigo" />;
    case 'task_due_changed':
      return <CalendarDays className="size-4 text-brand-indigo" />;
    case 'task_added_to_project':
      return <FolderKanban className="size-4 text-brand-indigo" />;
    case 'automation_notification':
      return <Zap className="size-4 text-brand-indigo" />;
    default:
      return <MessageSquare className="size-4 text-brand-indigo" />;
  }
}

function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InboxView() {
  const activeWorkspace = useActiveWorkspace();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const {
    data: events,
    error: loadError,
    isLoading,
    setData: setEvents,
    reload: reloadEvents,
  } = useAsyncResource([], () => fetchInboxEvents(), () => 'No se pudo cargar la bandeja');

  useWorkspaceTaskChanged(activeWorkspace?.id, () => {
    reloadEvents();
  });

  const groupedEvents = groupInboxEventsByDay(events ?? []);
  const unreadCount = (events ?? []).filter((event) => !event.isRead).length;

  async function handleOpenEvent(event: InboxEventDto): Promise<void> {
    const presentation = getInboxEventPresentation(event);
    if (!event.isRead) {
      setEvents((current) =>
        (current ?? []).map((item) =>
          item.id === event.id ? { ...item, isRead: true } : item,
        ),
      );
      try {
        await markInboxEventRead(event.id);
        notifyInboxUpdated();
      } catch {
        reloadEvents();
      }
    }
    if (presentation.taskId) {
      setSelectedTaskId(presentation.taskId);
      setIsSheetOpen(true);
    }
  }

  async function handleMarkAllRead(): Promise<void> {
    setIsMarkingAll(true);
    try {
      await markAllInboxEventsRead();
      setEvents((current) =>
        (current ?? []).map((event) => ({ ...event, isRead: true })),
      );
      notifyInboxUpdated();
      toast.success('Bandeja marcada como leída');
    } catch {
      toast.error('No se pudo marcar todo como leído');
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : 'Estás al día con tu bandeja'}
          </p>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMarkingAll}
              onClick={() => void handleMarkAllRead()}
            >
              {isMarkingAll ? 'Marcando…' : 'Marcar todo leído'}
            </Button>
          ) : null}
        </div>
        {(events ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Bandeja vacía</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Aquí verás asignaciones, comentarios y actividad del equipo.
            </p>
          </div>
        ) : (
          groupedEvents.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
                {group.events.map((event) => {
                  const presentation = getInboxEventPresentation(event);
                  const content = (
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                        {getInboxEventIcon(event.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            !event.isRead && 'font-medium text-foreground',
                            event.isRead && 'text-foreground/90',
                          )}
                        >
                          {presentation.title}
                        </p>
                        {presentation.subtitle ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {presentation.subtitle}
                          </p>
                        ) : null}
                        <time className="mt-1 block text-xs text-muted-foreground">
                          {formatEventTime(event.createdAt)}
                        </time>
                      </div>
                      {!event.isRead ? (
                        <span
                          className="mt-2 size-2 shrink-0 rounded-full bg-brand-coral"
                          aria-label="No leído"
                        />
                      ) : null}
                    </div>
                  );
                  return (
                    <div
                      key={event.id}
                      className="border-b border-border/60 last:border-b-0"
                    >
                      {presentation.taskId ? (
                        <button
                          type="button"
                          className="flex w-full px-4 py-3 text-left transition-colors hover:bg-muted/30"
                          onClick={() => void handleOpenEvent(event)}
                        >
                          {content}
                        </button>
                      ) : presentation.teamId ? (
                        <Link
                          href={`/teams/${presentation.teamId}`}
                          className="flex w-full px-4 py-3 transition-colors hover:bg-muted/30"
                          onClick={() => {
                            if (!event.isRead) {
                              void handleOpenEvent(event);
                            }
                          }}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex px-4 py-3">{content}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        canEdit={false}
        canComment={false}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedTaskId(null);
          }
        }}
        onTaskUpdated={() => {
          reloadEvents();
        }}
        onTaskDeleted={() => {
          reloadEvents();
        }}
      />
    </>
  );
}
