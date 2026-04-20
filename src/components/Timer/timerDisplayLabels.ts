import {
  formatTimerDisplay,
  formatOvertimePastDisplay,
  formatOvertimePastAriaLabel,
  formatTotalFocusLabel,
  formatTotalBreakLabel,
} from '@/lib/formatters';
import type { TimerPhase, TimerStatus } from '@/lib/types';

export function phaseLabel(phase: TimerPhase, isOvertime: boolean): string {
  if (isOvertime) {
    return phase === 'focus' ? 'Past planned focus' : 'Past planned break';
  }
  switch (phase) {
    case 'focus':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
}

export function statusLabel(status: TimerStatus, phase: TimerPhase): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'running':
    case 'flowState':
      return phase === 'focus' ? 'Focusing' : 'Resting';
    case 'paused':
      return 'Paused';
  }
}

export function isOvertimeDisplay(
  remainingSeconds: number,
  status: TimerStatus,
): boolean {
  return remainingSeconds <= 0 && status !== 'idle';
}

function overtimeAriaVariant(phase: TimerPhase): 'focus' | 'break' {
  return phase === 'focus' ? 'focus' : 'break';
}

export function timerDigitsAriaLabel(
  isOvertime: boolean,
  pastSeconds: number,
  phase: TimerPhase,
  remainingSeconds: number,
): string {
  if (isOvertime) {
    return formatOvertimePastAriaLabel(pastSeconds, overtimeAriaVariant(phase));
  }
  return `${Math.abs(remainingSeconds)} seconds remaining`;
}

export function timerDigitsText(
  isOvertime: boolean,
  pastSeconds: number,
  remainingSeconds: number,
): string {
  return isOvertime
    ? formatOvertimePastDisplay(pastSeconds)
    : formatTimerDisplay(remainingSeconds);
}

export function overtimeTotalSubtitle(
  phase: TimerPhase,
  elapsedSeconds: number,
): string {
  switch (phase) {
    case 'focus':
      return formatTotalFocusLabel(elapsedSeconds);
    case 'shortBreak':
    case 'longBreak':
      return formatTotalBreakLabel(elapsedSeconds);
  }
}
