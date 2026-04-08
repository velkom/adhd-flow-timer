import type { ReactNode } from 'react';
import type { View } from '@/lib/types';
import styles from './Layout.module.css';

interface LayoutProps {
  activeView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

export function Layout({ activeView, onViewChange, children }: LayoutProps) {
  return (
    <div className={styles.appLayout}>
      <main className={styles.appMain}>
        <div className={styles.appContent}>{children}</div>
      </main>
      <nav className={styles.appNav} role="tablist" aria-label="Main navigation">
        {(['timer', 'settings', 'analytics'] as const).map((view) => (
          <button
            key={view}
            role="tab"
            aria-selected={activeView === view}
            className={`${styles.navTab} ${activeView === view ? styles.navTabActive : ''}`}
            onClick={() => onViewChange(view)}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}
