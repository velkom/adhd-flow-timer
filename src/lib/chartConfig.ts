import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { useChartThemeKey, useChartThemeColors } from '@/lib/chartTheme';
import { useCompactLayout } from '@/hooks/useCompactLayout';
import type { ChartThemeColors } from '@/lib/chartTheme';

let analyticsChartsRegistered = false;

/** Register Chart.js scales/elements once for analytics screens. */
export function registerAnalyticsCharts(): void {
  if (analyticsChartsRegistered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
  );
  analyticsChartsRegistered = true;
}

const FALLBACK_FOCUS = '#ff8c00';
const FALLBACK_FLOW = '#ffab00';
const FALLBACK_BREAK = '#30d158';

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}

/** Parse `#rgb` / `#rrggbb` to rgba(); falls back to original string if not hex. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 3 && h.length !== 6) return hex;
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface ChartDatasetFillColors {
  focus: string;
  flow: string;
  break: string;
}

export function readChartDatasetFillColors(
  alpha: number,
): ChartDatasetFillColors {
  const focus = readCssVar('--color-focus', FALLBACK_FOCUS);
  const flow = readCssVar('--color-flow', FALLBACK_FLOW);
  const breakColor = readCssVar('--color-break', FALLBACK_BREAK);
  return {
    focus: focus.startsWith('#') ? hexToRgba(focus, alpha) : focus,
    flow: flow.startsWith('#') ? hexToRgba(flow, alpha) : flow,
    break: breakColor.startsWith('#')
      ? hexToRgba(breakColor, alpha)
      : breakColor,
  };
}

/** Theme-aware dataset fills; updates when `data-theme` changes. */
export function useChartDatasetFillColors(alpha: number): ChartDatasetFillColors {
  const key = useChartThemeKey();
  return useMemo(() => readChartDatasetFillColors(alpha), [key, alpha]);
}

export function useBarStackedChartOptions(
  chartColors: ChartThemeColors,
  compact: boolean,
) {
  return useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: chartColors.legend,
            font: {
              family: chartColors.fontFamily,
              size: compact ? 10 : 12,
            },
            boxWidth: compact ? 10 : 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'bar'>) =>
              `${ctx.dataset.label ?? ''}: ${ctx.raw}m`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: chartColors.tick,
            font: {
              family: chartColors.fontFamily,
              size: compact ? 9 : 11,
            },
            maxRotation: compact ? 50 : 0,
            autoSkip: true,
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: chartColors.tick,
            font: {
              family: chartColors.fontFamily,
              size: compact ? 9 : 11,
            },
            callback: (tickValue: string | number) => `${tickValue}m`,
          },
          grid: { color: chartColors.grid },
        },
      },
    }),
    [
      chartColors.fontFamily,
      chartColors.grid,
      chartColors.legend,
      chartColors.tick,
      compact,
    ],
  );
}

export function useDoughnutChartOptions(
  chartColors: ChartThemeColors,
  compact: boolean,
) {
  return useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: chartColors.legend,
            padding: compact ? 12 : 16,
            font: {
              family: chartColors.fontFamily,
              size: compact ? 10 : 11,
            },
            boxWidth: compact ? 10 : 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'doughnut'>) => {
              const total = (ctx.dataset.data as number[]).reduce(
                (a, b) => a + b,
                0,
              );
              const raw = ctx.raw as number;
              const pct = total > 0 ? Math.round((raw / total) * 100) : 0;
              return `${ctx.label}: ${raw}m (${pct}%)`;
            },
          },
        },
      },
    }),
    [chartColors.fontFamily, chartColors.legend, compact],
  );
}

/** Convenience: compact layout + theme colors for charts. */
export function useAnalyticsChartContext(): {
  compact: boolean;
  chartColors: ChartThemeColors;
} {
  const compact = useCompactLayout();
  const chartColors = useChartThemeColors();
  return { compact, chartColors };
}
