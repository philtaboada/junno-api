import type { InboxEventDto } from '@pm/contracts';

export const INBOX_UPDATED_EVENT = 'inbox:updated';

export function notifyInboxUpdated(): void {
  window.dispatchEvent(new CustomEvent(INBOX_UPDATED_EVENT));
}

export type InboxEventPresentation = {
  readonly title: string;
  readonly subtitle: string | null;
  readonly taskId: string | null;
  readonly projectId: string | null;
  readonly teamId: string | null;
};

function readString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getInboxEventPresentation(event: InboxEventDto): InboxEventPresentation {
  const actor = event.actorName ?? 'Alguien';
  const taskName = readString(event.payload, 'taskName');
  const projectName = readString(event.payload, 'projectName');
  const teamName = readString(event.payload, 'teamName');
  const memberName = readString(event.payload, 'memberName');
  const commentPreview = readString(event.payload, 'commentPreview');
  const taskId = readString(event.payload, 'taskId');
  const projectId = readString(event.payload, 'projectId');
  const teamId = readString(event.payload, 'teamId');

  switch (event.type) {
    case 'team_member_joined':
      return {
        title: `${memberName ?? 'Un miembro'} se unió a ${teamName ?? 'un equipo'}`,
        subtitle: actor !== memberName ? `Notificado por ${actor}` : null,
        taskId: null,
        projectId: null,
        teamId,
      };
    case 'task_assigned':
      return {
        title: `${actor} te asignó «${taskName ?? 'una tarea'}»`,
        subtitle: projectName,
        taskId,
        projectId,
        teamId: null,
      };
    case 'task_comment_added':
      return {
        title: `${actor} comentó en «${taskName ?? 'una tarea'}»`,
        subtitle: commentPreview,
        taskId,
        projectId,
        teamId: null,
      };
    case 'task_completed':
      return {
        title: `${actor} completó «${taskName ?? 'una tarea'}»`,
        subtitle: projectName,
        taskId,
        projectId,
        teamId: null,
      };
    case 'task_due_changed':
      return {
        title: `${actor} cambió la fecha de «${taskName ?? 'una tarea'}»`,
        subtitle: projectName,
        taskId,
        projectId,
        teamId: null,
      };
    case 'task_added_to_project':
      return {
        title: `${actor} añadió «${taskName ?? 'una tarea'}» a ${projectName ?? 'un proyecto'}`,
        subtitle: null,
        taskId,
        projectId,
        teamId: null,
      };
    case 'automation_notification': {
      const message = readString(event.payload, 'message');
      const ruleName = readString(event.payload, 'ruleName');
      return {
        title: message ?? 'Notificación de automatización',
        subtitle: ruleName ?? projectName,
        taskId,
        projectId,
        teamId: null,
      };
    }
    default:
      return {
        title: 'Actividad reciente',
        subtitle: null,
        taskId,
        projectId,
        teamId,
      };
  }
}

export function groupInboxEventsByDay(
  events: InboxEventDto[],
): Array<{ readonly label: string; readonly events: InboxEventDto[] }> {
  const groups = new Map<string, InboxEventDto[]>();
  const today = startOfLocalDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const event of events) {
    const eventDate = startOfLocalDay(new Date(event.createdAt));
    let label: string;
    if (eventDate.getTime() === today.getTime()) {
      label = 'Hoy';
    } else if (eventDate.getTime() === yesterday.getTime()) {
      label = 'Ayer';
    } else {
      label = eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    const bucket = groups.get(label) ?? [];
    bucket.push(event);
    groups.set(label, bucket);
  }

  return [...groups.entries()].map(([label, groupedEvents]) => ({
    label,
    events: groupedEvents,
  }));
}

function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}
