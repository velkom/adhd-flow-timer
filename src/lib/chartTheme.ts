import { useMemo, useSyncExternalStore } from 'react';

const FALLBACK_LEGEND = '#7e7e7e';
const FALLBACK_TICK = '#555555';
const FALLBACK_GRID = 'rgba(255, 255, 255, 0.06)';

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
function useChartThemeKey(): string {
  return useSyncExternalStore(subscribeDataTheme, getDataThemeAttr, () => '');
}

export interface ChartThemeColors {
  legend: string;
  tick: string;
  grid: string;
}

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === 'undefined') {
    return {
      legend: FALLBACK_LEGEND,
      tick: FALLBACK_TICK,
      grid: FALLBACK_GRID,
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const legend = cs.getPropertyValue('--color-chart-legend').trim();
  const tick = cs.getPropertyValue('--color-chart-tick').trim();
  const grid = cs.getPropertyValue('--color-chart-grid').trim();
  return {
    legend: legend || FALLBACK_LEGEND,
    tick: tick || FALLBACK_TICK,
    grid: grid || FALLBACK_GRID,
  };
}

export function useChartThemeColors(): ChartThemeColors {
  const key = useChartThemeKey();
  return useMemo(() => readChartThemeColors(), [key]);
}
