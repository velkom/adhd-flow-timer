import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatSessionLabel } from '../../lib/formatters';
import type { Session, Timeframe } from '../../lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SessionChartProps {
  sessions: Session[];
  timeframe: Timeframe;
}

export function SessionChart({ sessions, timeframe }: SessionChartProps) {
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

  if (data.labels.length === 0) {
    return <div className="chart-empty">No sessions yet</div>;
  }

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: 'var(--color-text-secondary)' } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}m`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: 'var(--color-text-tertiary)' },
          },
          y: {
            stacked: true,
            ticks: {
              color: 'var(--color-text-tertiary)',
              callback: (v) => `${v}m`,
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      }}
    />
  );
}
