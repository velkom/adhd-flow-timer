import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import modalStyles from './ConfirmModal.module.css';
import btnStyles from './buttons.module.css';

const CLOSE_FALLBACK_MS = 200;

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
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const pendingClose = useRef<(() => void) | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const completeClose = useCallback(() => {
    const action = pendingClose.current;
    if (!action) return;

    pendingClose.current = null;
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    action();
  }, []);

  const requestClose = useCallback(
    (action: () => void) => {
      if (pendingClose.current) return;

      const reduceMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      if (reduceMotion) {
        action();
        return;
      }

      pendingClose.current = action;
      setIsClosing(true);
      closeTimer.current = window.setTimeout(
        completeClose,
        CLOSE_FALLBACK_MS,
      );
    },
    [completeClose],
  );

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    cancelRef.current?.focus();

    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
      if (appRoot) appRoot.inert = wasInert;
      previouslyFocused?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      requestClose(onCancel);
      return;
    }

    if (event.key !== 'Tab') return;

    if (event.shiftKey && document.activeElement === cancelRef.current) {
      event.preventDefault();
      confirmRef.current?.focus();
    } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
      event.preventDefault();
      cancelRef.current?.focus();
    }
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      requestClose(onCancel);
    }
  };

  const handleOverlayAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (isClosing && event.target === event.currentTarget) {
      completeClose();
    }
  };

  const confirmClass =
    confirmVariant === 'danger'
      ? `${btnStyles.btn} ${btnStyles.btnDanger}`
      : `${btnStyles.btn} ${btnStyles.btnPrimary}`;

  return createPortal(
    <div
      className={modalStyles.modalOverlay}
      data-state={isClosing ? 'closing' : 'open'}
      onClick={handleOverlayClick}
      onAnimationEnd={handleOverlayAnimationEnd}
    >
      <div
        className={modalStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
      >
        <h3 id={titleId} className={modalStyles.modalTitle}>
          {title}
        </h3>
        <div id={bodyId} className={modalStyles.modalBody}>
          {body}
        </div>
        <div className={modalStyles.modalActions}>
          <button
            ref={cancelRef}
            type="button"
            className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
            disabled={isClosing}
            onClick={() => requestClose(onCancel)}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={confirmClass}
            disabled={isClosing}
            onClick={() => requestClose(onConfirm)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
