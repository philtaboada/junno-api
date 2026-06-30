import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

type UseAsyncResourceOptions = {
  enabled?: boolean;
};

type UseAsyncResourceResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  setData: Dispatch<SetStateAction<T | null>>;
  reload: () => void;
};

function serializeDeps(deps: readonly unknown[]): string {
  return JSON.stringify(deps);
}

export function useAsyncResource<T>(
  deps: readonly unknown[],
  load: () => Promise<T>,
  resolveError: (error: unknown) => string,
  options: UseAsyncResourceOptions = {},
): UseAsyncResourceResult<T> {
  const enabled = options.enabled ?? true;
  const depsKey = serializeDeps(deps);
  const requestIdRef = useRef(0);
  const loadRef = useRef(load);
  const resolveErrorRef = useRef(resolveError);
  const [trackedDepsKey, setTrackedDepsKey] = useState(depsKey);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    loadRef.current = load;
    resolveErrorRef.current = resolveError;
  });

  if (depsKey !== trackedDepsKey) {
    setTrackedDepsKey(depsKey);
    setData(null);
    setError(null);
    setIsLoading(enabled);
  }

  const runFetch = useCallback((): void => {
    if (!enabled) {
      return;
    }
    const requestId = ++requestIdRef.current;
    void loadRef.current()
      .then((result) => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        setData(result);
        setError(null);
        setIsLoading(false);
      })
      .catch((caught) => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        setData(null);
        setError(resolveErrorRef.current(caught));
        setIsLoading(false);
      });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    runFetch();
  }, [enabled, depsKey, runFetch]);

  const reload = useCallback((): void => {
    runFetch();
  }, [runFetch]);

  return {
    data,
    error,
    isLoading: enabled ? isLoading : false,
    setData,
    reload,
  };
}
