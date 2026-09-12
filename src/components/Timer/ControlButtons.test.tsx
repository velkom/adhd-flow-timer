import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlButtons } from './ControlButtons';

const handlers = {
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onSkip: vi.fn(),
  onResetRequest: vi.fn(),
};

describe('ControlButtons', () => {
  it('animates semantic labels while preserving the current actions', () => {
    const { rerender } = render(
      <ControlButtons status="idle" phase="focus" {...handlers} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }));
    expect(handlers.onStart).toHaveBeenCalledOnce();

    rerender(
      <ControlButtons status="running" phase="focus" {...handlers} />,
    );
    expect(screen.getByText('Start')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }));
    expect(handlers.onPause).toHaveBeenCalledOnce();

    rerender(
      <ControlButtons status="paused" phase="shortBreak" {...handlers} />,
    );
    expect(screen.getByText('Focus')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume timer' }));
    expect(handlers.onResume).toHaveBeenCalledOnce();
  });
});
