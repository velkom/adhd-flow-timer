import { useEffect, useRef, type ReactNode } from 'react';
import type { View } from '@/lib/types';
import styles from './Layout.module.css';

const NAV_ITEMS: ReadonlyArray<{ view: View; label: string }> = [
  { view: 'timer', label: 'Timer' },
  { view: 'settings', label: 'Settings' },
  { view: 'analytics', label: 'Progress' },
];

interface LayoutProps {
  activeView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

export function Layout({ activeView, onViewChange, children }: LayoutProps) {
  const mainRef = useRef<HTMLElement>(null);
  const isInitialView = useRef(true);

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
        <div className={styles.appContent}>{children}</div>
      </main>
      <nav className={styles.appNav} aria-label="Main navigation">
        {NAV_ITEMS.map(({ view, label }) => (
          <button
            key={view}
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
