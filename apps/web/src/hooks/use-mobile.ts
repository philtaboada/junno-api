import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribeToMobileChange(onStoreChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(MEDIA_QUERY);
  mediaQueryList.addEventListener('change', onStoreChange);
  return () => mediaQueryList.removeEventListener('change', onStoreChange);
}

function getMobileSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getMobileServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToMobileChange,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
}
