import { useMemo } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { useCompactLayout } from '@/hooks/useCompactLayout';
import {
  useChartThemeColors,
  useChartThemeKey,
  type ChartThemeColors,
} from '@/lib/chartTheme';

let analyticsChartsRegistered = false;

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

const FALLBACK_FOCUS = '#ff5a1f';
const FALLBACK_FLOW = '#ffab00';
const FALLBACK_BREAK = '#4ec9b0';

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 3 && h.length !== 6) return hex;
  const full =
    h.length === 3
      ? h
          .split('')
          .map((character) => character + character)
          .join('')
      : h;
  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);
  if ([red, green, blue].some((channel) => Number.isNaN(channel))) return hex;
  return `rgba(${red},${green},${blue},${alpha})`;
}

interface ChartDatasetFillColors {
  focus: string;
  flow: string;
  break: string;
}

function readChartDatasetFillColors(
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

export function useChartDatasetFillColors(
  alpha: number,
): ChartDatasetFillColors {
  const themeKey = useChartThemeKey();
  return useMemo(
    () => readChartDatasetFillColors(alpha),
    [alpha, themeKey],
  );
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
            label: (context: TooltipItem<'bar'>) =>
              `${context.dataset.label ?? ''}: ${context.raw}m`,
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
            label: (context: TooltipItem<'doughnut'>) => {
              const total = (context.dataset.data as number[]).reduce(
                (sum, value) => sum + value,
                0,
              );
              const raw = context.raw as number;
              const percentage =
                total > 0 ? Math.round((raw / total) * 100) : 0;
              return `${context.label}: ${raw}m (${percentage}%)`;
            },
          },
        },
      },
    }),
    [chartColors.fontFamily, chartColors.legend, compact],
  );
}

export function useAnalyticsChartContext(): {
  compact: boolean;
  chartColors: ChartThemeColors;
} {
  const compact = useCompactLayout();
  const chartColors = useChartThemeColors();
  return { compact, chartColors };
}
