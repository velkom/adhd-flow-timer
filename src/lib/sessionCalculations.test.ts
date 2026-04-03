import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  filterSessionsByTimeframe,
  analyzeTimePatterns,
} from './sessionCalculations';
import type { Session } from './types';

function makeFocusSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    type: 'focus',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    plannedDuration: 25 * 60,
    actualDuration: 25 * 60,
    flowStateDuration: 0,
    completed: true,
    ...overrides,
  };
}

function makeBreakSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    type: 'break',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    plannedDuration: 5 * 60,
    actualDuration: 5 * 60,
    flowStateDuration: 0,
    completed: true,
    ...overrides,
  };
}

describe('calculateStats', () => {
  it('returns zeroes for empty array', () => {
    const stats = calculateStats([]);
    expect(stats.totalFocusMinutes).toBe(0);
    expect(stats.totalFlowMinutes).toBe(0);
    expect(stats.totalBreakMinutes).toBe(0);
    expect(stats.avgSessionMinutes).toBe(0);
    expect(stats.flowStatePercentage).toBe(0);
    expect(stats.completedSessions).toBe(0);
  });

  it('calculates focus sessions correctly', () => {
    const sessions = [
      makeFocusSession({ actualDuration: 30 * 60, flowStateDuration: 5 * 60 }),
      makeFocusSession({ actualDuration: 25 * 60, flowStateDuration: 0 }),
    ];
    const stats = calculateStats(sessions);
    expect(stats.totalFocusMinutes).toBe(55);
    expect(stats.totalFlowMinutes).toBe(5);
    expect(stats.completedSessions).toBe(2);
    expect(stats.avgSessionMinutes).toBe(25);
    expect(stats.flowStatePercentage).toBe(Math.round((5 / 55) * 100));
  });

  it('calculates break sessions correctly', () => {
    const sessions = [
      makeBreakSession({ actualDuration: 5 * 60 }),
      makeBreakSession({ actualDuration: 10 * 60 }),
    ];
    const stats = calculateStats(sessions);
    expect(stats.totalBreakMinutes).toBe(15);
    expect(stats.completedSessions).toBe(0);
  });

  it('handles mixed sessions', () => {
    const sessions = [
      makeFocusSession({ actualDuration: 25 * 60 }),
      makeBreakSession({ actualDuration: 5 * 60 }),
      makeFocusSession({ actualDuration: 30 * 60, flowStateDuration: 5 * 60 }),
    ];
    const stats = calculateStats(sessions);
    expect(stats.totalFocusMinutes).toBe(55);
    expect(stats.totalBreakMinutes).toBe(5);
    expect(stats.completedSessions).toBe(2);
  });
});

describe('filterSessionsByTimeframe', () => {
  it('filters to today only', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessions = [
      makeFocusSession({ startedAt: today.toISOString() }),
      makeFocusSession({ startedAt: yesterday.toISOString() }),
    ];

    const filtered = filterSessionsByTimeframe(sessions, 'day');
    expect(filtered).toHaveLength(1);
  });

  it('filters to this week', () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 8);

    const sessions = [
      makeFocusSession({ startedAt: today.toISOString() }),
      makeFocusSession({ startedAt: lastWeek.toISOString() }),
    ];

    const filtered = filterSessionsByTimeframe(sessions, 'week');
    expect(filtered).toHaveLength(1);
  });

  it('filters to this month', () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);

    const sessions = [
      makeFocusSession({ startedAt: today.toISOString() }),
      makeFocusSession({ startedAt: lastMonth.toISOString() }),
    ];

    const filtered = filterSessionsByTimeframe(sessions, 'month');
    expect(filtered).toHaveLength(1);
  });

  it('returns empty array if no sessions match', () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const sessions = [makeFocusSession({ startedAt: lastYear.toISOString() })];
    expect(filterSessionsByTimeframe(sessions, 'day')).toHaveLength(0);
  });
});

describe('analyzeTimePatterns', () => {
  it('returns null with fewer than 5 sessions', () => {
    const sessions = [makeFocusSession(), makeFocusSession()];
    expect(analyzeTimePatterns(sessions)).toBeNull();
  });

  it('identifies most productive hour', () => {
    const hour = 14;
    const sessions = Array.from({ length: 6 }, () => {
      const d = new Date();
      d.setHours(hour, 0, 0, 0);
      return makeFocusSession({ startedAt: d.toISOString() });
    });

    const result = analyzeTimePatterns(sessions);
    expect(result).not.toBeNull();
    expect(result).toContain('2 PM');
  });
});
