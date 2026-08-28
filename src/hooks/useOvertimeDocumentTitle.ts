import { useEffect } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import type { OvertimeBlink } from './useOvertimeBlink';
import { BASE_TITLE, overtimeTitle } from '@/lib/overtimeAlert';

/** Alternates the tab title while the timer runs past its planned block. */
export function useOvertimeDocumentTitle(blink: OvertimeBlink): void {
  const phase = useTimerStore((s) => s.timer.phase);
  const flowSeconds = useTimerStore((s) => s.timer.flowSeconds);
  const { active, alertFrame } = blink;

  useEffect(() => {
    if (!active) {
      document.title = BASE_TITLE;
      return;
    }
    document.title = overtimeTitle(phase, flowSeconds, alertFrame);
    return () => {
      document.title = BASE_TITLE;
    };
  }, [active, alertFrame, phase, flowSeconds]);
}
