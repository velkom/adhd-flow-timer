import { useMemo } from 'react';
import { useChartThemeColors } from '../../lib/chartTheme';
import { useCompactLayout } from '../../lib/useCompactLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatSessionLabel } from '../../lib/formatters';
import type { Session, Timeframe } from '../../lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SessionChartProps {
  sessions: Session[];
  timeframe: Timeframe;
}

export function SessionChart({ sessions, timeframe }: SessionChartProps) {
  const compact = useCompactLayout();
  const chartColors = useChartThemeColors();

  const data = useMemo(() => {
    const focus = sessions
      .filter((s) => s.type === 'focus')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
      .slice(-10);

    return {
      labels: focus.map((s) => formatSessionLabel(s.startedAt, timeframe)),
      datasets: [
        {
          label: 'Focus',
          data: focus.map((s) =>
            Math.round(
              Math.min(s.actualDuration, s.plannedDuration) / 60,
            ),
          ),
          backgroundColor: 'rgba(255, 140, 0, 0.7)',
          borderRadius: 6,
        },
        {
          label: 'Flow',
          data: focus.map((s) => Math.round(s.flowStateDuration / 60)),
          backgroundColor: 'rgba(255, 171, 0, 0.7)',
          borderRadius: 6,
        },
      ],
    };
  }, [sessions, timeframe]);

  const chartOptions = useMemo(
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

  return (
    <div className="chart-card__canvas">
      {data.labels.length === 0 ? (
        <div className="chart-empty">No sessions yet</div>
      ) : (
        <Bar data={data} options={chartOptions} />
      )}
    </div>
  );
}
