import { create } from 'zustand';
import type { TimerState, TimerAction, Session } from '../lib/types';
import { createInitialState, timerReducer } from '../lib/timerEngine';
import { useSettingsStore } from './settingsStore';
import { useSessionStore } from './sessionStore';
import {
  saveTimerState,
  loadTimerState,
  clearTimerState,
} from '../lib/storage';

const TIMER_PERSIST_STALE_MS = 24 * 60 * 60 * 1000;
const TICK_PERSIST_INTERVAL_MS = 1000;

let lastTickPersistMs = 0;

interface TimerStoreState {
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
  setPreset: (seconds: number) => void;
  cleanup: () => void;
  setDebugSpeed: (multiplier: number) => void;
  addDebugTime: (seconds: number) => void;
}

function getSettings() {
  return useSettingsStore.getState().settings;
}

function persistTimerSlice(slice: {
  timer: TimerState;
  startedAt: number | null;
  pausedElapsed: number;
}): void {
  saveTimerState({
    ...slice,
    savedAt: Date.now(),
  });
}

function persistTimerSnapshot(
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

function startTickInterval(get: () => TimerStoreState): ReturnType<typeof setInterval> {
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

function recordSession(prevTimer: TimerState, _nextTimer: TimerState) {
  if (prevTimer.phase !== 'focus') return;
  const now = new Date();
  const elapsed = prevTimer.elapsedSeconds;
  const startTime = new Date(now.getTime() - elapsed * 1000);

  const session: Session = {
    id: crypto.randomUUID(),
    type: 'focus',
    startedAt: startTime.toISOString(),
    endedAt: now.toISOString(),
    plannedDuration: getSettings().focusDuration,
    actualDuration: elapsed,
    flowStateDuration: prevTimer.flowSeconds,
    completed: true,
  };

  useSessionStore.getState().addSession(session);
}

/** Persist a completed or skipped break when transitioning to idle focus. */
function recordBreakSessionIfEnded(
  prevTimer: TimerState,
  nextTimer: TimerState,
  tickElapsed?: number,
) {
  const wasBreak =
    prevTimer.phase === 'shortBreak' || prevTimer.phase === 'longBreak';
  if (
    !wasBreak ||
    nextTimer.phase !== 'focus' ||
    nextTimer.status !== 'idle'
  ) {
    return;
  }

  const settings = getSettings();
  const plannedDuration =
    prevTimer.phase === 'shortBreak'
      ? settings.shortBreakDuration
      : settings.longBreakDuration;

  const now = new Date();
  const elapsed =
    tickElapsed !== undefined ? tickElapsed : prevTimer.elapsedSeconds;
  const startTime = new Date(now.getTime() - elapsed * 1000);

  const session: Session = {
    id: crypto.randomUUID(),
    type: 'break',
    startedAt: startTime.toISOString(),
    endedAt: now.toISOString(),
    plannedDuration,
    actualDuration: elapsed,
    flowStateDuration: 0,
    completed: true,
  };

  useSessionStore.getState().addSession(session);
}

type TimerRuntimeSlice = Pick<
  TimerStoreState,
  'timer' | 'startedAt' | 'pausedElapsed' | 'intervalId'
>;

function computeRestoredTimerState(get: () => TimerStoreState): TimerRuntimeSlice {
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

export const useTimerStore = create<TimerStoreState>((set, get) => {
  const initial = computeRestoredTimerState(get);

  return {
    timer: initial.timer,
    startedAt: initial.startedAt,
    pausedElapsed: initial.pausedElapsed,
    intervalId: initial.intervalId,
    debugSpeedMultiplier: 1,

    dispatch: (action) => {
      const settings = getSettings();
      const prev = get().timer;
      set((state) => ({
        timer: timerReducer(state.timer, action, settings),
      }));
      if (action.type === 'TICK') {
        recordBreakSessionIfEnded(prev, get().timer, action.elapsed);
        persistTimerSnapshot(get, { isTick: true });
      } else {
        persistTimerSnapshot(get);
      }
    },

    start: () => {
      const { timer, intervalId } = get();
      if (timer.status !== 'idle' || intervalId !== null) return;

      const settings = getSettings();
      const next = timerReducer(timer, { type: 'START' }, settings);

      const id = startTickInterval(get);

      set({
        timer: next,
        startedAt: Date.now(),
        pausedElapsed: 0,
        intervalId: id,
      });
      persistTimerSnapshot(get);
    },

    pause: () => {
      const { timer, startedAt, pausedElapsed, intervalId, debugSpeedMultiplier } =
        get();
      if (timer.status !== 'running' && timer.status !== 'flowState') return;

      if (intervalId) clearInterval(intervalId);
      const wallElapsed = startedAt
        ? (Date.now() - startedAt) / 1000 * debugSpeedMultiplier
        : 0;

      const settings = getSettings();
      set({
        timer: timerReducer(timer, { type: 'PAUSE' }, settings),
        intervalId: null,
        pausedElapsed: pausedElapsed + wallElapsed,
        startedAt: null,
      });
      persistTimerSnapshot(get);
    },

    resume: () => {
      const { timer } = get();
      if (timer.status !== 'paused') return;

      const settings = getSettings();
      const next = timerReducer(timer, { type: 'RESUME' }, settings);

      const id = startTickInterval(get);

      set({
        timer: next,
        startedAt: Date.now(),
        intervalId: id,
      });
      persistTimerSnapshot(get);
    },

    skip: () => {
      const { timer, intervalId } = get();
      if (timer.status === 'idle') return;

      if (intervalId) clearInterval(intervalId);
      const settings = getSettings();
      const prev = timer;
      const next = timerReducer(timer, { type: 'SKIP' }, settings);

      recordSession(prev, next);
      recordBreakSessionIfEnded(prev, next);

      set({
        timer: next,
        intervalId: null,
        startedAt: null,
        pausedElapsed: 0,
      });
      persistTimerSnapshot(get);
    },

    reset: () => {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);

      const settings = getSettings();
      set({
        timer: timerReducer(get().timer, { type: 'RESET' }, settings),
        intervalId: null,
        startedAt: null,
        pausedElapsed: 0,
      });
      persistTimerSnapshot(get);
    },

    setPreset: (seconds) => {
      get().dispatch({ type: 'SET_PRESET', duration: seconds });
    },

    cleanup: () => {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      set({ intervalId: null, startedAt: null, pausedElapsed: 0 });
      persistTimerSnapshot(get);
    },

    setDebugSpeed: (multiplier) => {
      const { startedAt, pausedElapsed, debugSpeedMultiplier } = get();
      if (startedAt) {
        const segmentReal = (Date.now() - startedAt) / 1000;
        const segmentScaled = segmentReal * debugSpeedMultiplier;
        set({
          debugSpeedMultiplier: multiplier,
          pausedElapsed: pausedElapsed + segmentScaled,
          startedAt: Date.now(),
        });
      } else {
        set({ debugSpeedMultiplier: multiplier });
      }
      persistTimerSnapshot(get);
    },

    addDebugTime: (seconds) => {
      const { timer } = get();
      if (timer.status === 'idle') return;
      set((state) => ({ pausedElapsed: state.pausedElapsed + seconds }));
      persistTimerSnapshot(get);
    },
  };
});
