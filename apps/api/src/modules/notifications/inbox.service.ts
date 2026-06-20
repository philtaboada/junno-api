import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { InboxEventDto, MarkAllInboxEventsReadResponseDto } from '@pm/contracts';
import {
  ActivityEvent,
} from './entities/activity-event.entity';

@Injectable()
export class InboxService {
  constructor(private readonly entityManager: EntityManager) {}

  async listForUser(
    workspaceId: string,
    userId: string,
  ): Promise<InboxEventDto[]> {
    const events = await this.entityManager.find(
      ActivityEvent,
      {
        workspace: workspaceId,
        recipientUser: userId,
      },
      {
        populate: ['actorUser'],
        orderBy: { createdAt: 'DESC' },
        limit: 50,
      },
    );
    return events.map((event) => this.toInboxEvent(event));
  }

  async markEventAsRead(
    workspaceId: string,
    userId: string,
    eventId: string,
  ): Promise<InboxEventDto> {
    const event = await this.entityManager.findOne(
      ActivityEvent,
      {
        id: eventId,
        workspace: workspaceId,
        recipientUser: userId,
      },
      { populate: ['actorUser'] },
    );
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }
    if (!event.readAt) {
      event.readAt = new Date();
      await this.entityManager.flush();
    }
    return this.toInboxEvent(event);
  }

  async markAllEventsAsRead(
    workspaceId: string,
    userId: string,
  ): Promise<MarkAllInboxEventsReadResponseDto> {
    const events = await this.entityManager.find(ActivityEvent, {
      workspace: workspaceId,
      recipientUser: userId,
      readAt: null,
    });
    const now = new Date();
    for (const event of events) {
      event.readAt = now;
    }
    if (events.length > 0) {
      await this.entityManager.flush();
    }
    return { success: true, updatedCount: events.length };
  }

  async countUnreadForUser(workspaceId: string, userId: string): Promise<number> {
    return this.entityManager.count(ActivityEvent, {
      workspace: workspaceId,
      recipientUser: userId,
      readAt: null,
    });
  }

  private toInboxEvent(event: ActivityEvent): InboxEventDto {
    return {
      id: event.id,
      type: event.type as InboxEventDto['type'],
      isRead: event.readAt !== null && event.readAt !== undefined,
      createdAt: event.createdAt.toISOString(),
      actorName: event.actorUser?.name ?? null,
      payload: event.payload,
    };
  }
}
