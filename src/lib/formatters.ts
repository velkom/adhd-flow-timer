import type { Timeframe } from './types';

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const negative = seconds < 0;
  const abs = Math.floor(Math.abs(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const display = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return negative ? `-${display}` : display;
}

/** MM:SS for seconds past the planned focus block (always non-negative, no minus). */
export function formatOvertimePastDisplay(pastSeconds: number): string {
  const abs = Math.floor(Math.abs(pastSeconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatOvertimePastAriaLabel(
  pastSeconds: number,
  variant: 'focus' | 'break' = 'focus',
): string {
  const planned = variant === 'focus' ? 'planned focus' : 'planned break';
  const sec = Math.floor(Math.abs(pastSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0 && s === 0) return `0 seconds past ${planned}`;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (s > 0) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return `${parts.join(' and ')} past ${planned}`;
}

/** Friendly total focus time label for flow-state subtitle (planned + overtime). */
export function formatTotalFocusLabel(elapsedSeconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
  if (totalMinutes === 0) {
    return 'Less than a minute in the zone';
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) {
    return `${totalMinutes} min in the zone`;
  }
  if (mins === 0) {
    return `${hours}h in the zone`;
  }
  return `${hours}h ${mins}m in the zone`;
}

/** Subtitle during break overtime (planned rest + extra). */
export function formatTotalBreakLabel(elapsedSeconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
  if (totalMinutes === 0) {
    return 'Less than a minute on your break';
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) {
    return `${totalMinutes} min on your break`;
  }
  if (mins === 0) {
    return `${hours}h on your break`;
  }
  return `${hours}h ${mins}m on your break`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0s';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function formatSessionLabel(isoDate: string, timeframe: Timeframe): string {
  const date = new Date(isoDate);
  switch (timeframe) {
    case 'day':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'week':
      return (
        date.toLocaleDateString([], { weekday: 'short' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    case 'month':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
