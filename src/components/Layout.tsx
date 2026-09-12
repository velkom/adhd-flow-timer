import { useEffect, useRef, type ReactNode } from 'react';
import { useSlidingIndicator } from '@/hooks/useSlidingIndicator';
import type { View } from '@/lib/types';
import viewTitleStyles from './viewTitle.module.css';
import styles from './Layout.module.css';

const NAV_ITEMS: ReadonlyArray<{ view: View; label: string }> = [
  { view: 'timer', label: 'Timer' },
  { view: 'settings', label: 'Settings' },
  { view: 'analytics', label: 'Progress' },
];

const VIEW_TITLES = {
  timer: 'Timer',
  settings: 'Settings',
  analytics: 'Your Progress',
} satisfies Record<View, string>;

interface LayoutProps {
  activeView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

export function Layout({ activeView, onViewChange, children }: LayoutProps) {
  const mainRef = useRef<HTMLElement>(null);
  const isInitialView = useRef(true);
  const activeIndex = NAV_ITEMS.findIndex((item) => item.view === activeView);
  const { containerRef, indicatorRef, setItemRef } = useSlidingIndicator({
    activeIndex,
  });

  useEffect(() => {
    if (isInitialView.current) {
      isInitialView.current = false;
      return;
    }

    mainRef.current?.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [activeView]);

  return (
    <div className={styles.appLayout}>
      <main
        ref={mainRef}
        className={styles.appMain}
        aria-labelledby="app-title"
        tabIndex={-1}
      >
        <h1 id="app-title" className={styles.visuallyHidden}>
          ADHD Flow Timer
        </h1>
        <div className={styles.appContent}>
          <h2 className={`${viewTitleStyles.viewTitle} ${styles.pageTitle}`}>
            {VIEW_TITLES[activeView]}
          </h2>
          <div className={styles.viewBody}>{children}</div>
        </div>
      </main>
      <nav
        ref={containerRef}
        className={styles.appNav}
        aria-label="Main navigation"
      >
        <span
          ref={indicatorRef}
          className={styles.navIndicator}
          aria-hidden="true"
        />
        {NAV_ITEMS.map(({ view, label }, index) => (
          <button
            key={view}
            ref={setItemRef(index)}
            type="button"
            aria-current={activeView === view ? 'page' : undefined}
            className={`${styles.navTab} ${activeView === view ? styles.navTabActive : ''}`}
            onClick={() => onViewChange(view)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
