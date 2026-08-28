import { useEffect, useState } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { isOvertimeActive } from '@/lib/overtimeAlert';

export interface OvertimeBlink {
  /** Timer is running past its planned block. */
  active: boolean;
  /** Whether the attention-grabbing frame is currently showing. */
  alertFrame: boolean;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MIN_CUE_INTENSITY = 1;
const MAX_CUE_INTENSITY = 10;

function clampCueIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) return 5;
  return Math.min(MAX_CUE_INTENSITY, Math.max(MIN_CUE_INTENSITY, intensity));
}

export function visualCuePeriodMs(intensity: number): number {
  const level = clampCueIntensity(intensity);
  return Math.max(250, 800 - (level - 1) * 75);
}

/**
 * Drives the overtime flash. Call once and pass the result to every consumer
 * (favicon, document title) so they share one interval and stay in phase.
 */
export function useOvertimeBlink(): OvertimeBlink {
  const status = useTimerStore((s) => s.timer.status);
  const enableVisualCues = useSettingsStore((s) => s.settings.enableVisualCues);
  const visualCueIntensity = useSettingsStore(
    (s) => s.settings.visualCueIntensity,
  );
  const active = isOvertimeActive(status);

  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
  const [alertFrame, setAlertFrame] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const shouldFlash = active && enableVisualCues && !reducedMotion;
  const blinkPeriodMs = visualCuePeriodMs(visualCueIntensity);

  useEffect(() => {
    const root = document.documentElement;
    const previousCueState = root.dataset.visualCues;
    const previousCueStrength = root.style.getPropertyValue(
      '--visual-cue-strength',
    );
    const strength = 0.75 - clampCueIntensity(visualCueIntensity) * 0.05;

    root.dataset.visualCues =
      enableVisualCues && !reducedMotion ? 'true' : 'false';
    root.style.setProperty('--visual-cue-strength', strength.toFixed(2));

    return () => {
      if (previousCueState === undefined) {
        delete root.dataset.visualCues;
      } else {
        root.dataset.visualCues = previousCueState;
      }

      if (previousCueStrength) {
        root.style.setProperty('--visual-cue-strength', previousCueStrength);
      } else {
        root.style.removeProperty('--visual-cue-strength');
      }
    };
  }, [enableVisualCues, reducedMotion, visualCueIntensity]);

  useEffect(() => {
    if (!shouldFlash) {
      // Static alert frame: attention without motion.
      setAlertFrame(true);
      return;
    }
    setAlertFrame(true);
    const id = window.setInterval(() => {
      setAlertFrame((frame) => !frame);
    }, blinkPeriodMs);
    return () => window.clearInterval(id);
  }, [blinkPeriodMs, shouldFlash]);

  return { active, alertFrame };
}
