import { create } from 'zustand';
import { timerReducer } from '@/lib/timerEngine';
import { useSettingsStore } from './settingsStore';
import {
  computeRestoredTimerState,
  persistTimerSnapshot,
} from './timerPersistence';
import { recordSession, recordBreakSessionIfEnded } from './sessionRecorder';
import { startTickInterval } from './timerTick';
import type { TimerStoreState } from './timerStore.types';

function getSettings() {
  return useSettingsStore.getState().settings;
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

      recordSession(prev);
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
