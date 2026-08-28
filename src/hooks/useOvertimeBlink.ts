import { useEffect, useState } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { OVERTIME_BLINK_PERIOD_MS, isOvertimeActive } from '@/lib/overtimeAlert';

export interface OvertimeBlink {
  /** Timer is running past its planned block. */
  active: boolean;
  /** Whether the attention-grabbing frame is currently showing. */
  alertFrame: boolean;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Drives the overtime flash. Call once and pass the result to every consumer
 * (favicon, document title) so they share one interval and stay in phase.
 */
export function useOvertimeBlink(): OvertimeBlink {
  const status = useTimerStore((s) => s.timer.status);
  const enableVisualCues = useSettingsStore((s) => s.settings.enableVisualCues);
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

  useEffect(() => {
    if (!shouldFlash) {
      // Static alert frame: attention without motion.
      setAlertFrame(true);
      return;
    }
    setAlertFrame(true);
    const id = window.setInterval(() => {
      setAlertFrame((frame) => !frame);
    }, OVERTIME_BLINK_PERIOD_MS);
    return () => window.clearInterval(id);
  }, [shouldFlash]);

  return { active, alertFrame };
}
