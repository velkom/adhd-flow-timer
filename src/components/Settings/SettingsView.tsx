import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useState } from 'react';

export function SettingsView() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const clearSessions = useSessionStore((s) => s.clearSessions);
  const [showResetModal, setShowResetModal] = useState(false);

  const update = (key: string, value: unknown) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="settings-view">
      <h2 className="view-title">Settings</h2>

      <section className="settings-group">
        <h3 className="settings-group-title">Timer</h3>

        <label className="setting-field">
          <span className="setting-label">Focus Duration</span>
          <select
            className="setting-input"
            value={settings.focusDuration}
            onChange={(e) => update('focusDuration', Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className="setting-field">
          <span className="setting-label">Short Break</span>
          <select
            className="setting-input"
            value={settings.shortBreakDuration}
            onChange={(e) => update('shortBreakDuration', Number(e.target.value))}
          >
            {[3, 5, 10, 15].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className="setting-field">
          <span className="setting-label">Long Break</span>
          <select
            className="setting-input"
            value={settings.longBreakDuration}
            onChange={(e) => update('longBreakDuration', Number(e.target.value))}
          >
            {[10, 15, 20, 30].map((m) => (
              <option key={m} value={m * 60}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>

        <label className="setting-field">
          <span className="setting-label">Sessions before Long Break</span>
          <select
            className="setting-input"
            value={settings.sessionsBeforeLongBreak}
            onChange={(e) =>
              update('sessionsBeforeLongBreak', Number(e.target.value))
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

      <section className="settings-group">
        <h3 className="settings-group-title">Focus Aids</h3>

        <label className="setting-field setting-field--toggle">
          <span className="setting-label">Visual Cues</span>
          <input
            type="checkbox"
            className="setting-toggle"
            checked={settings.enableVisualCues}
            onChange={(e) => update('enableVisualCues', e.target.checked)}
          />
        </label>

        {settings.enableVisualCues && (
          <label className="setting-field">
            <span className="setting-label">
              Cue Intensity ({settings.visualCueIntensity})
            </span>
            <input
              type="range"
              className="setting-range"
              min={1}
              max={10}
              value={settings.visualCueIntensity}
              onChange={(e) =>
                update('visualCueIntensity', Number(e.target.value))
              }
            />
          </label>
        )}

        <label className="setting-field setting-field--toggle">
          <span className="setting-label">Sound Notifications</span>
          <input
            type="checkbox"
            className="setting-toggle"
            checked={settings.enableSoundNotifications}
            onChange={(e) =>
              update('enableSoundNotifications', e.target.checked)
            }
          />
        </label>

        {settings.enableSoundNotifications && (
          <>
            <label className="setting-field">
              <span className="setting-label">
                Sound volume ({Math.round(settings.soundVolume * 100)}%)
              </span>
              <input
                type="range"
                className="setting-range"
                min={0}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={(e) =>
                  update('soundVolume', Number(e.target.value))
                }
              />
            </label>
            <p className="setting-hint">
              Browsers cannot read your device volume. If sounds feel loud,
              lower this slider or your system volume.
            </p>
          </>
        )}
      </section>

      <section className="settings-group">
        <h3 className="settings-group-title">Appearance</h3>

        <label className="setting-field">
          <span className="setting-label">Theme</span>
          <div className="setting-radio-group">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <label key={t} className="setting-radio">
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={settings.theme === t}
                  onChange={() => update('theme', t)}
                />
                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </label>
            ))}
          </div>
        </label>
      </section>

      <div className="settings-actions">
        <button className="btn btn--secondary" onClick={resetSettings}>
          Reset to Defaults
        </button>
        <button
          className="btn btn--danger"
          onClick={() => setShowResetModal(true)}
        >
          Clear All Data
        </button>
      </div>

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Clear All Data?</h3>
            <p className="modal-body">
              This will permanently delete all your session history and progress.
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={() => {
                  clearSessions();
                  resetSettings();
                  setShowResetModal(false);
                }}
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
