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
  onFinishRequest: () => void;
  onReset: () => void;
}

export function ControlButtons({
  status,
  phase,
  onStart,
  onPause,
  onResume,
  onSkip,
  onFinishRequest,
  onReset,
}: ControlButtonsProps) {
  const isActive = status === 'running' || status === 'flowState';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const showPauseIcon = isActive;

  const handlePrimaryClick = () => {
    if (isIdle) onStart();
    else if (isActive) onPause();
    else onResume();
  };

  const primaryAriaLabel = isIdle
    ? 'Start timer'
    : isActive
      ? 'Pause timer'
      : 'Resume timer';

  const skipLabel = phase === 'focus' ? 'Skip to Break' : 'Skip to Focus';

  return (
    <div className="control-buttons">
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

      <button
        type="button"
        className={`control-btn control-btn--primary ${showPauseIcon ? 'control-btn--pause' : ''}`}
        onClick={handlePrimaryClick}
        aria-label={primaryAriaLabel}
      >
        <span className="control-btn__icon-morph" aria-hidden>
          <span
            className={`control-btn__icon-layer ${showPauseIcon ? '' : 'control-btn__icon-layer--visible'}`}
          >
            <Icon icon={playFill} width={28} />
          </span>
          <span
            className={`control-btn__icon-layer ${showPauseIcon ? 'control-btn__icon-layer--visible' : ''}`}
          >
            <Icon icon={pauseFill} width={28} />
          </span>
        </span>
      </button>

      {(isActive || isPaused) && (
        <button
          type="button"
          className="control-btn control-btn--stop"
          onClick={onFinishRequest}
          aria-label="Finish session"
        >
          <Icon icon={stopFill} width={20} />
          <span>Finish</span>
        </button>
      )}
    </div>
  );
}
