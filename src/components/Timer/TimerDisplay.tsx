import { useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import bugLine from '@iconify-icons/mingcute/bug-line';
import {
  formatTimerDisplay,
  formatOvertimePastDisplay,
  formatOvertimePastAriaLabel,
  formatTotalFocusLabel,
} from '@/lib/formatters';
import type { TimerPhase, TimerStatus } from '@/lib/types';
import styles from './Timer.module.css';

const TRIPLE_CLICK_WINDOW_MS = 500;

interface TimerDisplayProps {
  remainingSeconds: number;
  elapsedSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  debugActive?: boolean;
  onDebugToggle?: () => void;
}

function phaseLabel(phase: TimerPhase, isFocusOvertime: boolean): string {
  if (isFocusOvertime) return 'Past planned focus';
  switch (phase) {
    case 'focus':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
}

function statusLabel(status: TimerStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'running':
    case 'flowState':
      return 'Focusing';
    case 'paused':
      return 'Paused';
  }
}

export function TimerDisplay({
  remainingSeconds,
  elapsedSeconds,
  phase,
  status,
  debugActive,
  onDebugToggle,
}: TimerDisplayProps) {
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDigitsClick = useCallback(() => {
    if (!onDebugToggle) return;

    clickCount.current += 1;
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onDebugToggle();
      return;
    }

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
      clickTimer.current = null;
    }, TRIPLE_CLICK_WINDOW_MS);
  }, [onDebugToggle]);

  const isFocusOvertime =
    phase === 'focus' && remainingSeconds <= 0 && status !== 'idle';
  const pastSeconds = Math.floor(Math.abs(remainingSeconds));

  return (
    <div className={styles.timerDisplay} role="timer" aria-live="polite">
      <span
        className={styles.timerDigits}
        aria-label={
          isFocusOvertime
            ? formatOvertimePastAriaLabel(pastSeconds)
            : `${Math.abs(remainingSeconds)} seconds remaining`
        }
        onClick={handleDigitsClick}
      >
        {isFocusOvertime
          ? formatOvertimePastDisplay(pastSeconds)
          : formatTimerDisplay(remainingSeconds)}
        {debugActive && (
          <span className={styles.debugIndicator} aria-label="Debug mode active">
            <Icon icon={bugLine} width={14} />
          </span>
        )}
      </span>
      <span className={styles.timerPhaseLabel}>
        {phaseLabel(phase, isFocusOvertime)}
      </span>
      <span className={styles.timerStatusLabel}>{statusLabel(status)}</span>
      {isFocusOvertime && (
        <span className={styles.timerTotalLabel}>
          {formatTotalFocusLabel(elapsedSeconds)}
        </span>
      )}
    </div>
  );
}
