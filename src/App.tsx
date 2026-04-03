import { useState, useEffect } from 'react';
import { TimerView } from './components/Timer/TimerView';
import { SettingsView } from './components/Settings/SettingsView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { Layout } from './components/Layout';
import { useSettingsStore } from './stores/settingsStore';

export type View = 'timer' | 'settings' | 'analytics';

function useThemeSync() {
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

export function App() {
  useThemeSync();
  const [view, setView] = useState<View>('timer');

  return (
    <Layout activeView={view} onViewChange={setView}>
      {view === 'timer' && <TimerView />}
      {view === 'settings' && <SettingsView />}
      {view === 'analytics' && <AnalyticsView />}
    </Layout>
  );
}
