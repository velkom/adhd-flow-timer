import { Icon } from '@iconify/react';
import bugLine from '@iconify-icons/mingcute/bug-line';
import flashLine from '@iconify-icons/mingcute/flash-line';
import timeLine from '@iconify-icons/mingcute/time-line';
import closeLine from '@iconify-icons/mingcute/close-line';
import volumeLine from '@iconify-icons/mingcute/volume-line';
import type { TimerStatus } from '../../lib/types';
import { forcePlay, ALL_SOUND_EFFECTS, SOUND_LABELS } from '../../lib/sounds';
import type { SoundEffect } from '../../lib/sounds';

const SPEED_OPTIONS = [1, 4, 8, 16] as const;

const TIME_OPTIONS = [
  { label: '+20s', seconds: 20 },
  { label: '+1m', seconds: 60 },
  { label: '+5m', seconds: 300 },
] as const;

interface DebugPanelProps {
  speedMultiplier: number;
  timerStatus: TimerStatus;
  onSetSpeed: (multiplier: number) => void;
  onAddTime: (seconds: number) => void;
  onClose: () => void;
}

export function DebugPanel({
  speedMultiplier,
  timerStatus,
  onSetSpeed,
  onAddTime,
  onClose,
}: DebugPanelProps) {
  const isIdle = timerStatus === 'idle';

  const handleSoundPreview = (effect: SoundEffect) => {
    forcePlay(effect);
  };

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <div className="debug-panel-title">
          <Icon icon={bugLine} width={14} />
          <span>Debug Controls</span>
        </div>
        <button
          className="debug-close-btn"
          onClick={onClose}
          aria-label="Close debug panel"
        >
          <Icon icon={closeLine} width={16} />
        </button>
      </div>

      <div className="debug-section">
        <div className="debug-section-label">
          <Icon icon={flashLine} width={12} />
          <span>Speed</span>
        </div>
        <div className="debug-pills">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              className={`debug-pill ${speedMultiplier === speed ? 'debug-pill--active' : ''}`}
              onClick={() => onSetSpeed(speed)}
            >
              x{speed}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-section-label">
          <Icon icon={timeLine} width={12} />
          <span>Skip Forward</span>
        </div>
        <div className="debug-pills">
          {TIME_OPTIONS.map(({ label, seconds }) => (
            <button
              key={seconds}
              className="debug-pill debug-pill--action"
              onClick={() => onAddTime(seconds)}
              disabled={isIdle}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-section-label">
          <Icon icon={volumeLine} width={12} />
          <span>Sound Preview</span>
        </div>
        <div className="debug-pills debug-pills--wrap">
          {ALL_SOUND_EFFECTS.map((effect) => (
            <button
              key={effect}
              className="debug-pill debug-pill--action"
              onClick={() => handleSoundPreview(effect)}
            >
              {SOUND_LABELS[effect]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
