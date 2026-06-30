import type {
  AuthSessionDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  MeResponseDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
} from '@pm/contracts';
import {
  clearSession,
  getAccessToken,
  getActiveWorkspaceId,
  setSession,
  updateSession,
} from '@/lib/auth/auth-store';
import { WORKSPACE_HEADER } from '@/lib/auth/constants';
import { API_BASE_URL } from './config';
import { resolveApiErrorMessage } from './error-messages';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuthRetry?: boolean;
  includeWorkspaceHeader?: boolean;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return null;
  }
  return response.json();
}

async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  const session = (await response.json()) as AuthSessionDto;
  updateSession(session);
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (options.includeWorkspaceHeader !== false) {
    const workspaceId = getActiveWorkspaceId();
    if (workspaceId) {
      headers.set(WORKSPACE_HEADER, workspaceId);
    }
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  if (
    response.status === 401 &&
    !options.skipAuthRetry &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register') &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/forgot-password') &&
    !path.startsWith('/auth/reset-password')
  ) {
    const hasRefreshed = await refreshSession();
    if (hasRefreshed) {
      return apiRequest<T>(path, { ...options, skipAuthRetry: true });
    }
  }
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      resolveApiErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }
  return payload as T;
}

export async function registerUser(input: RegisterRequestDto): Promise<AuthSessionDto> {
  const session = await apiRequest<AuthSessionDto>('/auth/register', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
    includeWorkspaceHeader: false,
  });
  setSession(session);
  return session;
}

export async function loginUser(input: LoginRequestDto): Promise<AuthSessionDto> {
  const session = await apiRequest<AuthSessionDto>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
    includeWorkspaceHeader: false,
  });
  setSession(session);
  return session;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiRequest<{ success: true }>('/auth/logout', {
      method: 'POST',
      skipAuthRetry: true,
    });
  } finally {
    clearSession();
  }
}

export async function fetchCurrentUser(): Promise<MeResponseDto> {
  return apiRequest<MeResponseDto>('/auth/me', {
    method: 'GET',
    includeWorkspaceHeader: false,
  });
}

export async function bootstrapSession(): Promise<MeResponseDto | null> {
  try {
    if (!getAccessToken()) {
      const hasRefreshed = await refreshSession();
      if (!hasRefreshed) {
        return null;
      }
    }
    const me = await fetchCurrentUser();
    const accessToken = getAccessToken();
    if (!accessToken) {
      return null;
    }
    updateSession({
      accessToken,
      user: me.user,
      workspaces: me.workspaces,
    });
    return me;
  } catch {
    clearSession();
    return null;
  }
}

export async function requestPasswordReset(
  input: ForgotPasswordRequestDto,
): Promise<ForgotPasswordResponseDto> {
  return apiRequest<ForgotPasswordResponseDto>('/auth/forgot-password', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
    includeWorkspaceHeader: false,
  });
}

export async function resetPassword(
  input: ResetPasswordRequestDto,
): Promise<ResetPasswordResponseDto> {
  return apiRequest<ResetPasswordResponseDto>('/auth/reset-password', {
    method: 'POST',
    body: input,
    skipAuthRetry: true,
    includeWorkspaceHeader: false,
  });
}

export { ApiError };

type ApiUploadOptions = {
  method?: 'POST' | 'PUT' | 'PATCH';
  skipAuthRetry?: boolean;
};

export async function apiUploadFormData<T>(
  path: string,
  formData: FormData,
  options: ApiUploadOptions = {},
): Promise<T> {
  const headers = new Headers();
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const workspaceId = getActiveWorkspaceId();
  if (workspaceId) {
    headers.set(WORKSPACE_HEADER, workspaceId);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  if (
    response.status === 401 &&
    !options.skipAuthRetry &&
    !path.startsWith('/auth/')
  ) {
    const hasRefreshed = await refreshSession();
    if (hasRefreshed) {
      return apiUploadFormData<T>(path, formData, {
        ...options,
        skipAuthRetry: true,
      });
    }
  }
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      resolveApiErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }
  return payload as T;
}

export async function apiDownloadBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const workspaceId = getActiveWorkspaceId();
  if (workspaceId) {
    headers.set(WORKSPACE_HEADER, workspaceId);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (response.status === 401) {
    const hasRefreshed = await refreshSession();
    if (hasRefreshed) {
      return apiDownloadBlob(path);
    }
  }
  if (!response.ok) {
    const payload = await parseResponseBody(response);
    throw new ApiError(
      resolveApiErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }
  return response.blob();
}
