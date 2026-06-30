'use client';

import { useCallback, useEffect, useState } from 'react';

function readCollapsedSectionIds(storageKey: string): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

function writeCollapsedSectionIds(storageKey: string, sectionIds: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify([...sectionIds]));
}

type UseCollapsedSectionsResult = {
  isSectionCollapsed: (sectionId: string) => boolean;
  toggleSectionCollapsed: (sectionId: string) => void;
};

export function useCollapsedSections(projectId: string): UseCollapsedSectionsResult {
  const storageKey = `junno:collapsed-sections:${projectId}`;
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(
    () => readCollapsedSectionIds(storageKey),
  );

  useEffect(() => {
    setCollapsedSectionIds(readCollapsedSectionIds(storageKey));
  }, [storageKey]);

  const isSectionCollapsed = useCallback(
    (sectionId: string) => collapsedSectionIds.has(sectionId),
    [collapsedSectionIds],
  );

  const toggleSectionCollapsed = useCallback(
    (sectionId: string) => {
      setCollapsedSectionIds((current) => {
        const next = new Set(current);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        writeCollapsedSectionIds(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return {
    isSectionCollapsed,
    toggleSectionCollapsed,
  };
}
