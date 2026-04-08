import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTimerStore } from './timerStore';
import { useSettingsStore } from './settingsStore';
import { useSessionStore } from './sessionStore';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { createInitialState } from '@/lib/timerEngine';

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
  it('records a break session when a running break auto-completes via TICK', () => {
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

    useTimerStore.getState().dispatch({ type: 'TICK', elapsed: shortSec });

    const sessions = useSessionStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toBe('break');
    expect(sessions[0].actualDuration).toBe(shortSec);
    expect(sessions[0].plannedDuration).toBe(shortSec);
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
