import { io, type Socket } from 'socket.io-client';

const REALTIME_BASE_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:3000';

const DISCONNECT_DELAY_MS = 500;

export type TaskChangedPayload = {
  readonly taskId: string;
  readonly projectId: string;
};

let sharedSocket: Socket | null = null;
let sharedWorkspaceId: string | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
const taskChangedListeners = new Set<(payload: TaskChangedPayload) => void>();

function cancelScheduledDisconnect(): void {
  if (disconnectTimer === null) {
    return;
  }
  clearTimeout(disconnectTimer);
  disconnectTimer = null;
}

function scheduleDisconnect(): void {
  cancelScheduledDisconnect();
  disconnectTimer = setTimeout(() => {
    disconnectTimer = null;
    if (taskChangedListeners.size > 0 || !sharedSocket) {
      return;
    }
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedWorkspaceId = null;
  }, DISCONNECT_DELAY_MS);
}

function dispatchTaskChanged(payload: TaskChangedPayload): void {
  taskChangedListeners.forEach((listener) => listener(payload));
}

function ensureSocket(workspaceId: string): Socket {
  cancelScheduledDisconnect();
  if (sharedSocket && sharedWorkspaceId === workspaceId) {
    if (!sharedSocket.connected && !sharedSocket.active) {
      sharedSocket.connect();
    }
    return sharedSocket;
  }
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedWorkspaceId = null;
  }
  sharedSocket = io(REALTIME_BASE_URL, {
    query: { workspaceId },
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  sharedWorkspaceId = workspaceId;
  sharedSocket.on('task:changed', (payload: TaskChangedPayload) => {
    dispatchTaskChanged(payload);
  });
  return sharedSocket;
}

export function subscribeWorkspaceTasks(
  workspaceId: string,
  onChanged: (payload: TaskChangedPayload) => void,
): () => void {
  ensureSocket(workspaceId);
  taskChangedListeners.add(onChanged);
  return () => {
    taskChangedListeners.delete(onChanged);
    if (taskChangedListeners.size === 0) {
      scheduleDisconnect();
    }
  };
}
