import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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

const VIEW_ORDER: readonly View[] = ['timer', 'settings', 'analytics'];

interface ViewTransitionHandle {
  finished: Promise<void>;
  skipTransition: () => void;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionHandle;
};

export function App() {
  useThemeSync();
  useScreenWakeLock(useSettingsStore((s) => s.settings.keepScreenAwake));
  const overtimeBlink = useOvertimeBlink();
  useDynamicFavicon(overtimeBlink);
  useOvertimeDocumentTitle(overtimeBlink);
  const [view, setView] = useState<View>('timer');
  const activeTransition = useRef<ViewTransitionHandle | null>(null);

  const handleViewChange = useCallback(
    (nextView: View) => {
      if (nextView === view) return;

      const updateView = () => {
        flushSync(() => setView(nextView));
      };
      const startViewTransition = (
        document as ViewTransitionDocument
      ).startViewTransition?.bind(document);
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (!startViewTransition || reduceMotion) {
        updateView();
        return;
      }

      activeTransition.current?.skipTransition();
      document.documentElement.dataset.viewTransitionDirection =
        VIEW_ORDER.indexOf(nextView) > VIEW_ORDER.indexOf(view)
          ? 'forward'
          : 'backward';

      const transition = startViewTransition(updateView);
      activeTransition.current = transition;
      void transition.finished
        .catch(() => undefined)
        .finally(() => {
          if (activeTransition.current !== transition) return;
          activeTransition.current = null;
          delete document.documentElement.dataset.viewTransitionDirection;
        });
    },
    [view],
  );

  return (
    <Layout activeView={view} onViewChange={handleViewChange}>
      {view === 'timer' && <TimerView />}
      {view === 'settings' && <SettingsView />}
      {view === 'analytics' && <AnalyticsView />}
    </Layout>
  );
}
