import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { useSettingsStore } from '@/stores/settingsStore';
import styles from './Settings.module.css';
import { SettingsView } from './SettingsView';

describe('SettingsView motion states', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS },
    });
  });

  it('initializes toggle motion only after interaction', () => {
    render(<SettingsView />);
    const soundToggle = screen.getByRole('checkbox', {
      name: 'Sound notifications',
    });

    expect(soundToggle).not.toHaveClass(styles.settingToggleInitialized);
    fireEvent.click(soundToggle);

    expect(soundToggle).toHaveClass(styles.settingToggleInitialized);
    expect(soundToggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps collapsed dependent controls inert and hidden from accessibility', () => {
    render(<SettingsView />);
    const soundToggle = screen.getByRole('checkbox', {
      name: 'Sound notifications',
    });
    const panelId = soundToggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');

    fireEvent.click(soundToggle);

    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(panel).not.toHaveAttribute('inert');
  });
});
