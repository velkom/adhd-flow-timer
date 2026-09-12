import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSlidingIndicator } from './useSlidingIndicator';

function Harness() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { containerRef, indicatorRef, setItemRef } = useSlidingIndicator({
    activeIndex,
  });

  return (
    <nav ref={containerRef}>
      <span ref={indicatorRef} data-testid="indicator" />
      {['One', 'Two'].map((label, index) => (
        <button
          key={label}
          ref={setItemRef(index)}
          type="button"
          data-index={index}
          onClick={() => setActiveIndex(index)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function LabelHarness() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { containerRef, indicatorRef, setItemRef } = useSlidingIndicator<
    HTMLDivElement,
    HTMLLabelElement
  >({ activeIndex });

  return (
    <div ref={containerRef}>
      <span ref={indicatorRef} data-testid="label-indicator" />
      {['Dark', 'Light'].map((label, index) => (
        <label key={label} ref={setItemRef(index)} data-index={index}>
          <input
            type="radio"
            name="theme"
            checked={activeIndex === index}
            onChange={() => setActiveIndex(index)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

describe('useSlidingIndicator', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
      function getOffsetLeft(this: HTMLElement) {
        return Number(this.dataset.index ?? 0) * 70;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(
      function getOffsetTop(this: HTMLElement) {
        return Number(this.dataset.index ?? 0) * 46;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(64);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(42);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('snaps on first layout, then animates to the selected item', () => {

    render(<Harness />);

    const indicator = screen.getByTestId('indicator');
    expect(indicator).toHaveAttribute('data-animate', 'false');
    expect(indicator.style.getPropertyValue('--indicator-width')).toBe('64px');

    fireEvent.click(screen.getByRole('button', { name: 'Two' }));

    expect(indicator).toHaveAttribute('data-animate', 'true');
    expect(indicator.style.getPropertyValue('--indicator-x')).toBe('70px');
    expect(indicator.style.getPropertyValue('--indicator-y')).toBe('46px');
  });

  it('supports measured label elements without changing radio semantics', () => {
    render(<LabelHarness />);

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));

    const indicator = screen.getByTestId('label-indicator');
    expect(indicator).toHaveAttribute('data-animate', 'true');
    expect(indicator.style.getPropertyValue('--indicator-x')).toBe('70px');
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });
});
