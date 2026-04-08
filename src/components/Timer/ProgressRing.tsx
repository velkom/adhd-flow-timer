import { useRef, useEffect } from 'react';
import type { TimerPhase, TimerStatus } from '@/lib/types';
import styles from './Timer.module.css';

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  /** 0..1 representing how far through the timer we are */
  progress: number;
  phase: TimerPhase;
  status: TimerStatus;
}

function getStrokeColor(phase: TimerPhase, status: TimerStatus): string {
  if (status === 'flowState') return 'var(--color-flow)';
  switch (phase) {
    case 'focus':
      return 'var(--color-focus)';
    case 'shortBreak':
    case 'longBreak':
      return 'var(--color-break)';
  }
}

export function ProgressRing({ progress, phase, status }: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 1));
    circleRef.current.style.strokeDashoffset = String(offset);
  }, [progress]);

  const strokeColor = getStrokeColor(phase, status);
  const isFlow = status === 'flowState';

  return (
    <div className={styles.progressRingWrapper} aria-hidden="true">
      <svg className={styles.progressRingSvg} viewBox="0 0 300 300">
        {/* Glow filter */}
        <defs>
          <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          className={styles.progressRingTrack}
          cx="150"
          cy="150"
          r={RADIUS}
          fill="transparent"
          strokeWidth="8"
        />

        {/* Progress arc */}
        <circle
          ref={circleRef}
          className={`${styles.progressRingBar} ${isFlow ? styles.progressRingBarFlow : ''}`}
          cx="150"
          cy="150"
          r={RADIUS}
          fill="transparent"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          style={{ stroke: strokeColor }}
          filter="url(#ring-glow)"
        />
      </svg>
    </div>
  );
}
