import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOvertimeBlink, visualCuePeriodMs } from './useOvertimeBlink';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { createInitialState } from '@/lib/timerEngine';
import { OVERTIME_BLINK_PERIOD_MS } from '@/lib/overtimeAlert';
import { DEFAULT_SETTINGS } from '@/lib/types';

const originalMatchMedia = window.matchMedia;

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

function enterOvertime(): void {
  useTimerStore.setState({
    timer: {
      ...createInitialState(DEFAULT_SETTINGS),
      status: 'flowState',
      remainingSeconds: -30,
      elapsedSeconds: DEFAULT_SETTINGS.focusDuration + 30,
      flowSeconds: 30,
    },
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(0);
  mockReducedMotion(false);
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useTimerStore.setState({ timer: createInitialState(DEFAULT_SETTINGS) });
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe('useOvertimeBlink', () => {
  it('maps stronger cue intensity to a faster cadence', () => {
    expect(visualCuePeriodMs(DEFAULT_SETTINGS.visualCueIntensity)).toBe(
      OVERTIME_BLINK_PERIOD_MS,
    );
    expect(visualCuePeriodMs(10)).toBeLessThan(visualCuePeriodMs(1));
  });

  it('is inactive outside overtime and schedules no interval', () => {
    const { result } = renderHook(() => useOvertimeBlink());
    expect(result.current.active).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('alternates frames while in overtime', () => {
    enterOvertime();
    const { result } = renderHook(() => useOvertimeBlink());

    expect(result.current.active).toBe(true);
    const first = result.current.alertFrame;

    act(() => {
      vi.advanceTimersByTime(OVERTIME_BLINK_PERIOD_MS);
    });
    expect(result.current.alertFrame).toBe(!first);

    act(() => {
      vi.advanceTimersByTime(OVERTIME_BLINK_PERIOD_MS);
    });
    expect(result.current.alertFrame).toBe(first);
  });

  it('flips per tick and not from the wall clock, so throttled ticks still alternate', () => {
    enterOvertime();
    const { result } = renderHook(() => useOvertimeBlink());
    const frames = [result.current.alertFrame];

    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(OVERTIME_BLINK_PERIOD_MS);
        // Pin the clock: a frame derived from elapsed time would stall here.
        vi.setSystemTime(0);
      });
      frames.push(result.current.alertFrame);
    }

    expect(frames).toEqual([true, false, true, false]);
  });

  it('holds a static alert frame when visual cues are off', () => {
    enterOvertime();
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, enableVisualCues: false },
    });
    const { result } = renderHook(() => useOvertimeBlink());

    expect(result.current.active).toBe(true);
    expect(result.current.alertFrame).toBe(true);
    expect(document.documentElement.dataset.visualCues).toBe('false');

    act(() => {
      vi.advanceTimersByTime(4 * OVERTIME_BLINK_PERIOD_MS);
    });
    expect(result.current.alertFrame).toBe(true);
  });

  it('holds a static alert frame when reduced motion is preferred', () => {
    mockReducedMotion(true);
    enterOvertime();
    const { result } = renderHook(() => useOvertimeBlink());

    expect(result.current.alertFrame).toBe(true);
    expect(document.documentElement.dataset.visualCues).toBe('false');
    act(() => {
      vi.advanceTimersByTime(4 * OVERTIME_BLINK_PERIOD_MS);
    });
    expect(result.current.alertFrame).toBe(true);
  });

  it('clears the interval on unmount', () => {
    enterOvertime();
    const { unmount } = renderHook(() => useOvertimeBlink());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
