import { Bug, Zap, Clock, X } from 'lucide-react';
import type { TimerStatus } from '../../lib/types';

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

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <div className="debug-panel-title">
          <Bug size={14} />
          <span>Debug Controls</span>
        </div>
        <button
          className="debug-close-btn"
          onClick={onClose}
          aria-label="Close debug panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="debug-section">
        <div className="debug-section-label">
          <Zap size={12} />
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
          <Clock size={12} />
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
    </div>
  );
}
