import { useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import bugLine from '@iconify-icons/mingcute/bug-line';
import { formatTimerDisplay } from '../../lib/formatters';
import type { TimerPhase, TimerStatus } from '../../lib/types';

const TRIPLE_CLICK_WINDOW_MS = 500;

interface TimerDisplayProps {
  remainingSeconds: number;
  elapsedSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  debugActive?: boolean;
  onDebugToggle?: () => void;
}

function phaseLabel(phase: TimerPhase, status: TimerStatus): string {
  if (status === 'flowState') return 'Timer complete';
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
      return 'Focusing';
    case 'paused':
      return 'Paused';
    case 'flowState':
      return 'Keep going — you\'re in the zone!';
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

  const isFlow = status === 'flowState';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  return (
    <div className="timer-display" role="timer" aria-live="polite">
      <span
        className="timer-digits"
        aria-label={
          isFlow
            ? `${elapsedMinutes} minutes elapsed`
            : `${Math.abs(remainingSeconds)} seconds remaining`
        }
        onClick={handleDigitsClick}
      >
        {isFlow ? `${elapsedMinutes} min` : formatTimerDisplay(remainingSeconds)}
        {debugActive && (
          <span className="debug-indicator" aria-label="Debug mode active">
            <Icon icon={bugLine} width={14} />
          </span>
        )}
      </span>
      <span className="timer-phase-label">{phaseLabel(phase, status)}</span>
      <span className="timer-status-label">{statusLabel(status)}</span>
    </div>
  );
}
