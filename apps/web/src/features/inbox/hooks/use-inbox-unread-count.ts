'use client';

import { useCallback, useEffect, useState } from 'react';
import { useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { INBOX_UPDATED_EVENT } from '@/features/inbox/lib/inbox-events';
import { fetchInboxUnreadCount } from '@/lib/api/inbox';

export function useInboxUnreadCount(): number {
  const activeWorkspace = useActiveWorkspace();
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async (): Promise<void> => {
    if (!activeWorkspace?.id) {
      setCount(0);
      return;
    }
    try {
      const unreadCount = await fetchInboxUnreadCount();
      setCount(unreadCount);
    } catch {
      setCount(0);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  useEffect(() => {
    function handleInboxUpdated(): void {
      void loadCount();
    }
    window.addEventListener(INBOX_UPDATED_EVENT, handleInboxUpdated);
    return () => {
      window.removeEventListener(INBOX_UPDATED_EVENT, handleInboxUpdated);
    };
  }, [loadCount]);

  return count;
}
