import { useEffect, useRef } from 'react';
import { playSound, preloadSounds, type SoundEffect } from '@/lib/sounds';
import type { TimerPhase, TimerStatus } from '@/lib/types';

export interface TimerSoundSnapshot {
  phase: TimerPhase;
  status: TimerStatus;
}

export function soundForTimerTransition(
  previous: TimerSoundSnapshot,
  current: TimerSoundSnapshot,
): SoundEffect | null {
  if (
    previous.phase === current.phase &&
    previous.status === current.status
  ) {
    return null;
  }

  if (previous.status === 'running' && current.status === 'flowState') {
    return 'complete';
  }

  const wasBreakActive =
    (previous.status === 'running' || previous.status === 'flowState') &&
    (previous.phase === 'shortBreak' || previous.phase === 'longBreak');
  if (
    wasBreakActive &&
    current.status === 'idle' &&
    current.phase === 'focus'
  ) {
    return 'breakEnd';
  }

  const enteredBreak =
    previous.phase === 'focus' &&
    current.status === 'idle' &&
    (current.phase === 'shortBreak' || current.phase === 'longBreak');
  if (enteredBreak) {
    return 'breakStart';
  }

  return null;
}

export function useTimerSoundEffects(
  phase: TimerPhase,
  status: TimerStatus,
): void {
  const previous = useRef<TimerSoundSnapshot>({ phase, status });

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    const current = { phase, status };
    const effect = soundForTimerTransition(previous.current, current);
    previous.current = current;

    if (effect) {
      playSound(effect);
    }
  }, [phase, status]);
}
