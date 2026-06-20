import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

export interface TaskChangedPayload {
  readonly taskId: string;
  readonly projectId: string;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  emitTaskChanged(workspaceId: string, payload: TaskChangedPayload): void {
    this.realtimeGateway.emitToWorkspace(workspaceId, 'task:changed', payload);
  }
}
