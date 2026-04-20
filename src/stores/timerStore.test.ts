import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTimerStore } from './timerStore';
import { useSettingsStore } from './settingsStore';
import { useSessionStore } from './sessionStore';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { createInitialState } from '@/lib/timerEngine';
import { STORAGE_KEYS } from '@/lib/storage';
import { persistTimerSlice } from './timerPersistence';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useSessionStore.setState({ sessions: [] });
  useTimerStore.setState({
    timer: createInitialState(DEFAULT_SETTINGS),
    startedAt: null,
    pausedElapsed: 0,
    intervalId: null,
    debugSpeedMultiplier: 1,
  });
});

afterEach(() => {
  const { intervalId } = useTimerStore.getState();
  if (intervalId) clearInterval(intervalId);
  useTimerStore.setState({
    intervalId: null,
    startedAt: null,
    pausedElapsed: 0,
  });
});

describe('timerStore break recording', () => {
  it('does not record on TICK past planned break; skip records overtime like focus', () => {
    const shortSec = DEFAULT_SETTINGS.shortBreakDuration;
    useTimerStore.setState({
      timer: {
        phase: 'shortBreak',
        status: 'running',
        remainingSeconds: shortSec,
        elapsedSeconds: 0,
        sessionIndex: 1,
        completedSessions: 1,
        flowSeconds: 0,
      },
    });

    useTimerStore.getState().dispatch({ type: 'TICK', elapsed: shortSec + 45 });

    expect(useSessionStore.getState().sessions).toHaveLength(0);
    const mid = useTimerStore.getState().timer;
    expect(mid.phase).toBe('shortBreak');
    expect(mid.status).toBe('flowState');
    expect(mid.flowSeconds).toBe(45);

    useTimerStore.getState().skip();

    const sessions = useSessionStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toBe('break');
    expect(sessions[0].actualDuration).toBe(shortSec + 45);
    expect(sessions[0].plannedDuration).toBe(shortSec);
    expect(sessions[0].flowStateDuration).toBe(45);
  });

  it('records a break session when skipping an in-progress break', () => {
    useTimerStore.setState({
      timer: {
        phase: 'shortBreak',
        status: 'running',
        remainingSeconds: 200,
        elapsedSeconds: 100,
        sessionIndex: 1,
        completedSessions: 1,
        flowSeconds: 0,
      },
    });

    useTimerStore.getState().skip();

    const sessions = useSessionStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toBe('break');
    expect(sessions[0].actualDuration).toBe(100);
  });

  it('records focus then break when skipping focus then skipping break', () => {
    useTimerStore.getState().start();
    useTimerStore.getState().skip();
    expect(useSessionStore.getState().sessions).toHaveLength(1);
    expect(useSessionStore.getState().sessions[0].type).toBe('focus');

    useTimerStore.getState().start();
    useTimerStore.getState().skip();

    const sessions = useSessionStore.getState().sessions;
    expect(sessions).toHaveLength(2);
    expect(sessions[1].type).toBe('break');
  });
});

describe('resetStoredTimer', () => {
  it('zeros cycle counters and overwrites persisted timer snapshot', () => {
    const timer = {
      ...createInitialState(DEFAULT_SETTINGS),
      completedSessions: 3,
      sessionIndex: 3,
    };
    useTimerStore.setState({ timer });
    persistTimerSlice({ timer, startedAt: null, pausedElapsed: 0 });

    const rawBefore = localStorage.getItem(STORAGE_KEYS.timer);
    expect(rawBefore).toBeTruthy();
    expect(JSON.parse(rawBefore!).timer.completedSessions).toBe(3);

    useTimerStore.getState().resetStoredTimer();

    expect(useTimerStore.getState().timer.completedSessions).toBe(0);
    expect(useTimerStore.getState().timer.sessionIndex).toBe(0);
    const rawAfter = localStorage.getItem(STORAGE_KEYS.timer);
    expect(JSON.parse(rawAfter!).timer.completedSessions).toBe(0);
  });
});
