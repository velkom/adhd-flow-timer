import type { TimerStoreState } from './timerStore.types';

export function startTickInterval(
  get: () => TimerStoreState,
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const { startedAt, pausedElapsed, debugSpeedMultiplier } = get();
    if (!startedAt) return;
    const wallElapsed =
      (Date.now() - startedAt) / 1000 * debugSpeedMultiplier + pausedElapsed;
    get().dispatch({ type: 'TICK', elapsed: wallElapsed });

    const current = get().timer;
    if (current.status === 'idle') {
      get().cleanup();
    }
  }, 250);
}
