import { useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import bugLine from '@iconify-icons/mingcute/bug-line';
import { AnimatedText } from '@/components/AnimatedText';
import type { TimerPhase, TimerStatus } from '@/lib/types';
import {
  isOvertimeDisplay,
  overtimeTotalSubtitle,
  phaseLabel,
  timerDigitsAriaLabel,
  timerDigitsText,
} from './timerDisplayLabels';
import styles from './TimerDisplay.module.css';

const TRIPLE_CLICK_WINDOW_MS = 500;

interface TimerDisplayProps {
  remainingSeconds: number;
  elapsedSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  debugActive?: boolean;
  onDebugToggle?: () => void;
}

/** Split "MM:SS" into big MM and smaller superscript-style SS (reference style). */
function splitDigits(text: string): { head: string; tail: string | null } {
  // text can be "MM:SS" or "-MM:SS"
  const stripped = text.startsWith('-') ? text.slice(1) : text;
  const sign = text.startsWith('-') ? '-' : '';
  const [mm, ss] = stripped.split(':');
  if (!ss) return { head: text, tail: null };
  return { head: `${sign}${mm}`, tail: ss };
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
  const isTicking = status === 'running' || status === 'flowState';
  const pastSeconds = Math.floor(Math.abs(remainingSeconds));
  const digitsText = timerDigitsText(isOvertime, pastSeconds, remainingSeconds);
  const digitsAria = timerDigitsAriaLabel(
    isOvertime,
    pastSeconds,
    phase,
    remainingSeconds,
  );

  const { head, tail } = splitDigits(digitsText);

  return (
    <div className={styles.timerDisplay}>
      <span className={styles.timerTopline}>
        <AnimatedText
          value={phaseLabel(phase, isOvertime)}
          className={styles.timerPhaseLabel}
        />
        {isOvertime && <span className={styles.timerFlowBadge}>Flow</span>}
      </span>

      <span
        className={styles.timerDigits}
        aria-label={digitsAria}
        onClick={handleDigitsClick}
      >
        <span>{head}</span>
        {tail && (
          <>
            <span
              className={`${styles.timerDigitsColon} ${
                isTicking ? styles.timerDigitsColonActive : ''
              }`}
              aria-hidden="true"
            >
              :
            </span>
            <span className={styles.timerDigitsTail}>{tail}</span>
          </>
        )}
        {debugActive && (
          <span className={styles.debugIndicator} aria-label="Debug mode active">
            <Icon icon={bugLine} width={14} />
          </span>
        )}
      </span>

      {isOvertime && (
        <span className={styles.timerTotalLabel}>
          {overtimeTotalSubtitle(phase, elapsedSeconds)}
        </span>
      )}
    </div>
  );
}
