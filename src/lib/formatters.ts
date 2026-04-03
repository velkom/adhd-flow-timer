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

export function formatOvertimePastAriaLabel(pastSeconds: number): string {
  const sec = Math.floor(Math.abs(pastSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0 && s === 0) return '0 seconds past planned focus';
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (s > 0) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return `${parts.join(' and ')} past planned focus`;
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
