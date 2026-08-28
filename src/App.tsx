import { useState, useEffect } from 'react';
import { TimerView } from '@/components/Timer/TimerView';
import { SettingsView } from '@/components/Settings/SettingsView';
import { AnalyticsView } from '@/components/Analytics/AnalyticsView';
import { Layout } from '@/components/Layout';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { useOvertimeBlink } from '@/hooks/useOvertimeBlink';
import { useOvertimeDocumentTitle } from '@/hooks/useOvertimeDocumentTitle';
import { useThemeSync } from '@/hooks/useThemeSync';
import type { View } from '@/lib/types';

export function App() {
  useThemeSync();
  const overtimeBlink = useOvertimeBlink();
  useDynamicFavicon(overtimeBlink);
  useOvertimeDocumentTitle(overtimeBlink);
  const [view, setView] = useState<View>('timer');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <Layout activeView={view} onViewChange={setView}>
      {view === 'timer' && <TimerView />}
      {view === 'settings' && <SettingsView />}
      {view === 'analytics' && <AnalyticsView />}
    </Layout>
  );
}
