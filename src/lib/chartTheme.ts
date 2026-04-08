import { useMemo, useSyncExternalStore } from 'react';

const FALLBACK_LEGEND = 'rgba(255, 255, 255, 0.45)';
const FALLBACK_TICK = 'rgba(255, 255, 255, 0.2)';
const FALLBACK_GRID = 'rgba(255, 255, 255, 0.06)';
const FALLBACK_FONT_FAMILY = 'Barlow Condensed, Arial Narrow, sans-serif';

function subscribeDataTheme(onChange: () => void): () => void {
  const el = document.documentElement;
  const mo = new MutationObserver(onChange);
  mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}

function getDataThemeAttr(): string {
  return document.documentElement.getAttribute('data-theme') ?? '';
}

/** Re-subscribe when resolved document theme changes (Chart.js reads concrete colors). */
export function useChartThemeKey(): string {
  return useSyncExternalStore(subscribeDataTheme, getDataThemeAttr, () => '');
}

export interface ChartThemeColors {
  legend: string;
  tick: string;
  grid: string;
  fontFamily: string;
}

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === 'undefined') {
    return {
      legend: FALLBACK_LEGEND,
      tick: FALLBACK_TICK,
      grid: FALLBACK_GRID,
      fontFamily: FALLBACK_FONT_FAMILY,
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const legend = cs.getPropertyValue('--color-chart-legend').trim();
  const tick = cs.getPropertyValue('--color-chart-tick').trim();
  const grid = cs.getPropertyValue('--color-chart-grid').trim();
  const fontFamily = cs.getPropertyValue('--font-display').trim();
  return {
    legend: legend || FALLBACK_LEGEND,
    tick: tick || FALLBACK_TICK,
    grid: grid || FALLBACK_GRID,
    fontFamily: fontFamily || FALLBACK_FONT_FAMILY,
  };
}

export function useChartThemeColors(): ChartThemeColors {
  const key = useChartThemeKey();
  return useMemo(() => readChartThemeColors(), [key]);
}
