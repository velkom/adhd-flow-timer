import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 480px)';

function getMatches(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** True in narrow layouts — use for canvas chart fonts and similar. */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, getMatches, () => false);
}
