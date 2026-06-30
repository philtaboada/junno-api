'use client';

import { useSyncExternalStore } from 'react';
import {
  getActiveWorkspace,
  getAuthState,
  subscribeToAuthStore,
} from '@/lib/auth/auth-store';

export function useAuthStore() {
  return useSyncExternalStore(subscribeToAuthStore, getAuthState, getAuthState);
}

export function useActiveWorkspace() {
  return useSyncExternalStore(
    subscribeToAuthStore,
    getActiveWorkspace,
    () => null,
  );
}
