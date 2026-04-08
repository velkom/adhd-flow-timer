import type { TimerState, Session } from '@/lib/types';
import { useSettingsStore } from './settingsStore';
import { useSessionStore } from './sessionStore';

function getSettings() {
  return useSettingsStore.getState().settings;
}

export function recordSession(prevTimer: TimerState): void {
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
export function recordBreakSessionIfEnded(
  prevTimer: TimerState,
  nextTimer: TimerState,
  tickElapsed?: number,
): void {
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
