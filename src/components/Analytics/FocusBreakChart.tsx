import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { SessionStats } from '../../lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface FocusBreakChartProps {
  stats: SessionStats;
}

export function FocusBreakChart({ stats }: FocusBreakChartProps) {
  const focusOnly = stats.totalFocusMinutes - stats.totalFlowMinutes;
  const hasData = stats.totalFocusMinutes > 0 || stats.totalBreakMinutes > 0;

  if (!hasData) {
    return <div className="chart-empty">No data yet</div>;
  }

  return (
    <Doughnut
      data={{
        labels: ['Focus', 'Flow', 'Break'],
        datasets: [
          {
            data: [focusOnly, stats.totalFlowMinutes, stats.totalBreakMinutes],
            backgroundColor: [
              'rgba(0, 212, 255, 0.8)',
              'rgba(255, 214, 10, 0.8)',
              'rgba(48, 209, 88, 0.8)',
            ],
            borderWidth: 0,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'var(--color-text-secondary)', padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce(
                  (a, b) => a + b,
                  0,
                );
                const pct = total > 0 ? Math.round(((ctx.raw as number) / total) * 100) : 0;
                return `${ctx.label}: ${ctx.raw}m (${pct}%)`;
              },
            },
          },
        },
      }}
    />
  );
}
