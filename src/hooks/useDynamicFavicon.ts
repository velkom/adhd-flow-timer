import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { TimerPhase, TimerStatus } from '@/lib/types';

const VIEW_SIZE = 64;
const CX = VIEW_SIZE / 2;
const CY = VIEW_SIZE / 2;
const RADIUS = 26;
const STROKE_WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Matches dark theme tokens in `tokens.css` (data URLs cannot use CSS variables). */
const COLOR_FOCUS = '#ff8c00';
const COLOR_BREAK = '#30d158';
const COLOR_FLOW = '#ffab00';
const TRACK_STROKE = '#3d3d3d';

function phaseDurationSeconds(
  phase: TimerPhase,
  focus: number,
  shortBreak: number,
  longBreak: number,
): number {
  switch (phase) {
    case 'focus':
      return focus;
    case 'shortBreak':
      return shortBreak;
    case 'longBreak':
      return longBreak;
  }
}

function progressForFavicon(
  phase: TimerPhase,
  status: TimerStatus,
  elapsedSeconds: number,
  focusDuration: number,
  shortBreakDuration: number,
  longBreakDuration: number,
): number {
  if (status === 'flowState') return 1;
  const total = phaseDurationSeconds(
    phase,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
  );
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedSeconds / total));
}

function arcColor(phase: TimerPhase, status: TimerStatus): string | null {
  if (status === 'idle') return null;
  if (status === 'flowState') return COLOR_FLOW;
  switch (phase) {
    case 'focus':
      return COLOR_FOCUS;
    case 'shortBreak':
    case 'longBreak':
      return COLOR_BREAK;
  }
}

function arcStrokeOpacity(status: TimerStatus): number {
  if (status === 'paused') return 0.5;
  return 1;
}

function buildFaviconSvg(
  phase: TimerPhase,
  status: TimerStatus,
  elapsedSeconds: number,
  focusDuration: number,
  shortBreakDuration: number,
  longBreakDuration: number,
): string {
  const color = arcColor(phase, status);
  const progress = progressForFavicon(
    phase,
    status,
    elapsedSeconds,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
  );
  const offset = CIRCUMFERENCE * (1 - progress);
  const opacity = arcStrokeOpacity(status);

  const track = `<circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none" stroke="${TRACK_STROKE}" stroke-width="${STROKE_WIDTH}"/>`;

  if (!color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_SIZE} ${VIEW_SIZE}">${track}</svg>`;
  }

  const arc = `<circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none" stroke="${color}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}" stroke-opacity="${opacity}" transform="rotate(-90 ${CX} ${CY})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_SIZE} ${VIEW_SIZE}">${track}${arc}</svg>`;
}

/** Updates the document favicon to a progress ring reflecting timer phase, status, and elapsed time. */
export function useDynamicFavicon(): void {
  const phase = useTimerStore((s) => s.timer.phase);
  const status = useTimerStore((s) => s.timer.status);
  const elapsedSeconds = useTimerStore((s) => s.timer.elapsedSeconds);
  const focusDuration = useSettingsStore((s) => s.settings.focusDuration);
  const shortBreakDuration = useSettingsStore((s) => s.settings.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.settings.longBreakDuration);

  const originalHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    originalHrefRef.current = link.getAttribute('href');
    return () => {
      const orig = originalHrefRef.current;
      if (orig !== null) {
        link.setAttribute('href', orig);
      }
    };
  }, []);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;

    const svg = buildFaviconSvg(
      phase,
      status,
      elapsedSeconds,
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
    );
    const href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    link.setAttribute('href', href);
  }, [
    phase,
    status,
    elapsedSeconds,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
  ]);
}
