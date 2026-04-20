import type { TimerState, TimerAction } from '@/lib/types';

/** Zustand timer slice + imperative actions (used by persistence and tick helpers). */
export interface TimerStoreState {
  timer: TimerState;
  /** Wallclock timestamp when the current run started (for TICK elapsed calc) */
  startedAt: number | null;
  /** Accumulated elapsed before latest pause */
  pausedElapsed: number;
  intervalId: ReturnType<typeof setInterval> | null;

  /** Debug-only: multiplies wall-clock speed (ephemeral, not persisted) */
  debugSpeedMultiplier: number;

  dispatch: (action: TimerAction) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  /** Full reset: idle focus, cycle counters zeroed, persisted timer snapshot updated. */
  resetStoredTimer: () => void;
  setPreset: (seconds: number) => void;
  cleanup: () => void;
  setDebugSpeed: (multiplier: number) => void;
  addDebugTime: (seconds: number) => void;
}
