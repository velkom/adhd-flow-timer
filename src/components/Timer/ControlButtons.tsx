import { Icon } from '@iconify/react';
import playFill from '@iconify-icons/mingcute/play-fill';
import pauseFill from '@iconify-icons/mingcute/pause-fill';
import skipForwardFill from '@iconify-icons/mingcute/skip-forward-fill';
import refreshAnticlockwise1Line from '@iconify-icons/mingcute/refresh-anticlockwise-1-line';
import stopFill from '@iconify-icons/mingcute/stop-fill';
import type { TimerStatus, TimerPhase } from '../../lib/types';

interface ControlButtonsProps {
  status: TimerStatus;
  phase: TimerPhase;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function ControlButtons({
  status,
  phase,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
}: ControlButtonsProps) {
  const isActive = status === 'running' || status === 'flowState';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const skipLabel = phase === 'focus' ? 'Skip to Break' : 'Skip to Focus';

  return (
    <div className="control-buttons">
      {/* Top row: Reset + Skip */}
      <div className="control-buttons-row control-buttons-row--secondary">
        <button
          className="control-btn control-btn--secondary"
          onClick={onReset}
          disabled={isIdle}
          aria-label="Reset"
        >
          <Icon icon={refreshAnticlockwise1Line} width={22} />
        </button>
        <button
          className="control-btn control-btn--secondary"
          onClick={onSkip}
          disabled={isIdle}
          aria-label={skipLabel}
        >
          <Icon icon={skipForwardFill} width={22} />
        </button>
      </div>

      {/* Main action button */}
      {isIdle && (
        <button
          className="control-btn control-btn--primary"
          onClick={onStart}
          aria-label="Start timer"
        >
          <Icon icon={playFill} width={28} />
        </button>
      )}

      {isActive && (
        <button
          className="control-btn control-btn--primary control-btn--pause"
          onClick={onPause}
          aria-label="Pause timer"
        >
          <Icon icon={pauseFill} width={28} />
        </button>
      )}

      {isPaused && (
        <button
          className="control-btn control-btn--primary"
          onClick={onResume}
          aria-label="Resume timer"
        >
          <Icon icon={playFill} width={28} />
        </button>
      )}

      {(isActive || isPaused) && (
        <button
          className="control-btn control-btn--stop"
          onClick={onSkip}
          aria-label="Finish session"
        >
          <Icon icon={stopFill} width={20} />
          <span>Finish</span>
        </button>
      )}
    </div>
  );
}
