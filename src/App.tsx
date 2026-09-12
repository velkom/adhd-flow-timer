import { useState } from 'react';
import { TimerView } from '@/components/Timer/TimerView';
import { SettingsView } from '@/components/Settings/SettingsView';
import { AnalyticsView } from '@/components/Analytics/AnalyticsView';
import { Layout } from '@/components/Layout';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { useOvertimeBlink } from '@/hooks/useOvertimeBlink';
import { useOvertimeDocumentTitle } from '@/hooks/useOvertimeDocumentTitle';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useSettingsStore } from '@/stores/settingsStore';
import type { View } from '@/lib/types';

export function App() {
  useThemeSync();
  useScreenWakeLock(useSettingsStore((s) => s.settings.keepScreenAwake));
  const overtimeBlink = useOvertimeBlink();
  useDynamicFavicon(overtimeBlink);
  useOvertimeDocumentTitle(overtimeBlink);
  const [view, setView] = useState<View>('timer');

  return (
    <Layout activeView={view} onViewChange={setView}>
      {view === 'timer' && <TimerView />}
      {view === 'settings' && <SettingsView />}
      {view === 'analytics' && <AnalyticsView />}
    </Layout>
  );
}
