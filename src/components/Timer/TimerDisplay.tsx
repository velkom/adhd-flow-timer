import { formatTimerDisplay } from '../../lib/formatters';
import type { TimerPhase, TimerStatus } from '../../lib/types';

interface TimerDisplayProps {
  remainingSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  flowSeconds: number;
}

function phaseLabel(phase: TimerPhase, status: TimerStatus): string {
  if (status === 'flowState') return 'Flow State';
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
      return 'In the zone';
  }
}

export function TimerDisplay({
  remainingSeconds,
  phase,
  status,
  flowSeconds,
}: TimerDisplayProps) {
  return (
    <div className="timer-display" role="timer" aria-live="polite">
      <span className="timer-digits" aria-label={`${Math.abs(remainingSeconds)} seconds remaining`}>
        {formatTimerDisplay(remainingSeconds)}
      </span>
      <span className="timer-phase-label">{phaseLabel(phase, status)}</span>
      <span className="timer-status-label">{statusLabel(status)}</span>
      {status === 'flowState' && flowSeconds > 0 && (
        <span className="timer-flow-badge">
          +{Math.floor(flowSeconds / 60)}m in flow
        </span>
      )}
    </div>
  );
}
