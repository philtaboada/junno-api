import type { AuthSessionDto, AuthUserDto, WorkspaceSummaryDto } from '@pm/contracts';
import { ACTIVE_WORKSPACE_STORAGE_KEY } from './constants';

type AuthState = {
  accessToken: string | null;
  user: AuthUserDto | null;
  workspaces: WorkspaceSummaryDto[];
};

let authState: AuthState = {
  accessToken: null,
  user: null,
  workspaces: [],
};

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToAuthStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState(): AuthState {
  return authState;
}

export function getAccessToken(): string | null {
  return authState.accessToken;
}

export function setSession(session: AuthSessionDto): void {
  authState = {
    accessToken: session.accessToken,
    user: session.user,
    workspaces: session.workspaces,
  };
  if (session.workspaces.length === 1) {
    setActiveWorkspaceId(session.workspaces[0].id);
  }
  notifyListeners();
}

export function updateSession(session: AuthSessionDto): void {
  setSession(session);
}

export function clearSession(): void {
  authState = {
    accessToken: null,
    user: null,
    workspaces: [],
  };
  notifyListeners();
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

export function setActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
  notifyListeners();
}

export function clearActiveWorkspaceId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  notifyListeners();
}

export function getActiveWorkspace(): WorkspaceSummaryDto | null {
  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) {
    return null;
  }
  return authState.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}
