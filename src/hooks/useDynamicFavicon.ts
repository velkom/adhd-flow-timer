import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { TimerPhase, TimerStatus } from '@/lib/types';

const VIEW_SIZE = 64;
const CX = VIEW_SIZE / 2;
const CY = VIEW_SIZE / 2;
const RADIUS = 26;
const STROKE_WIDTH = 5;
const INNER_DOT_RADIUS = 11;
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

function phaseAccentFill(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return COLOR_FOCUS;
    case 'shortBreak':
    case 'longBreak':
      return COLOR_BREAK;
  }
}

/** Two vertical bars, centered (pause glyph at favicon scale). */
function pauseBarsMarkup(phase: TimerPhase): string {
  const fill = phaseAccentFill(phase);
  const barW = 3;
  const barH = 18;
  const gap = 5;
  const leftX = CX - barW - gap / 2;
  const rightX = CX + gap / 2;
  const topY = CY - barH / 2;
  const rx = 1;
  return `<rect x="${leftX}" y="${topY}" width="${barW}" height="${barH}" rx="${rx}" fill="${fill}"/><rect x="${rightX}" y="${topY}" width="${barW}" height="${barH}" rx="${rx}" fill="${fill}"/>`;
}

/** Inner dot: phase hue at full or muted opacity by status (mirrors static favicon center). */
function centerDotStyle(
  phase: TimerPhase,
  status: TimerStatus,
): { fill: string; fillOpacity: number } {
  if (status === 'flowState') {
    return { fill: COLOR_FLOW, fillOpacity: 1 };
  }
  if (status === 'idle') {
    switch (phase) {
      case 'focus':
        return { fill: COLOR_FOCUS, fillOpacity: 0.22 };
      case 'shortBreak':
      case 'longBreak':
        return { fill: COLOR_BREAK, fillOpacity: 0.22 };
    }
  }
  switch (phase) {
    case 'focus':
      return { fill: COLOR_FOCUS, fillOpacity: 1 };
    case 'shortBreak':
    case 'longBreak':
      return { fill: COLOR_BREAK, fillOpacity: 1 };
  }
}

function centerMarkupFor(phase: TimerPhase, status: TimerStatus): string {
  if (status === 'paused') {
    return pauseBarsMarkup(phase);
  }
  const { fill, fillOpacity } = centerDotStyle(phase, status);
  return `<circle cx="${CX}" cy="${CY}" r="${INNER_DOT_RADIUS}" fill="${fill}" fill-opacity="${fillOpacity}"/>`;
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
  const centerMarkup = centerMarkupFor(phase, status);

  const track = `<circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none" stroke="${TRACK_STROKE}" stroke-width="${STROKE_WIDTH}"/>`;

  if (!color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_SIZE} ${VIEW_SIZE}">${track}${centerMarkup}</svg>`;
  }

  const arc = `<circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none" stroke="${color}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}" stroke-opacity="${opacity}" transform="rotate(-90 ${CX} ${CY})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_SIZE} ${VIEW_SIZE}">${track}${arc}${centerMarkup}</svg>`;
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
