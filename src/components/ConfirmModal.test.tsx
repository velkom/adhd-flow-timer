import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('labels the dialog, focuses cancel, and handles Escape', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        title="Finish session?"
        body="Save this focus block and start your break."
        confirmLabel="Finish focus"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Finish session?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog.parentElement).toHaveAttribute('data-state', 'closing');
    expect(onCancel).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('contains keyboard focus and restores the prior focus on unmount', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(
      <ConfirmModal
        title="Reset timer?"
        body="This clears the current block."
        confirmLabel="Reset"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Reset' });

    confirm.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('runs a close action once after the exit animation', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        title="Reset timer?"
        body="This clears the current block."
        confirmLabel="Reset"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    vi.runAllTimers();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes immediately when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
    }) as unknown as typeof window.matchMedia;
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        title="Reset timer?"
        body="This clears the current block."
        confirmLabel="Reset"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
