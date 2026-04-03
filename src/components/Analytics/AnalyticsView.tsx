import { useState, useMemo } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { analyzeTimePatterns } from '../../lib/sessionCalculations';
import { formatTime } from '../../lib/formatters';
import type { Timeframe } from '../../lib/types';
import { SessionChart } from './SessionChart';
import { FocusBreakChart } from './FocusBreakChart';

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
    <div className="analytics-view">
      <h2 className="view-title">Your Progress</h2>

      <div
        className="timeframe-selector"
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
            className={`timeframe-btn ${timeframe === value ? 'timeframe-btn--active' : ''}`}
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
          <div className="analytics-empty">
            <p className="analytics-empty-title">
              No focus sessions in this period yet
            </p>
            <p className="analytics-empty-hint">
              Finish a focus block from the Timer tab (use Skip to Break when you
              are done). Your charts and insights will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">
                  {formatTime(stats.totalFocusMinutes)}
                </span>
                <span className="stat-label">Total Focus</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgSessionMinutes}m</span>
                <span className="stat-label">Avg Session</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.flowStatePercentage}%</span>
                <span className="stat-label">Flow Time</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.completedSessions}</span>
                <span className="stat-label">Sessions</span>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <h3 className="chart-title">Session Duration</h3>
                <SessionChart sessions={filtered} timeframe={timeframe} />
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Focus vs Break</h3>
                <FocusBreakChart stats={stats} />
              </div>
            </div>

            {insights && (
              <div className="insights-card">
                <h3 className="chart-title">Insights</h3>
                <p className="insight-text">{insights}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="analytics-actions">
        <button className="btn btn--secondary" onClick={exportData}>
          Export Data
        </button>
      </div>
    </div>
  );
}
