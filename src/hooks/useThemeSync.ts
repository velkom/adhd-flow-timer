import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/** Applies `data-theme` on `<html>` from settings (including system preference). */
export function useThemeSync(): void {
  const theme = useSettingsStore((s) => s.settings.theme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved =
        theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}
