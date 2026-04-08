import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatSessionLabel } from '@/lib/formatters';
import type { Session, Timeframe } from '@/lib/types';
import {
  registerAnalyticsCharts,
  useBarStackedChartOptions,
  useChartDatasetFillColors,
  useAnalyticsChartContext,
} from '@/lib/chartConfig';
import chartLayoutStyles from './Analytics.module.css';

registerAnalyticsCharts();

interface SessionChartProps {
  sessions: Session[];
  timeframe: Timeframe;
}

export function SessionChart({ sessions, timeframe }: SessionChartProps) {
  const { compact, chartColors } = useAnalyticsChartContext();
  const fills = useChartDatasetFillColors(0.7);
  const chartOptions = useBarStackedChartOptions(chartColors, compact);

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
          backgroundColor: fills.focus,
          borderRadius: 6,
        },
        {
          label: 'Flow',
          data: focus.map((s) => Math.round(s.flowStateDuration / 60)),
          backgroundColor: fills.flow,
          borderRadius: 6,
        },
      ],
    };
  }, [sessions, timeframe, fills.focus, fills.flow]);

  return (
    <div className={chartLayoutStyles.chartCardCanvas}>
      {data.labels.length === 0 ? (
        <div className={chartLayoutStyles.chartEmpty}>No sessions yet</div>
      ) : (
        <Bar data={data} options={chartOptions} />
      )}
    </div>
  );
}
