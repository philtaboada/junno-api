import { useEffect, useRef } from 'react';
import {
  subscribeWorkspaceTasks,
  type TaskChangedPayload,
} from '@/lib/realtime/workspace-socket';

export function useWorkspaceTaskChanged(
  workspaceId: string | undefined,
  onChanged: (payload: TaskChangedPayload) => void,
): void {
  const onChangedRef = useRef(onChanged);

  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    return subscribeWorkspaceTasks(workspaceId, (payload) => {
      onChangedRef.current(payload);
    });
  }, [workspaceId]);
}
