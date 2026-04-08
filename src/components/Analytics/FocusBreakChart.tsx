import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { SessionStats } from '@/lib/types';
import {
  registerAnalyticsCharts,
  useDoughnutChartOptions,
  useChartDatasetFillColors,
  useAnalyticsChartContext,
} from '@/lib/chartConfig';
import chartLayoutStyles from './Analytics.module.css';

registerAnalyticsCharts();

interface FocusBreakChartProps {
  stats: SessionStats;
}

export function FocusBreakChart({ stats }: FocusBreakChartProps) {
  const { compact, chartColors } = useAnalyticsChartContext();
  const fills = useChartDatasetFillColors(0.8);
  const chartOptions = useDoughnutChartOptions(chartColors, compact);

  const focusOnly = Math.max(
    0,
    stats.totalFocusMinutes - stats.totalFlowMinutes,
  );
  const hasData = stats.totalFocusMinutes > 0 || stats.totalBreakMinutes > 0;

  const data = useMemo(
    () => ({
      labels: ['Focus', 'Flow', 'Break'],
      datasets: [
        {
          data: [focusOnly, stats.totalFlowMinutes, stats.totalBreakMinutes],
          backgroundColor: [fills.focus, fills.flow, fills.break],
          borderWidth: 0,
        },
      ],
    }),
    [
      focusOnly,
      stats.totalFlowMinutes,
      stats.totalBreakMinutes,
      fills.focus,
      fills.flow,
      fills.break,
    ],
  );

  return (
    <div className={chartLayoutStyles.chartCardCanvas}>
      {!hasData ? (
        <div className={chartLayoutStyles.chartEmpty}>No data yet</div>
      ) : (
        <Doughnut data={data} options={chartOptions} />
      )}
    </div>
  );
}
