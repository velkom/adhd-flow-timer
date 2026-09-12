import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('@/components/Timer/TimerView', () => ({
  TimerView: () => <div>Timer content</div>,
}));
vi.mock('@/components/Settings/SettingsView', () => ({
  SettingsView: () => <div>Settings content</div>,
}));
vi.mock('@/components/Analytics/AnalyticsView', () => ({
  AnalyticsView: () => <div>Analytics content</div>,
}));
vi.mock('@/hooks/useDynamicFavicon', () => ({
  useDynamicFavicon: vi.fn(),
}));
vi.mock('@/hooks/useOvertimeBlink', () => ({
  useOvertimeBlink: () => false,
}));
vi.mock('@/hooks/useOvertimeDocumentTitle', () => ({
  useOvertimeDocumentTitle: vi.fn(),
}));
vi.mock('@/hooks/useScreenWakeLock', () => ({
  useScreenWakeLock: vi.fn(),
}));
vi.mock('@/hooks/useThemeSync', () => ({
  useThemeSync: vi.fn(),
}));
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (
    selector: (state: { settings: { keepScreenAwake: boolean } }) => unknown,
  ) => selector({ settings: { keepScreenAwake: false } }),
}));

interface TestViewTransition {
  finished: Promise<void>;
  skipTransition: ReturnType<typeof vi.fn>;
}

describe('App navigation transitions', () => {
  const originalMatchMedia = window.matchMedia;
  const originalScrollTo = HTMLElement.prototype.scrollTo;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    }) as unknown as typeof window.matchMedia;
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    HTMLElement.prototype.scrollTo = originalScrollTo;
    delete document.documentElement.dataset.viewTransitionDirection;
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('uses a forward view transition for the next screen', async () => {
    let finishTransition: () => void = () => undefined;
    const transition: TestViewTransition = {
      finished: new Promise<void>((resolve) => {
        finishTransition = resolve;
      }),
      skipTransition: vi.fn(),
    };
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return transition;
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(document.documentElement.dataset.viewTransitionDirection).toBe(
      'forward',
    );

    await act(async () => finishTransition());
    expect(document.documentElement).not.toHaveAttribute(
      'data-view-transition-direction',
    );
  });

  it('updates synchronously when View Transitions are unavailable', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Progress' }));

    expect(
      screen.getByRole('heading', { name: 'Your Progress' }),
    ).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute(
      'data-view-transition-direction',
    );
  });
});
