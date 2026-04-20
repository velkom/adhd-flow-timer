import { describe, it, expect } from 'vitest';
import {
  isOvertimeDisplay,
  timerDigitsAriaLabel,
  timerDigitsText,
  overtimeTotalSubtitle,
} from './timerDisplayLabels';

describe('timerDigitsAriaLabel', () => {
  it('uses break copy when in break overtime', () => {
    expect(
      timerDigitsAriaLabel(true, 30, 'shortBreak', -30),
    ).toContain('planned break');
  });

  it('uses focus copy when in focus overtime', () => {
    expect(
      timerDigitsAriaLabel(true, 30, 'focus', -30),
    ).toContain('planned focus');
  });

  it('uses remaining wording when not overtime', () => {
    expect(timerDigitsAriaLabel(false, 0, 'focus', 120)).toBe(
      '120 seconds remaining',
    );
  });
});

describe('timerDigitsText', () => {
  it('shows overtime digits when overtime', () => {
    expect(timerDigitsText(true, 65, -65)).toBe('01:05');
  });

  it('shows countdown when not overtime', () => {
    expect(timerDigitsText(false, 0, 90)).toBe('01:30');
  });
});

describe('overtimeTotalSubtitle', () => {
  it('matches focus formatter', () => {
    expect(overtimeTotalSubtitle('focus', 60)).toContain('zone');
  });

  it('matches break formatter', () => {
    expect(overtimeTotalSubtitle('shortBreak', 60)).toContain('break');
  });
});

describe('isOvertimeDisplay', () => {
  it('is true when not idle and no time left', () => {
    expect(isOvertimeDisplay(0, 'running')).toBe(true);
    expect(isOvertimeDisplay(-1, 'paused')).toBe(true);
  });

  it('is false when idle', () => {
    expect(isOvertimeDisplay(-5, 'idle')).toBe(false);
  });
});
