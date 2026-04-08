import { useSettingsStore } from '@/stores/settingsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useState } from 'react';
import type { TimerSettings } from '@/lib/types';
import { ConfirmModal } from '@/components/ConfirmModal';
import viewTitleStyles from '@/components/viewTitle.module.css';
import btnStyles from '@/components/buttons.module.css';
import styles from './Settings.module.css';

export function SettingsView() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const clearSessions = useSessionStore((s) => s.clearSessions);
  const [showResetModal, setShowResetModal] = useState(false);

  const updateSetting = <K extends keyof TimerSettings>(
    key: K,
    value: TimerSettings[K],
  ) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className={styles.settingsView}>
      <h2 className={viewTitleStyles.viewTitle}>Settings</h2>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Timer</h3>

        <label className={styles.settingField}>
          <span className={styles.settingLabel}>Focus Duration</span>
          <select
            className={styles.settingInput}
            value={settings.focusDuration}
            onChange={(e) => updateSetting('focusDuration', Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className={styles.settingField}>
          <span className={styles.settingLabel}>Short Break</span>
          <select
            className={styles.settingInput}
            value={settings.shortBreakDuration}
            onChange={(e) => updateSetting('shortBreakDuration', Number(e.target.value))}
          >
            {[3, 5, 10, 15].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className={styles.settingField}>
          <span className={styles.settingLabel}>Long Break</span>
          <select
            className={styles.settingInput}
            value={settings.longBreakDuration}
            onChange={(e) => updateSetting('longBreakDuration', Number(e.target.value))}
          >
            {[10, 15, 20, 30].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className={styles.settingField}>
          <span className={styles.settingLabel}>Sessions before Long Break</span>
          <select
            className={styles.settingInput}
            value={settings.sessionsBeforeLongBreak}
            onChange={(e) =>
              updateSetting('sessionsBeforeLongBreak', Number(e.target.value))
            }
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Focus Aids</h3>

        <label
          className={`${styles.settingField} ${styles.settingFieldToggle}`}
        >
          <span className={styles.settingLabel}>Visual Cues</span>
          <input
            type="checkbox"
            className={styles.settingToggle}
            checked={settings.enableVisualCues}
            onChange={(e) => updateSetting('enableVisualCues', e.target.checked)}
          />
        </label>

        {settings.enableVisualCues && (
          <label className={styles.settingField}>
            <span className={styles.settingLabel}>
              Cue Intensity ({settings.visualCueIntensity})
            </span>
            <input
              type="range"
              className={styles.settingRange}
              min={1}
              max={10}
              value={settings.visualCueIntensity}
              onChange={(e) =>
                updateSetting('visualCueIntensity', Number(e.target.value))
              }
            />
          </label>
        )}

        <label
          className={`${styles.settingField} ${styles.settingFieldToggle}`}
        >
          <span className={styles.settingLabel}>Sound Notifications</span>
          <input
            type="checkbox"
            className={styles.settingToggle}
            checked={settings.enableSoundNotifications}
            onChange={(e) =>
              updateSetting('enableSoundNotifications', e.target.checked)
            }
          />
        </label>

        {settings.enableSoundNotifications && (
          <>
            <label className={styles.settingField}>
              <span className={styles.settingLabel}>
                Sound volume ({Math.round(settings.soundVolume * 100)}%)
              </span>
              <input
                type="range"
                className={styles.settingRange}
                min={0}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={(e) =>
                  updateSetting('soundVolume', Number(e.target.value))
                }
              />
            </label>
            <p className={styles.settingHint}>
              Browsers cannot read your device volume. If sounds feel loud,
              lower this slider or your system volume.
            </p>
          </>
        )}
      </section>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Appearance</h3>

        <label className={styles.settingField}>
          <span className={styles.settingLabel}>Theme</span>
          <div className={styles.settingRadioGroup}>
            {(['dark', 'light', 'system'] as const).map((t) => (
              <label key={t} className={styles.settingRadio}>
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={settings.theme === t}
                  onChange={() => updateSetting('theme', t)}
                />
                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </label>
            ))}
          </div>
        </label>
      </section>

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
          onClick={() => setShowResetModal(true)}
        >
          Clear All Data
        </button>
      </div>

      {showResetModal && (
        <ConfirmModal
          title="Clear All Data?"
          body="This will permanently delete all your session history and progress. This cannot be undone."
          confirmLabel="Delete Everything"
          confirmVariant="danger"
          onCancel={() => setShowResetModal(false)}
          onConfirm={() => {
            clearSessions();
            resetSettings();
            setShowResetModal(false);
          }}
        />
      )}
    </div>
  );
}
