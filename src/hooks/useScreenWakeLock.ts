import { useEffect } from 'react';

/** Screen Wake Lock needs a secure context; absent on Firefox and iOS below 16.4. */
export function isScreenWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Keeps the device screen on while the document is visible, so a running timer
 * stays readable on a phone. The platform releases the lock whenever the page is
 * hidden, so it is re-acquired on every return to visible.
 */
export function useScreenWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isScreenWakeLockSupported()) return;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const release = (lock: WakeLockSentinel) => {
      if (lock.released) return;
      lock.release().catch(() => {
        // Already released by the platform.
      });
    };

    const acquire = async () => {
      if (sentinel !== null || document.visibilityState !== 'visible') return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (disposed) {
          release(lock);
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        // Denied (battery saver, permissions policy) — the timer still runs.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinel !== null) {
        release(sentinel);
        sentinel = null;
      }
    };
  }, [enabled]);
}
