import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatTimerDisplay,
  formatDuration,
  formatSessionLabel,
} from './formatters';

describe('formatTime', () => {
  it('formats zero minutes', () => {
    expect(formatTime(0)).toBe('0m');
  });

  it('formats minutes only', () => {
    expect(formatTime(45)).toBe('45m');
  });

  it('formats hours and minutes', () => {
    expect(formatTime(90)).toBe('1h 30m');
  });

  it('formats exact hours', () => {
    expect(formatTime(120)).toBe('2h 0m');
  });
});

describe('formatTimerDisplay', () => {
  it('formats positive seconds as MM:SS', () => {
    expect(formatTimerDisplay(1500)).toBe('25:00');
    expect(formatTimerDisplay(65)).toBe('01:05');
    expect(formatTimerDisplay(0)).toBe('00:00');
  });

  it('formats negative seconds with minus prefix (flow state)', () => {
    expect(formatTimerDisplay(-65)).toBe('-01:05');
    expect(formatTimerDisplay(-5)).toBe('-00:05');
  });

  it('formats large values correctly', () => {
    expect(formatTimerDisplay(3661)).toBe('61:01');
  });
});

describe('formatDuration', () => {
  it('formats seconds to human-readable', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3600)).toBe('60m');
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatSessionLabel', () => {
  const date = '2026-04-03T14:30:00.000Z';

  it('formats for day timeframe (time only)', () => {
    const label = formatSessionLabel(date, 'day');
    expect(label).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats for week timeframe (day + time)', () => {
    const label = formatSessionLabel(date, 'week');
    expect(label.length).toBeGreaterThan(3);
  });

  it('formats for month timeframe (month + day)', () => {
    const label = formatSessionLabel(date, 'month');
    expect(label).toMatch(/\w+ \d+/);
  });
});
