import type { ReactNode } from 'react';
import type { View } from '../App';

interface LayoutProps {
  activeView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

export function Layout({ activeView, onViewChange, children }: LayoutProps) {
  return (
    <div className="app-layout">
      <main className="app-main">{children}</main>
      <nav className="app-nav" role="tablist" aria-label="Main navigation">
        {(['timer', 'settings', 'analytics'] as const).map((view) => (
          <button
            key={view}
            role="tab"
            aria-selected={activeView === view}
            className={`nav-tab ${activeView === view ? 'nav-tab--active' : ''}`}
            onClick={() => onViewChange(view)}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}
