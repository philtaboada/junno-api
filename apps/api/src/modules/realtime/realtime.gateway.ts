import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

function parseCorsOrigins(rawOrigin: string | undefined): string | string[] {
  const fallbackOrigin = 'http://localhost:3001';
  const value = rawOrigin?.trim() || fallbackOrigin;
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (origins.length === 0) {
    return fallbackOrigin;
  }
  return origins.length === 1 ? origins[0] : origins;
}

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    const workspaceId = this.resolveWorkspaceId(client);
    if (!workspaceId) {
      this.logger.warn(`Cliente ${client.id} conectado sin workspaceId`);
      return;
    }
    void client.join(this.buildWorkspaceRoom(workspaceId));
  }

  emitToWorkspace(workspaceId: string, event: string, payload: unknown): void {
    this.server.to(this.buildWorkspaceRoom(workspaceId)).emit(event, payload);
  }

  private resolveWorkspaceId(client: Socket): string | null {
    const rawWorkspaceId = client.handshake.query.workspaceId;
    if (typeof rawWorkspaceId === 'string' && rawWorkspaceId.trim().length > 0) {
      return rawWorkspaceId.trim();
    }
    if (Array.isArray(rawWorkspaceId) && rawWorkspaceId[0]) {
      return rawWorkspaceId[0].trim();
    }
    return null;
  }

  private buildWorkspaceRoom(workspaceId: string): string {
    return `workspace:${workspaceId}`;
  }
}
