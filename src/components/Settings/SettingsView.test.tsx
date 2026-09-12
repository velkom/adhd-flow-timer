import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('slides the theme indicator while preserving native radio behavior', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
      function getOffsetLeft(this: HTMLElement) {
        return this.textContent?.includes('Light') ? 70 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(64);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(42);

    render(<SettingsView />);
    const lightRadio = screen.getByRole('radio', { name: 'Light' });
    const group = lightRadio.closest(`.${styles.settingRadioGroup}`);
    const indicator = group?.querySelector(
      `.${styles.settingRadioIndicator}`,
    );

    fireEvent.click(lightRadio);

    expect(lightRadio).toBeChecked();
    expect(indicator).toHaveAttribute('data-animate', 'true');
    expect(
      (indicator as HTMLElement).style.getPropertyValue('--indicator-x'),
    ).toBe('70px');
  });
});
