import { describe, it, expect } from 'vitest';
import { isOvertimeActive, overtimeTitle } from './overtimeAlert';
import type { TimerStatus } from './types';

describe('isOvertimeActive', () => {
  it('is true only in flow state', () => {
    const cases: Array<[TimerStatus, boolean]> = [
      ['idle', false],
      ['running', false],
      ['paused', false],
      ['flowState', true],
    ];
    for (const [status, expected] of cases) {
      expect(isOvertimeActive(status)).toBe(expected);
    }
  });
});

describe('overtimeTitle', () => {
  it('shows the alert frame with the overtime amount', () => {
    expect(overtimeTitle('focus', 724, true)).toBe("⏰ Time's up! +12:04");
  });

  it('names the planned block on the other frame', () => {
    expect(overtimeTitle('focus', 724, false)).toBe('+12:04 past planned focus');
    expect(overtimeTitle('shortBreak', 65, false)).toBe('+01:05 past planned break');
    expect(overtimeTitle('longBreak', 65, false)).toBe('+01:05 past planned break');
  });
});
