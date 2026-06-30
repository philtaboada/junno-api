import type { InboxEventDto, MarkAllInboxEventsReadResponseDto } from '@pm/contracts';
import { apiRequest } from '@/lib/api/client';

export async function fetchInboxUnreadCount(): Promise<number> {
  const result = await apiRequest<{ count: number }>('/inbox/unread-count', {
    method: 'GET',
  });
  return result.count;
}

export async function fetchInboxEvents(): Promise<InboxEventDto[]> {
  return apiRequest<InboxEventDto[]>('/inbox/events', {
    method: 'GET',
  });
}

export async function markInboxEventRead(eventId: string): Promise<InboxEventDto> {
  return apiRequest<InboxEventDto>(`/inbox/events/${eventId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllInboxEventsRead(): Promise<MarkAllInboxEventsReadResponseDto> {
  return apiRequest<MarkAllInboxEventsReadResponseDto>('/inbox/events/read-all', {
    method: 'POST',
  });
}
