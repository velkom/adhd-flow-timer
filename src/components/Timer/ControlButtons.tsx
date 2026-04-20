import { Icon } from '@iconify/react';
import playFill from '@iconify-icons/mingcute/play-fill';
import pauseFill from '@iconify-icons/mingcute/pause-fill';
import skipForwardFill from '@iconify-icons/mingcute/skip-forward-fill';
import refreshAnticlockwise1Line from '@iconify-icons/mingcute/refresh-anticlockwise-1-line';
import stopFill from '@iconify-icons/mingcute/stop-fill';
import type { TimerStatus, TimerPhase } from '@/lib/types';
import styles from './Timer.module.css';

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

  const primaryText = isIdle
    ? 'Start'
    : isActive
      ? 'Pause'
      : 'Resume';

  return (
    <div className={styles.controlButtons}>
      <button
        className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
        onClick={onReset}
        disabled={isIdle}
        aria-label="Reset"
      >
        <Icon icon={refreshAnticlockwise1Line} width={20} />
      </button>

      <button
        type="button"
        className={`${styles.controlBtn} ${styles.controlBtnPrimary} ${showPauseIcon ? styles.controlBtnPause : ''}`}
        onClick={handlePrimaryClick}
        aria-label={primaryAriaLabel}
      >
        <span className={styles.controlBtnIconMorph} aria-hidden>
          <span
            className={`${styles.controlBtnIconLayer} ${showPauseIcon ? '' : styles.controlBtnIconLayerVisible}`}
          >
            <Icon icon={playFill} width={22} />
          </span>
          <span
            className={`${styles.controlBtnIconLayer} ${showPauseIcon ? styles.controlBtnIconLayerVisible : ''}`}
          >
            <Icon icon={pauseFill} width={22} />
          </span>
        </span>
        <span>{primaryText}</span>
      </button>

      <button
        className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
        onClick={onSkip}
        disabled={isIdle}
        aria-label={skipLabel}
      >
        <Icon icon={skipForwardFill} width={20} />
      </button>

      {(isActive || isPaused) && (
        <button
          type="button"
          className={`${styles.controlBtn} ${styles.controlBtnStop}`}
          onClick={onFinishRequest}
          aria-label="Finish session"
        >
          <Icon icon={stopFill} width={16} />
          <span>Finish</span>
        </button>
      )}
    </div>
  );
}
