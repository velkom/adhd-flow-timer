import { DEFAULT_SETTINGS } from './types';
import type { Session, TimerSettings } from './types';

export const STORAGE_KEYS = {
  sessions: 'ft_sessions',
  settings: 'ft_settings',
} as const;

const LEGACY_KEYS = {
  flowTimerSessionData: 'flowTimerSessionData',
  sessionData: 'session_data',
  timerSettings: 'timer_settings',
  theme: 'theme',
} as const;

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sessions);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: TimerSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

interface LegacySession {
  start?: string;
  end?: string;
  plannedDuration?: number;
  actualDuration?: number;
  flowStateDuration?: number;
  isCompleted?: boolean;
  type?: string;
}

function convertLegacySession(legacy: LegacySession): Session {
  return {
    id: crypto.randomUUID(),
    type: legacy.type === 'break' ? 'break' : 'focus',
    startedAt: legacy.start ?? new Date().toISOString(),
    endedAt: legacy.end ?? new Date().toISOString(),
    plannedDuration: legacy.plannedDuration ?? 0,
    actualDuration: legacy.actualDuration ?? 0,
    flowStateDuration: legacy.flowStateDuration ?? 0,
    completed: legacy.isCompleted ?? false,
  };
}

export function migrateLegacyData(): void {
  // Migrate flowTimerSessionData (object with .sessions array)
  const ftData = localStorage.getItem(LEGACY_KEYS.flowTimerSessionData);
  if (ftData) {
    try {
      const parsed = JSON.parse(ftData);
      const legacySessions: LegacySession[] = parsed.sessions ?? [];
      const converted = legacySessions.map(convertLegacySession);
      if (converted.length > 0) {
        const existing = loadSessions();
        saveSessions([...existing, ...converted]);
      }
    } catch {
      // Silently ignore corrupt data
    }
    localStorage.removeItem(LEGACY_KEYS.flowTimerSessionData);
  }

  // Migrate session_data (plain array)
  const sdData = localStorage.getItem(LEGACY_KEYS.sessionData);
  if (sdData) {
    try {
      const legacySessions: LegacySession[] = JSON.parse(sdData);
      const converted = legacySessions.map(convertLegacySession);
      if (converted.length > 0) {
        const existing = loadSessions();
        saveSessions([...existing, ...converted]);
      }
    } catch {
      // Silently ignore
    }
    localStorage.removeItem(LEGACY_KEYS.sessionData);
  }

  // Migrate timer_settings
  const tsData = localStorage.getItem(LEGACY_KEYS.timerSettings);
  if (tsData) {
    try {
      const legacy = JSON.parse(tsData);
      const settings: TimerSettings = {
        ...DEFAULT_SETTINGS,
        focusDuration: (legacy.focusTime ?? 25) * 60,
        shortBreakDuration: (legacy.breakTime ?? 5) * 60,
        longBreakDuration: (legacy.longBreakTime ?? 15) * 60,
        sessionsBeforeLongBreak: legacy.sessionsBeforeLongBreak ?? 4,
        enableVisualCues: legacy.enableVisualCues ?? true,
        enableSoundNotifications: legacy.enableSoundNotifications ?? false,
        visualCueIntensity: legacy.visualCueIntensity ?? 5,
        accentColor: legacy.accentColor ?? DEFAULT_SETTINGS.accentColor,
        theme: legacy.theme ?? 'dark',
      };
      saveSettings(settings);
    } catch {
      // Silently ignore
    }
    localStorage.removeItem(LEGACY_KEYS.timerSettings);
  }

  // Clean up old theme key
  const legacyTheme = localStorage.getItem(LEGACY_KEYS.theme);
  if (legacyTheme) {
    const settings = loadSettings();
    settings.theme = legacyTheme === 'light' ? 'light' : 'dark';
    saveSettings(settings);
    localStorage.removeItem(LEGACY_KEYS.theme);
  }
}
