import { create } from 'zustand';
import type { Session, Timeframe } from '../lib/types';
import { loadSessions, saveSessions } from '../lib/storage';
import { filterSessionsByTimeframe, calculateStats } from '../lib/sessionCalculations';

interface SessionState {
  sessions: Session[];
  addSession: (session: Session) => void;
  clearSessions: () => void;
  getFilteredSessions: (timeframe: Timeframe) => Session[];
  getStats: (timeframe: Timeframe) => ReturnType<typeof calculateStats>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: loadSessions(),

  addSession: (session) => {
    const next = [...get().sessions, session];
    saveSessions(next);
    set({ sessions: next });
  },

  clearSessions: () => {
    saveSessions([]);
    set({ sessions: [] });
  },

  getFilteredSessions: (timeframe) =>
    filterSessionsByTimeframe(get().sessions, timeframe),

  getStats: (timeframe) =>
    calculateStats(filterSessionsByTimeframe(get().sessions, timeframe)),
}));
