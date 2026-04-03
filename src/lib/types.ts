export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'flowState';

export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  /** Remaining seconds in the current phase (negative in flow state) */
  remainingSeconds: number;
  /** Total elapsed seconds since timer started */
  elapsedSeconds: number;
  /** Which session in the cycle (0-indexed, resets after long break) */
  sessionIndex: number;
  /** Total completed focus sessions */
  completedSessions: number;
  /** Seconds spent in flow state for the current session */
  flowSeconds: number;
}

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  enableVisualCues: boolean;
  enableSoundNotifications: boolean;
  /** App-relative master gain for UI sounds (0–1); does not read OS volume. */
  soundVolume: number;
  visualCueIntensity: number;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
}

export interface Session {
  id: string;
  type: 'focus' | 'break';
  startedAt: string;
  endedAt: string;
  plannedDuration: number;
  actualDuration: number;
  flowStateDuration: number;
  completed: boolean;
}

export type Timeframe = 'day' | 'week' | 'month';

export interface SessionStats {
  totalFocusMinutes: number;
  totalFlowMinutes: number;
  totalBreakMinutes: number;
  avgSessionMinutes: number;
  flowStatePercentage: number;
  completedSessions: number;
}

export type TimerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; elapsed: number }
  | { type: 'SKIP' }
  | { type: 'RESET' }
  | { type: 'SET_PRESET'; duration: number };

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  enableVisualCues: true,
  enableSoundNotifications: false,
  soundVolume: 0.45,
  visualCueIntensity: 5,
  theme: 'dark',
  accentColor: '#ff8c00',
};
