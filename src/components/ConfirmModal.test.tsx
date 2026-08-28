import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
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
});
