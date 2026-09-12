import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedText } from './AnimatedText';

describe('AnimatedText', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('crossfades changed text and removes the outgoing value afterwards', () => {
    const { rerender } = render(<AnimatedText value="Ready" />);

    rerender(<AnimatedText value="Paused" />);

    expect(screen.getByText('Ready')).toHaveAttribute('aria-hidden', 'true');
    act(() => vi.runAllTimers());
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
  });

  it('replaces stale outgoing text during rapid updates', () => {
    const { rerender } = render(<AnimatedText value="Ready" />);

    rerender(<AnimatedText value="Focusing" />);
    rerender(<AnimatedText value="Paused" />);

    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.getByText('Focusing')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('swaps immediately when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
    }) as unknown as typeof window.matchMedia;
    const { rerender } = render(<AnimatedText value="Ready" />);

    rerender(<AnimatedText value="Paused" />);

    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
});
