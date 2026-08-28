import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playSound, preloadSounds } from '@/lib/sounds';
import {
  soundForTimerTransition,
  useTimerSoundEffects,
  type TimerSoundSnapshot,
} from './useTimerSoundEffects';

vi.mock('@/lib/sounds', () => ({
  playSound: vi.fn(),
  preloadSounds: vi.fn(),
}));

const snapshot = (
  phase: TimerSoundSnapshot['phase'],
  status: TimerSoundSnapshot['status'],
): TimerSoundSnapshot => ({ phase, status });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('soundForTimerTransition', () => {
  it('announces entry into overtime', () => {
    expect(
      soundForTimerTransition(
        snapshot('focus', 'running'),
        snapshot('focus', 'flowState'),
      ),
    ).toBe('complete');
  });

  it('announces break boundaries', () => {
    expect(
      soundForTimerTransition(
        snapshot('focus', 'running'),
        snapshot('shortBreak', 'idle'),
      ),
    ).toBe('breakStart');
    expect(
      soundForTimerTransition(
        snapshot('longBreak', 'running'),
        snapshot('focus', 'idle'),
      ),
    ).toBe('breakEnd');
  });

  it('stays silent for unrelated state changes', () => {
    expect(
      soundForTimerTransition(
        snapshot('focus', 'idle'),
        snapshot('focus', 'running'),
      ),
    ).toBeNull();
  });
});

describe('useTimerSoundEffects', () => {
  it('preloads once and plays the resolved transition sound', () => {
    const { rerender } = renderHook(
      ({ phase, status }: TimerSoundSnapshot) =>
        useTimerSoundEffects(phase, status),
      { initialProps: snapshot('focus', 'running') },
    );

    expect(preloadSounds).toHaveBeenCalledTimes(1);
    expect(playSound).not.toHaveBeenCalled();

    rerender(snapshot('focus', 'flowState'));

    expect(playSound).toHaveBeenCalledWith('complete');
    expect(preloadSounds).toHaveBeenCalledTimes(1);
  });
});
