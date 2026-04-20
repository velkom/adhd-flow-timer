import type { TimerPhase, TimerStatus } from '@/lib/types';
import styles from './Timer.module.css';

interface ProgressBarProps {
  /** 0..1 representing how far through the current phase we are */
  progress: number;
  phase: TimerPhase;
  status: TimerStatus;
  /** Remaining seconds in the current phase — negative in flow state */
  remainingSeconds: number;
  /** Total planned duration for the phase in seconds (used for tick count) */
  phaseDuration: number;
}

function formatShort(seconds: number): string {
  const abs = Math.max(0, Math.round(Math.abs(seconds)));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}H ${mm.toString().padStart(2, '0')}M`;
  }
  return `${m}M ${s.toString().padStart(2, '0')}S`;
}

/** One tick per minute of the phase. Capped so short / very long phases stay readable. */
function minuteTickCount(phaseDuration: number): number {
  const minutes = Math.max(1, Math.round(phaseDuration / 60));
  return Math.min(Math.max(minutes, 5), 120);
}

/** Positions (0..1) of every 10-minute milestone that falls inside the phase. */
function tenMinuteMilestones(phaseDuration: number): number[] {
  const minutes = Math.max(0, phaseDuration / 60);
  if (minutes < 10) return [];
  const out: number[] = [];
  for (let m = 10; m < minutes; m += 10) {
    out.push(m / minutes);
  }
  return out;
}

export function ProgressBar({
  progress,
  phase,
  status,
  remainingSeconds,
  phaseDuration,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const isFlow = status === 'flowState';
  const isBreak = phase === 'shortBreak' || phase === 'longBreak';

  const phaseLabel = isBreak
    ? phase === 'longBreak'
      ? 'Long Break'
      : 'Break'
    : 'Focus';

  const pillText = isFlow
    ? `+${formatShort(Math.max(0, -remainingSeconds))}`
    : formatShort(remainingSeconds);

  const minuteTicks = minuteTickCount(phaseDuration);
  const milestones = tenMinuteMilestones(phaseDuration);

  return (
    <div
      className={`${styles.progressBar} ${isFlow ? styles.progressBarFlow : ''} ${
        isBreak ? styles.progressBarBreak : ''
      }`}
      role="progressbar"
      aria-label={`${phaseLabel} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div className={styles.progressBarHeader}>
        <span className={styles.progressBarLabel}>{phaseLabel}</span>
        <span className={styles.progressBarPill}>{pillText}</span>
      </div>

      <div className={styles.progressBarRail}>
        {/* Background: one tick per minute of the phase */}
        <div className={styles.progressBarTrackTickRow} aria-hidden="true">
          {Array.from({ length: minuteTicks }, (_, i) => (
            <span key={i} className={styles.progressBarTrackTick} />
          ))}
        </div>

        {/* Solid orange fill — overlays the background ticks */}
        <div
          className={styles.progressBarFill}
          style={{ width: `${clamped * 100}%` }}
        />

        {/* 10-minute milestones — sit on top of the rail and show through the fill */}
        {milestones.map((pos, i) => (
          <span
            key={i}
            className={styles.progressBarMilestone}
            style={{ left: `${pos * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
