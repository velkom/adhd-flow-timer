import { useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import bugLine from '@iconify-icons/mingcute/bug-line';
import type { TimerPhase, TimerStatus } from '@/lib/types';
import {
  isOvertimeDisplay,
  overtimeTotalSubtitle,
  phaseLabel,
  statusLabel,
  timerDigitsAriaLabel,
  timerDigitsText,
} from './timerDisplayLabels';
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

  const isOvertime = isOvertimeDisplay(remainingSeconds, status);
  const pastSeconds = Math.floor(Math.abs(remainingSeconds));
  const digitsText = timerDigitsText(isOvertime, pastSeconds, remainingSeconds);
  const digitsAria = timerDigitsAriaLabel(
    isOvertime,
    pastSeconds,
    phase,
    remainingSeconds,
  );

  return (
    <div className={styles.timerDisplay} role="timer" aria-live="polite">
      <span
        className={styles.timerDigits}
        aria-label={digitsAria}
        onClick={handleDigitsClick}
      >
        {digitsText}
        {debugActive && (
          <span className={styles.debugIndicator} aria-label="Debug mode active">
            <Icon icon={bugLine} width={14} />
          </span>
        )}
      </span>
      <span className={styles.timerPhaseLabel}>
        {phaseLabel(phase, isOvertime)}
      </span>
      <span className={styles.timerStatusLabel}>{statusLabel(status, phase)}</span>
      {isOvertime && (
        <span className={styles.timerTotalLabel}>
          {overtimeTotalSubtitle(phase, elapsedSeconds)}
        </span>
      )}
    </div>
  );
}
