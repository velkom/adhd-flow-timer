import { formatOvertimePastDisplay } from './formatters';
import type { TimerPhase, TimerStatus } from './types';

/**
 * Half-period of the overtime flash: favicon and title swap frames every 500ms.
 * Background tabs clamp timers to ~1s, so the flash is driven by frame flips per
 * tick rather than by elapsed time — it slows down there but never stalls.
 */
export const OVERTIME_BLINK_PERIOD_MS = 500;

/** Title from `index.html`, restored once the timer leaves overtime. */
export const BASE_TITLE = 'Flow Timer — ADHD-Friendly Pomodoro';

/**
 * Overtime attention is limited to a running timer past its planned block.
 * A paused timer sitting in overtime stays static — the user is already aware.
 */
export function isOvertimeActive(status: TimerStatus): boolean {
  return status === 'flowState';
}

function plannedBlockLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return 'planned focus';
    case 'shortBreak':
    case 'longBreak':
      return 'planned break';
  }
}

export function overtimeTitle(
  phase: TimerPhase,
  flowSeconds: number,
  alertFrame: boolean,
): string {
  const past = formatOvertimePastDisplay(flowSeconds);
  if (alertFrame) {
    return `⏰ Time's up! +${past}`;
  }
  return `+${past} past ${plannedBlockLabel(phase)}`;
}
