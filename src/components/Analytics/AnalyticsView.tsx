import { useState, useMemo } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { analyzeTimePatterns } from '@/lib/sessionCalculations';
import { formatTime } from '@/lib/formatters';
import type { Timeframe } from '@/lib/types';
import { SessionChart } from './SessionChart';
import { FocusBreakChart } from './FocusBreakChart';
import viewTitleStyles from '@/components/viewTitle.module.css';
import btnStyles from '@/components/buttons.module.css';
import styles from './Analytics.module.css';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

export function AnalyticsView() {
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const getStats = useSessionStore((s) => s.getStats);
  const getFilteredSessions = useSessionStore((s) => s.getFilteredSessions);
  const sessions = useSessionStore((s) => s.sessions);

  const stats = useMemo(() => getStats(timeframe), [getStats, timeframe, sessions]);
  const filtered = useMemo(
    () => getFilteredSessions(timeframe),
    [getFilteredSessions, timeframe, sessions],
  );
  const insights = useMemo(() => analyzeTimePatterns(filtered), [filtered]);
  const isEmpty = stats.completedSessions === 0;
  const panelId = 'analytics-main-panel';

  const exportData = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow-timer-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.analyticsView}>
      <h2 className={viewTitleStyles.viewTitle}>Your Progress</h2>

      <div
        className={styles.timeframeSelector}
        role="tablist"
        aria-label="Time period"
      >
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            id={`analytics-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={timeframe === value}
            aria-controls={panelId}
            className={`${styles.timeframeBtn} ${timeframe === value ? styles.timeframeBtnActive : ''}`}
            onClick={() => setTimeframe(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`analytics-tab-${timeframe}`}
      >
        {isEmpty ? (
          <div className={styles.analyticsEmpty}>
            <p className={styles.analyticsEmptyTitle}>
              No focus sessions in this period yet
            </p>
            <p className={styles.analyticsEmptyHint}>
              Finish a focus block from the Timer tab (use Skip to Break when you
              are done). Your charts and insights will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>
                  {formatTime(stats.totalFocusMinutes)}
                </span>
                <span className={styles.statLabel}>Total Focus</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.avgSessionMinutes}m</span>
                <span className={styles.statLabel}>Avg Session</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.flowStatePercentage}%</span>
                <span className={styles.statLabel}>Flow Time</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.completedSessions}</span>
                <span className={styles.statLabel}>Sessions</span>
              </div>
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Session Duration</h3>
                <SessionChart sessions={filtered} timeframe={timeframe} />
              </div>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Focus vs Break</h3>
                <FocusBreakChart stats={stats} />
              </div>
            </div>

            {insights && (
              <div className={styles.insightsCard}>
                <h3 className={styles.chartTitle}>Insights</h3>
                <p className={styles.insightText}>{insights}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.analyticsActions}>
        <button
          type="button"
          className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
          onClick={exportData}
        >
          Export Data
        </button>
      </div>
    </div>
  );
}
