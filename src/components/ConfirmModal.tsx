import type { ReactNode } from 'react';
import modalStyles from './ConfirmModal.module.css';
import btnStyles from './buttons.module.css';

export type ConfirmModalConfirmVariant = 'primary' | 'danger';

export interface ConfirmModalProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmModalConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClass =
    confirmVariant === 'danger'
      ? `${btnStyles.btn} ${btnStyles.btnDanger}`
      : `${btnStyles.btn} ${btnStyles.btnPrimary}`;

  return (
    <div className={modalStyles.modalOverlay} onClick={onCancel}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={modalStyles.modalTitle}>{title}</h3>
        <div className={modalStyles.modalBody}>{body}</div>
        <div className={modalStyles.modalActions}>
          <button
            type="button"
            className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
