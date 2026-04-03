import { useMemo } from 'react';
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
          backgroundColor: 'rgba(0, 212, 255, 0.7)',
          borderRadius: 6,
        },
        {
          label: 'Flow',
          data: focus.map((s) => Math.round(s.flowStateDuration / 60)),
          backgroundColor: 'rgba(255, 214, 10, 0.7)',
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
            color: 'var(--color-text-secondary)',
            font: { size: compact ? 10 : 12 },
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
            color: 'var(--color-text-tertiary)',
            font: { size: compact ? 9 : 11 },
            maxRotation: compact ? 50 : 0,
            autoSkip: true,
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: 'var(--color-text-tertiary)',
            font: { size: compact ? 9 : 11 },
            callback: (tickValue: string | number) => `${tickValue}m`,
          },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    }),
    [compact],
  );

  if (data.labels.length === 0) {
    return <div className="chart-empty">No sessions yet</div>;
  }

  return <Bar data={data} options={chartOptions} />;
}
