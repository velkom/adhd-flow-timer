import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSessions,
  saveSessions,
  loadSettings,
  saveSettings,
  migrateLegacyData,
  STORAGE_KEYS,
} from './storage';
import { DEFAULT_SETTINGS } from './types';
import type { Session, TimerSettings } from './types';

beforeEach(() => {
  localStorage.clear();
});

describe('sessions persistence', () => {
  const mockSession: Session = {
    id: 'test-1',
    type: 'focus',
    startedAt: '2026-04-03T10:00:00Z',
    endedAt: '2026-04-03T10:25:00Z',
    plannedDuration: 1500,
    actualDuration: 1500,
    flowStateDuration: 0,
    completed: true,
  };

  it('returns empty array when no data stored', () => {
    expect(loadSessions()).toEqual([]);
  });

  it('round-trips sessions through save/load', () => {
    saveSessions([mockSession]);
    const loaded = loadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-1');
    expect(loaded[0].type).toBe('focus');
  });

  it('handles corrupted data gracefully', () => {
    localStorage.setItem(STORAGE_KEYS.sessions, 'not-json{{{');
    expect(loadSessions()).toEqual([]);
  });
});

describe('settings persistence', () => {
  it('returns defaults when no data stored', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips settings through save/load', () => {
    const custom: TimerSettings = {
      ...DEFAULT_SETTINGS,
      focusDuration: 30 * 60,
      theme: 'light',
    };
    saveSettings(custom);
    const loaded = loadSettings();
    expect(loaded.focusDuration).toBe(30 * 60);
    expect(loaded.theme).toBe('light');
  });

  it('merges partial stored data with defaults', () => {
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ focusDuration: 600 }),
    );
    const loaded = loadSettings();
    expect(loaded.focusDuration).toBe(600);
    expect(loaded.shortBreakDuration).toBe(DEFAULT_SETTINGS.shortBreakDuration);
  });
});

describe('migrateLegacyData', () => {
  it('migrates flowTimerSessionData to new key', () => {
    const legacyData = {
      sessions: [
        {
          start: '2026-04-03T10:00:00Z',
          end: '2026-04-03T10:25:00Z',
          plannedDuration: 1500,
          actualDuration: 1500,
          flowStateDuration: 0,
          isCompleted: true,
          type: 'focus',
        },
      ],
      currentSession: null,
    };
    localStorage.setItem('flowTimerSessionData', JSON.stringify(legacyData));

    migrateLegacyData();

    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toBe('focus');
    expect(sessions[0].completed).toBe(true);
    expect(localStorage.getItem('flowTimerSessionData')).toBeNull();
  });

  it('migrates session_data array format', () => {
    const legacyArray = [
      {
        start: '2026-04-03T10:00:00Z',
        end: '2026-04-03T10:25:00Z',
        plannedDuration: 1500,
        actualDuration: 1500,
        flowStateDuration: 300,
        isCompleted: true,
        type: 'focus',
      },
    ];
    localStorage.setItem('session_data', JSON.stringify(legacyArray));

    migrateLegacyData();

    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].flowStateDuration).toBe(300);
    expect(localStorage.getItem('session_data')).toBeNull();
  });

  it('does nothing when no legacy data exists', () => {
    migrateLegacyData();
    expect(loadSessions()).toEqual([]);
  });

  it('migrates legacy timer_settings', () => {
    const legacySettings = {
      focusTime: 30,
      breakTime: 10,
      longBreakTime: 20,
      sessionsBeforeLongBreak: 3,
      enableVisualCues: false,
      enableSoundNotifications: true,
      visualCueIntensity: 7,
      accentColor: '#ff0000',
      theme: 'light',
    };
    localStorage.setItem('timer_settings', JSON.stringify(legacySettings));

    migrateLegacyData();

    const settings = loadSettings();
    expect(settings.focusDuration).toBe(30 * 60);
    expect(settings.shortBreakDuration).toBe(10 * 60);
    expect(settings.theme).toBe('light');
    expect(localStorage.getItem('timer_settings')).toBeNull();
  });
});
