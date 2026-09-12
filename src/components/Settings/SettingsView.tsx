import { useId, useState, type ReactNode } from 'react';
import { isScreenWakeLockSupported } from '@/hooks/useScreenWakeLock';
import { useSettingsStore } from '@/stores/settingsStore';
import type { TimerSettings } from '@/lib/types';
import styles from './Settings.module.css';
import { SettingsDataActions } from './SettingsDataActions';

interface SettingOption {
  label: string;
  value: number;
}

interface SettingSelectProps {
  label: string;
  value: number;
  options: readonly SettingOption[];
  onChange: (value: number) => void;
}

interface ToggleSettingProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}

const FOCUS_OPTIONS = [5, 10, 15, 20, 25, 30, 45, 60].map((minutes) => ({
  label: `${minutes} minutes`,
  value: minutes * 60,
}));

const SHORT_BREAK_OPTIONS = [3, 5, 10, 15].map((minutes) => ({
  label: `${minutes} minutes`,
  value: minutes * 60,
}));

const LONG_BREAK_OPTIONS = [10, 15, 20, 30].map((minutes) => ({
  label: `${minutes} minutes`,
  value: minutes * 60,
}));

const SESSION_OPTIONS = [2, 3, 4, 5, 6].map((sessions) => ({
  label: `${sessions}`,
  value: sessions,
}));

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: SettingSelectProps) {
  const inputId = useId();

  return (
    <div className={styles.settingField}>
      <label className={styles.settingLabel} htmlFor={inputId}>
        {label}
      </label>
      <select
        id={inputId}
        className={styles.settingInput}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleSetting({
  label,
  checked,
  onChange,
  children,
}: ToggleSettingProps) {
  const inputId = useId();
  const panelId = useId();
  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <div className={styles.settingToggleBlock}>
      <div className={`${styles.settingField} ${styles.settingFieldToggle}`}>
        <label className={styles.settingLabel} htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          type="checkbox"
          className={`${styles.settingToggle} ${isInitialized ? styles.settingToggleInitialized : ''}`}
          checked={checked}
          aria-controls={children ? panelId : undefined}
          aria-expanded={children ? checked : undefined}
          onChange={(event) => {
            setIsInitialized(true);
            onChange(event.target.checked);
          }}
        />
      </div>
      {children && (
        <div
          id={panelId}
          className={styles.settingReveal}
          data-open={checked}
          aria-hidden={!checked}
          inert={checked ? undefined : true}
        >
          <div className={styles.settingRevealInner}>{children}</div>
        </div>
      )}
    </div>
  );
}

export function SettingsView() {
  const { settings, updateSettings } = useSettingsStore();

  const updateSetting = <K extends keyof TimerSettings>(
    key: K,
    value: TimerSettings[K],
  ) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className={styles.settingsView}>
      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Timer</h3>
        <p className={styles.groupDescription}>
          Choose a rhythm that feels realistic today. You can change it anytime.
        </p>
        <div className={styles.settingsGrid}>
          <SettingSelect
            label="Focus duration"
            value={settings.focusDuration}
            options={FOCUS_OPTIONS}
            onChange={(value) => updateSetting('focusDuration', value)}
          />
          <SettingSelect
            label="Short break"
            value={settings.shortBreakDuration}
            options={SHORT_BREAK_OPTIONS}
            onChange={(value) => updateSetting('shortBreakDuration', value)}
          />
          <SettingSelect
            label="Long break"
            value={settings.longBreakDuration}
            options={LONG_BREAK_OPTIONS}
            onChange={(value) => updateSetting('longBreakDuration', value)}
          />
          <SettingSelect
            label="Focus blocks before long break"
            value={settings.sessionsBeforeLongBreak}
            options={SESSION_OPTIONS}
            onChange={(value) => updateSetting('sessionsBeforeLongBreak', value)}
          />
        </div>
      </section>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Focus Aids</h3>
        <p className={styles.groupDescription}>
          Keep reminders noticeable without making the timer feel busy.
        </p>
        <ToggleSetting
          label="Visual cues"
          checked={settings.enableVisualCues}
          onChange={(checked) => updateSetting('enableVisualCues', checked)}
        >
          <label className={styles.settingField}>
            <span className={styles.settingLabel}>
              Cue intensity: {settings.visualCueIntensity} of 10
            </span>
            <input
              type="range"
              className={styles.settingRange}
              min={1}
              max={10}
              value={settings.visualCueIntensity}
              aria-valuetext={`${settings.visualCueIntensity} of 10`}
              onChange={(event) =>
                updateSetting('visualCueIntensity', Number(event.target.value))
              }
            />
            <span className={styles.rangeLabels} aria-hidden="true">
              <span>Calm</span>
              <span>Strong</span>
            </span>
          </label>
        </ToggleSetting>

        <ToggleSetting
          label="Sound notifications"
          checked={settings.enableSoundNotifications}
          onChange={(checked) =>
            updateSetting('enableSoundNotifications', checked)
          }
        >
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
                aria-valuetext={`${Math.round(settings.soundVolume * 100)} percent`}
                onChange={(event) =>
                  updateSetting('soundVolume', Number(event.target.value))
                }
              />
            </label>
            <p className={styles.settingHint}>
              Browsers cannot read your device volume. If sounds feel loud,
              lower this slider or your system volume.
            </p>
          </>
        </ToggleSetting>

        <ToggleSetting
          label="Keep screen awake"
          checked={settings.keepScreenAwake}
          onChange={(checked) => updateSetting('keepScreenAwake', checked)}
        />

        <p className={styles.settingHint}>
          {isScreenWakeLockSupported()
            ? 'Stops your phone from dimming or locking while this page is open. Switching tabs or apps ends it until you come back.'
            : 'This browser cannot keep the screen awake. Chrome or Edge on Android, and Safari on iOS 16.4 or later, support it.'}
        </p>
      </section>

      <section className={styles.settingsGroup}>
        <h3 className={styles.settingsGroupTitle}>Appearance</h3>
        <fieldset className={styles.settingField}>
          <legend className={styles.settingLabel}>Theme</legend>
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
        </fieldset>
      </section>

      <SettingsDataActions />
    </div>
  );
}
