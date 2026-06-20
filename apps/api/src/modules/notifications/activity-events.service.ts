import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../auth/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  ActivityEvent,
  ActivityEventType,
} from './entities/activity-event.entity';

type CreateActivityEventParams = {
  workspaceId: string;
  recipientUserId: string;
  actorUserId?: string;
  type: ActivityEventType;
  payload?: Record<string, unknown>;
};

@Injectable()
export class ActivityEventsService {
  constructor(private readonly entityManager: EntityManager) {}

  async createEvent(params: CreateActivityEventParams): Promise<ActivityEvent> {
    const workspace = await this.entityManager.findOneOrFail(Workspace, {
      id: params.workspaceId,
    });
    const recipientUser = await this.entityManager.findOneOrFail(User, {
      id: params.recipientUserId,
    });
    const actorUser = params.actorUserId
      ? await this.entityManager.findOneOrFail(User, { id: params.actorUserId })
      : undefined;
    const event = this.entityManager.create(ActivityEvent, {
      workspace,
      recipientUser,
      actorUser,
      type: params.type,
      payload: params.payload ?? {},
      createdAt: new Date(),
    });
    await this.entityManager.flush();
    return event;
  }
}
