import { useState, useMemo } from 'react';
import { useSlidingIndicator } from '@/hooks/useSlidingIndicator';
import { useSessionStore } from '@/stores/sessionStore';
import { analyzeTimePatterns } from '@/lib/sessionCalculations';
import { formatTime } from '@/lib/formatters';
import type { Timeframe } from '@/lib/types';
import { SessionChart } from './SessionChart';
import { FocusBreakChart } from './FocusBreakChart';
import btnStyles from '@/components/buttons.module.css';
import styles from './Analytics.module.css';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

export function AnalyticsView() {
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const activeTimeframeIndex = TIMEFRAMES.findIndex(
    (item) => item.value === timeframe,
  );
  const { containerRef, indicatorRef, setItemRef } =
    useSlidingIndicator<HTMLDivElement>({
      activeIndex: activeTimeframeIndex,
    });
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
  const statCards = [
    { label: 'Total focus', value: formatTime(stats.totalFocusMinutes) },
    { label: 'Average block', value: `${stats.avgSessionMinutes}m` },
    { label: 'Flow time', value: `${stats.flowStatePercentage}%` },
    { label: 'Focus blocks', value: `${stats.completedSessions}` },
  ];

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
      <p className={styles.analyticsIntro}>
        Look for patterns, not perfect streaks. Every completed focus block counts.
      </p>

      <div
        ref={containerRef}
        className={styles.timeframeSelector}
        role="group"
        aria-label="Time period"
      >
        <span
          ref={indicatorRef}
          className={styles.timeframeIndicator}
          aria-hidden="true"
        />
        {TIMEFRAMES.map(({ label, value }, index) => (
          <button
            key={value}
            ref={setItemRef(index)}
            type="button"
            aria-pressed={timeframe === value}
            className={`${styles.timeframeBtn} ${timeframe === value ? styles.timeframeBtnActive : ''}`}
            onClick={() => setTimeframe(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        {isEmpty ? (
          <div className={styles.analyticsEmpty}>
            <p className={styles.analyticsEmptyTitle}>
              No focus sessions in this period yet
            </p>
            <p className={styles.analyticsEmptyHint}>
              Start on the Timer screen and choose Next when your focus block is
              done. Your patterns will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              {statCards.map((card) => (
                <div key={card.label} className={styles.statCard}>
                  <span className={styles.statValue}>{card.value}</span>
                  <span className={styles.statLabel}>{card.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.chartsRow}>
              <section
                className={styles.chartCard}
                aria-labelledby="session-duration-title"
              >
                <h3 id="session-duration-title" className={styles.chartTitle}>
                  Recent focus blocks
                </h3>
                <SessionChart sessions={filtered} timeframe={timeframe} />
              </section>
              <section
                className={styles.chartCard}
                aria-labelledby="focus-break-title"
              >
                <h3 id="focus-break-title" className={styles.chartTitle}>
                  Focus and rest
                </h3>
                <FocusBreakChart stats={stats} />
              </section>
            </div>

            {insights && (
              <section
                className={styles.insightsCard}
                aria-labelledby="insights-title"
              >
                <h3 id="insights-title" className={styles.chartTitle}>
                  Pattern
                </h3>
                <p className={styles.insightText}>{insights}</p>
              </section>
            )}
          </>
        )}
      </div>

      <div className={styles.analyticsActions}>
        <button
          type="button"
          className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
          onClick={exportData}
          disabled={sessions.length === 0}
        >
          Export Data
        </button>
      </div>
    </div>
  );
}
