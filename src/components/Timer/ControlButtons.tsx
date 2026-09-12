import { Icon } from '@iconify/react';
import playFill from '@iconify-icons/mingcute/play-fill';
import pauseFill from '@iconify-icons/mingcute/pause-fill';
import skipForwardFill from '@iconify-icons/mingcute/skip-forward-fill';
import refreshAnticlockwise1Line from '@iconify-icons/mingcute/refresh-anticlockwise-1-line';
import type { TimerStatus, TimerPhase } from '@/lib/types';
import styles from './ControlButtons.module.css';

interface ControlButtonsProps {
  status: TimerStatus;
  phase: TimerPhase;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onResetRequest: () => void;
}

type PrimaryAction = 'start' | 'pause' | 'resume';

interface PrimaryControl {
  action: PrimaryAction;
  label: string;
  ariaLabel: string;
}

function primaryControlForStatus(status: TimerStatus): PrimaryControl {
  switch (status) {
    case 'idle':
      return { action: 'start', label: 'Start', ariaLabel: 'Start timer' };
    case 'running':
    case 'flowState':
      return { action: 'pause', label: 'Pause', ariaLabel: 'Pause timer' };
    case 'paused':
      return { action: 'resume', label: 'Resume', ariaLabel: 'Resume timer' };
    default: {
      const exhaustiveStatus: never = status;
      return exhaustiveStatus;
    }
  }
}

export function ControlButtons({
  status,
  phase,
  onStart,
  onPause,
  onResume,
  onSkip,
  onResetRequest,
}: ControlButtonsProps) {
  const isIdle = status === 'idle';
  const primaryControl = primaryControlForStatus(status);
  const showPauseIcon = primaryControl.action === 'pause';

  const handlePrimaryClick = () => {
    switch (primaryControl.action) {
      case 'start':
        onStart();
        return;
      case 'pause':
        onPause();
        return;
      case 'resume':
        onResume();
        return;
      default: {
        const exhaustiveAction: never = primaryControl.action;
        return exhaustiveAction;
      }
    }
  };

  const isFocus = phase === 'focus';
  const transitionLabel = isFocus ? 'Next' : 'Focus';
  const transitionAriaLabel = isFocus
    ? 'End focus session and start break'
    : 'End break and return to focus';

  return (
    <div className={styles.controlButtons}>
      <button
        type="button"
        className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
        onClick={onResetRequest}
        disabled={isIdle}
      >
        <Icon icon={refreshAnticlockwise1Line} width={20} aria-hidden="true" />
        <span>Reset</span>
      </button>

      <button
        type="button"
        className={`${styles.controlBtn} ${styles.controlBtnPrimary} ${showPauseIcon ? styles.controlBtnPause : ''}`}
        onClick={handlePrimaryClick}
        aria-label={primaryControl.ariaLabel}
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
        <span>{primaryControl.label}</span>
      </button>

      <button
        type="button"
        className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
        onClick={onSkip}
        disabled={isIdle && isFocus}
        aria-label={transitionAriaLabel}
      >
        <Icon icon={skipForwardFill} width={20} aria-hidden="true" />
        <span>{transitionLabel}</span>
      </button>
    </div>
  );
}
