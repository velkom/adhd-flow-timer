import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { clearAllUserData } from '@/stores/clearAllUserData';
import { ConfirmModal } from '@/components/ConfirmModal';
import btnStyles from '@/components/buttons.module.css';
import styles from './Settings.module.css';

export function SettingsDataActions() {
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <>
      <div className={styles.settingsActions}>
        <button
          type="button"
          className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
          onClick={resetSettings}
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          className={`${btnStyles.btn} ${btnStyles.btnDanger}`}
          onClick={() => setShowClearModal(true)}
        >
          Clear All Data
        </button>
      </div>

      {showClearModal && (
        <ConfirmModal
          title="Clear All Data?"
          body="This will permanently delete all your session history, reset the timer cycle (filled dots), and restore default settings. This cannot be undone."
          confirmLabel="Delete Everything"
          confirmVariant="danger"
          onCancel={() => setShowClearModal(false)}
          onConfirm={() => {
            clearAllUserData();
            setShowClearModal(false);
          }}
        />
      )}
    </>
  );
}
