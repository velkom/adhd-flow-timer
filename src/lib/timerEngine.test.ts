import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  timerReducer,
  getNextPhase,
  isLongBreakDue,
} from './timerEngine';
import { DEFAULT_SETTINGS } from './types';
import type { TimerState, TimerSettings } from './types';

const settings: TimerSettings = { ...DEFAULT_SETTINGS };

function stateAfter(
  ...actions: Parameters<typeof timerReducer>[1][]
): TimerState {
  return actions.reduce(
    (s, a) => timerReducer(s, a, settings),
    createInitialState(settings),
  );
}

describe('createInitialState', () => {
  it('creates idle state with focus duration from settings', () => {
    const state = createInitialState(settings);
    expect(state.phase).toBe('focus');
    expect(state.status).toBe('idle');
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.completedSessions).toBe(0);
    expect(state.sessionIndex).toBe(0);
    expect(state.flowSeconds).toBe(0);
  });
});

describe('START action', () => {
  it('transitions from idle to running', () => {
    const state = stateAfter({ type: 'START' });
    expect(state.status).toBe('running');
    expect(state.phase).toBe('focus');
  });

  it('is a no-op if already running', () => {
    const state = stateAfter({ type: 'START' }, { type: 'START' });
    expect(state.status).toBe('running');
  });
});

describe('PAUSE action', () => {
  it('transitions from running to paused', () => {
    const state = stateAfter({ type: 'START' }, { type: 'PAUSE' });
    expect(state.status).toBe('paused');
  });

  it('is a no-op if idle', () => {
    const state = stateAfter({ type: 'PAUSE' });
    expect(state.status).toBe('idle');
  });
});

describe('RESUME action', () => {
  it('transitions from paused to running', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'PAUSE' },
      { type: 'RESUME' },
    );
    expect(state.status).toBe('running');
  });

  it('is a no-op if not paused', () => {
    const state = stateAfter({ type: 'RESUME' });
    expect(state.status).toBe('idle');
  });

  it('resumes to flowState when paused in focus overtime', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'TICK', elapsed: 25 * 60 + 251 },
      { type: 'PAUSE' },
      { type: 'RESUME' },
    );
    expect(state.status).toBe('flowState');
    expect(state.remainingSeconds).toBe(-251);
    expect(state.phase).toBe('focus');
  });

  it('resumes to flowState when paused in break overtime', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'SKIP' },
      { type: 'START' },
      { type: 'TICK', elapsed: 5 * 60 + 120 },
      { type: 'PAUSE' },
      { type: 'RESUME' },
    );
    expect(state.status).toBe('flowState');
    expect(state.remainingSeconds).toBe(-120);
    expect(state.phase).toBe('shortBreak');
  });
});

describe('TICK action', () => {
  it('decrements remaining seconds', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'TICK', elapsed: 10 },
    );
    expect(state.remainingSeconds).toBe(25 * 60 - 10);
    expect(state.elapsedSeconds).toBe(10);
  });

  it('enters flow state when remaining hits zero during focus', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'TICK', elapsed: 25 * 60 + 5 },
    );
    expect(state.status).toBe('flowState');
    expect(state.flowSeconds).toBe(5);
    expect(state.remainingSeconds).toBe(-5);
  });

  it('enters flow state when break time runs out (same as focus)', () => {
    const s = settings;
    let state = createInitialState(s);
    state = timerReducer(state, { type: 'START' }, s);
    state = timerReducer(state, { type: 'SKIP' }, s);
    state = timerReducer(state, { type: 'START' }, s);
    state = timerReducer(state, { type: 'TICK', elapsed: 5 * 60 + 1 }, s);
    expect(state.phase).toBe('shortBreak');
    expect(state.status).toBe('flowState');
    expect(state.flowSeconds).toBe(1);
    expect(state.remainingSeconds).toBe(-1);
  });
});

describe('SKIP action', () => {
  it('skips focus to break', () => {
    const state = stateAfter({ type: 'START' }, { type: 'SKIP' });
    expect(state.phase).toBe('shortBreak');
    expect(state.status).toBe('idle');
    expect(state.completedSessions).toBe(1);
  });

  it('skips break to focus', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'SKIP' },
      { type: 'START' },
      { type: 'SKIP' },
    );
    expect(state.phase).toBe('focus');
    expect(state.status).toBe('idle');
  });

  it('triggers long break after N sessions', () => {
    let state = createInitialState(settings);
    for (let i = 0; i < settings.sessionsBeforeLongBreak; i++) {
      state = timerReducer(state, { type: 'START' }, settings);
      state = timerReducer(state, { type: 'SKIP' }, settings);
      if (state.phase !== 'focus') {
        state = timerReducer(state, { type: 'START' }, settings);
        state = timerReducer(state, { type: 'SKIP' }, settings);
      }
    }
    expect(state.completedSessions).toBe(settings.sessionsBeforeLongBreak);
  });
});

describe('RESET action', () => {
  it('resets to idle on the current phase', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'TICK', elapsed: 60 },
      { type: 'RESET' },
    );
    expect(state.status).toBe('idle');
    expect(state.phase).toBe('focus');
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.flowSeconds).toBe(0);
  });
});

describe('SET_PRESET action', () => {
  it('sets a custom focus duration when idle', () => {
    const state = stateAfter({ type: 'SET_PRESET', duration: 10 * 60 });
    expect(state.remainingSeconds).toBe(10 * 60);
  });

  it('is a no-op when running', () => {
    const state = stateAfter(
      { type: 'START' },
      { type: 'SET_PRESET', duration: 10 * 60 },
    );
    expect(state.remainingSeconds).toBe(25 * 60);
  });
});

describe('getNextPhase', () => {
  it('returns shortBreak after focus (not long break threshold)', () => {
    expect(getNextPhase('focus', 1, settings)).toBe('shortBreak');
  });

  it('returns longBreak at the threshold', () => {
    expect(getNextPhase('focus', 4, settings)).toBe('longBreak');
  });

  it('returns focus after any break', () => {
    expect(getNextPhase('shortBreak', 1, settings)).toBe('focus');
    expect(getNextPhase('longBreak', 4, settings)).toBe('focus');
  });
});

describe('isLongBreakDue', () => {
  it('returns true when sessions is a multiple of the threshold', () => {
    expect(isLongBreakDue(4, settings)).toBe(true);
    expect(isLongBreakDue(8, settings)).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isLongBreakDue(0, settings)).toBe(false);
    expect(isLongBreakDue(1, settings)).toBe(false);
    expect(isLongBreakDue(3, settings)).toBe(false);
  });
});
