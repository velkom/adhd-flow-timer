import { create } from 'zustand';
import type { TimerSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { loadSettings, saveSettings } from '@/lib/storage';

interface SettingsState {
  settings: TimerSettings;
  updateSettings: (partial: Partial<TimerSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    saveSettings(next);
    set({ settings: next });
  },

  resetSettings: () => {
    saveSettings(DEFAULT_SETTINGS);
    set({ settings: { ...DEFAULT_SETTINGS } });
  },
}));
