import type { TimerState } from '@/lib/types';
import { createInitialState, timerReducer } from '@/lib/timerEngine';
import {
  saveTimerState,
  loadTimerState,
  clearTimerState,
} from '@/lib/storage';
import { useSettingsStore } from './settingsStore';
import { recordBreakSessionIfEnded } from './sessionRecorder';
import { startTickInterval } from './timerTick';
import type { TimerStoreState } from './timerStore.types';

export const TIMER_PERSIST_STALE_MS = 24 * 60 * 60 * 1000;
export const TICK_PERSIST_INTERVAL_MS = 1000;

let lastTickPersistMs = 0;

export function persistTimerSlice(slice: {
  timer: TimerState;
  startedAt: number | null;
  pausedElapsed: number;
}): void {
  saveTimerState({
    ...slice,
    savedAt: Date.now(),
  });
}

export function persistTimerSnapshot(
  get: () => TimerStoreState,
  opts?: { isTick?: boolean },
): void {
  if (opts?.isTick) {
    const now = Date.now();
    if (now - lastTickPersistMs < TICK_PERSIST_INTERVAL_MS) return;
    lastTickPersistMs = now;
  }
  const s = get();
  persistTimerSlice({
    timer: s.timer,
    startedAt: s.startedAt,
    pausedElapsed: s.pausedElapsed,
  });
}

type TimerRuntimeSlice = Pick<
  TimerStoreState,
  'timer' | 'startedAt' | 'pausedElapsed' | 'intervalId'
>;

function getSettings() {
  return useSettingsStore.getState().settings;
}

export function computeRestoredTimerState(
  get: () => TimerStoreState,
): TimerRuntimeSlice {
  const settings = getSettings();
  const persisted = loadTimerState();
  if (!persisted) {
    return {
      timer: createInitialState(settings),
      startedAt: null,
      pausedElapsed: 0,
      intervalId: null,
    };
  }
  if (Date.now() - persisted.savedAt > TIMER_PERSIST_STALE_MS) {
    clearTimerState();
    return {
      timer: createInitialState(settings),
      startedAt: null,
      pausedElapsed: 0,
      intervalId: null,
    };
  }

  const { timer, startedAt: savedStartedAt, pausedElapsed: savedPaused } =
    persisted;

  if (timer.status === 'idle') {
    const slice = {
      timer,
      startedAt: null,
      pausedElapsed: 0,
      intervalId: null,
    };
    persistTimerSlice(slice);
    return slice;
  }

  if (timer.status === 'paused') {
    const slice = {
      timer,
      startedAt: null,
      pausedElapsed: savedPaused,
      intervalId: null,
    };
    persistTimerSlice(slice);
    return slice;
  }

  if (savedStartedAt == null) {
    const slice = {
      timer,
      startedAt: null,
      pausedElapsed: savedPaused,
      intervalId: null,
    };
    persistTimerSlice(slice);
    return slice;
  }

  const wallElapsed =
    (Date.now() - savedStartedAt) / 1000 + savedPaused;

  const prevTimer = timer;
  const nextTimer = timerReducer(
    timer,
    { type: 'TICK', elapsed: wallElapsed },
    settings,
  );
  recordBreakSessionIfEnded(prevTimer, nextTimer, wallElapsed);

  if (nextTimer.status === 'idle') {
    const slice = {
      timer: nextTimer,
      startedAt: null,
      pausedElapsed: 0,
      intervalId: null,
    };
    persistTimerSlice(slice);
    return slice;
  }

  const intervalId = startTickInterval(get);
  const slice = {
    timer: nextTimer,
    startedAt: Date.now(),
    pausedElapsed: wallElapsed,
    intervalId,
  };
  persistTimerSlice(slice);
  return slice;
}
