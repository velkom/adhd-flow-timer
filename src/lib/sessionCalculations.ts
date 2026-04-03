import type { Session, SessionStats, Timeframe } from './types';

export function calculateStats(sessions: Session[]): SessionStats {
  const focusSessions = sessions.filter((s) => s.type === 'focus');
  const breakSessions = sessions.filter((s) => s.type === 'break');

  const totalFocusSeconds = focusSessions.reduce(
    (sum, s) => sum + s.actualDuration,
    0,
  );
  const totalFlowSeconds = focusSessions.reduce(
    (sum, s) => sum + s.flowStateDuration,
    0,
  );
  const totalBreakSeconds = breakSessions.reduce(
    (sum, s) => sum + s.actualDuration,
    0,
  );

  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
  const totalFlowMinutes = Math.round(totalFlowSeconds / 60);
  const totalBreakMinutes = Math.round(totalBreakSeconds / 60);

  const avgSessionMinutes =
    focusSessions.length > 0
      ? Math.round(
          (totalFocusSeconds - totalFlowSeconds) / focusSessions.length / 60,
        )
      : 0;

  const flowStatePercentage =
    totalFocusSeconds > 0
      ? Math.round((totalFlowSeconds / totalFocusSeconds) * 100)
      : 0;

  return {
    totalFocusMinutes,
    totalFlowMinutes,
    totalBreakMinutes,
    avgSessionMinutes,
    flowStatePercentage,
    completedSessions: focusSessions.length,
  };
}

export function filterSessionsByTimeframe(
  sessions: Session[],
  timeframe: Timeframe,
): Session[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let cutoff: Date;
  switch (timeframe) {
    case 'day':
      cutoff = startOfDay;
      break;
    case 'week':
      cutoff = startOfWeek;
      break;
    case 'month':
      cutoff = startOfMonth;
      break;
  }

  return sessions.filter((s) => new Date(s.startedAt) >= cutoff);
}

export function analyzeTimePatterns(sessions: Session[]): string | null {
  const focusSessions = sessions.filter((s) => s.type === 'focus');
  if (focusSessions.length < 5) return null;

  const hourCounts: Record<number, number> = {};
  const hourFlowSeconds: Record<number, number> = {};

  for (const session of focusSessions) {
    const hour = new Date(session.startedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    hourFlowSeconds[hour] =
      (hourFlowSeconds[hour] ?? 0) + session.flowStateDuration;
  }

  let mostProductiveHour = 0;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostProductiveHour = Number(hour);
    }
  }

  let mostFlowHour = 0;
  let maxFlow = 0;
  for (const [hour, seconds] of Object.entries(hourFlowSeconds)) {
    if (seconds > maxFlow) {
      maxFlow = seconds;
      mostFlowHour = Number(hour);
    }
  }

  if (maxCount <= 1) return null;

  const fmt = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  const flowPart =
    maxFlow > 0
      ? ` and enter flow states most often around ${fmt(mostFlowHour)}`
      : '';

  return `You tend to be most productive around ${fmt(mostProductiveHour)}${flowPart}.`;
}
