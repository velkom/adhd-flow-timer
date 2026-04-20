import type { TimerState, TimerSettings, TimerAction, TimerPhase } from './types';

export function createInitialState(settings: TimerSettings): TimerState {
  return {
    phase: 'focus',
    status: 'idle',
    remainingSeconds: settings.focusDuration,
    elapsedSeconds: 0,
    sessionIndex: 0,
    completedSessions: 0,
    flowSeconds: 0,
  };
}

export function isLongBreakDue(
  completedSessions: number,
  settings: TimerSettings,
): boolean {
  return (
    completedSessions > 0 &&
    completedSessions % settings.sessionsBeforeLongBreak === 0
  );
}

export function getNextPhase(
  currentPhase: TimerPhase,
  completedSessions: number,
  settings: TimerSettings,
): TimerPhase {
  if (currentPhase === 'shortBreak' || currentPhase === 'longBreak') {
    return 'focus';
  }
  return isLongBreakDue(completedSessions, settings) ? 'longBreak' : 'shortBreak';
}

function getPhaseDuration(phase: TimerPhase, settings: TimerSettings): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration;
    case 'shortBreak':
      return settings.shortBreakDuration;
    case 'longBreak':
      return settings.longBreakDuration;
  }
}

export function timerReducer(
  state: TimerState,
  action: TimerAction,
  settings: TimerSettings,
): TimerState {
  switch (action.type) {
    case 'START': {
      if (state.status === 'running' || state.status === 'flowState') return state;
      return { ...state, status: 'running' };
    }

    case 'PAUSE': {
      if (state.status !== 'running' && state.status !== 'flowState') return state;
      return { ...state, status: 'paused' };
    }

    case 'RESUME': {
      if (state.status !== 'paused') return state;
      const nextStatus =
        state.remainingSeconds <= 0 ? 'flowState' : 'running';
      return { ...state, status: nextStatus };
    }

    case 'TICK': {
      if (state.status !== 'running' && state.status !== 'flowState') return state;

      const elapsed = action.elapsed;
      const phaseDuration = getPhaseDuration(state.phase, settings);
      const remaining = phaseDuration - elapsed;

      if (remaining <= 0) {
        const flow = elapsed - phaseDuration;
        return {
          ...state,
          status: 'flowState',
          remainingSeconds: -flow,
          elapsedSeconds: elapsed,
          flowSeconds: flow,
        };
      }
      return {
        ...state,
        remainingSeconds: remaining,
        elapsedSeconds: elapsed,
      };
    }

    case 'SKIP': {
      if (state.status === 'idle') return state;

      if (state.phase === 'focus') {
        const newCompleted = state.completedSessions + 1;
        const nextPhase = getNextPhase('focus', newCompleted, settings);
        return {
          ...state,
          phase: nextPhase,
          status: 'idle',
          remainingSeconds: getPhaseDuration(nextPhase, settings),
          elapsedSeconds: 0,
          completedSessions: newCompleted,
          sessionIndex: state.sessionIndex + 1,
          flowSeconds: 0,
        };
      }

      // Skipping a break
      return {
        ...state,
        phase: 'focus',
        status: 'idle',
        remainingSeconds: settings.focusDuration,
        elapsedSeconds: 0,
        flowSeconds: 0,
      };
    }

    case 'RESET': {
      return {
        ...state,
        status: 'idle',
        remainingSeconds: getPhaseDuration(state.phase, settings),
        elapsedSeconds: 0,
        flowSeconds: 0,
      };
    }

    case 'SET_PRESET': {
      if (state.status !== 'idle') return state;
      return {
        ...state,
        remainingSeconds: action.duration,
      };
    }
  }
}
