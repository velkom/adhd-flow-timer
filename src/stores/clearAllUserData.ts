import { useSessionStore } from './sessionStore';
import { useSettingsStore } from './settingsStore';
import { useTimerStore } from './timerStore';

/** Clears session history, restores default settings, and resets the persisted timer cycle. */
export function clearAllUserData(): void {
  useSessionStore.getState().clearSessions();
  useSettingsStore.getState().resetSettings();
  useTimerStore.getState().resetStoredTimer();
}
