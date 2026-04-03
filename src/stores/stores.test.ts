import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';
import { useSessionStore } from './sessionStore';
import { DEFAULT_SETTINGS } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import type { Session } from '../lib/types';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useSessionStore.setState({ sessions: [] });
});

describe('settingsStore', () => {
  it('starts with defaults', () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.focusDuration).toBe(25 * 60);
  });

  it('persists updates to localStorage', () => {
    useSettingsStore.getState().updateSettings({ focusDuration: 30 * 60 });
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).focusDuration).toBe(30 * 60);
    expect(useSettingsStore.getState().settings.focusDuration).toBe(30 * 60);
  });

  it('resets to defaults and persists', () => {
    useSettingsStore.getState().updateSettings({ focusDuration: 5 * 60 });
    useSettingsStore.getState().resetSettings();
    expect(useSettingsStore.getState().settings.focusDuration).toBe(25 * 60);
  });
});

describe('sessionStore', () => {
  const session: Session = {
    id: 'store-test-1',
    type: 'focus',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    plannedDuration: 1500,
    actualDuration: 1500,
    flowStateDuration: 0,
    completed: true,
  };

  it('starts empty', () => {
    expect(useSessionStore.getState().sessions).toHaveLength(0);
  });

  it('adds sessions and persists', () => {
    useSessionStore.getState().addSession(session);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
    const raw = localStorage.getItem(STORAGE_KEYS.sessions);
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it('clears sessions', () => {
    useSessionStore.getState().addSession(session);
    useSessionStore.getState().clearSessions();
    expect(useSessionStore.getState().sessions).toHaveLength(0);
  });

  it('getStats returns computed stats', () => {
    useSessionStore.getState().addSession(session);
    const stats = useSessionStore.getState().getStats('day');
    expect(stats.completedSessions).toBe(1);
    expect(stats.totalFocusMinutes).toBe(25);
  });
});
