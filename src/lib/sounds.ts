import { useSettingsStore } from '../stores/settingsStore';

export type SoundEffect =
  | 'start'
  | 'complete'
  | 'breakStart'
  | 'breakEnd'
  | 'click'
  | 'flowPulse';

export const SOUND_LABELS: Record<SoundEffect, string> = {
  start: 'Start',
  complete: 'Complete',
  breakStart: 'Break',
  breakEnd: 'Break End',
  click: 'Click',
  flowPulse: 'Flow',
};

export const ALL_SOUND_EFFECTS: SoundEffect[] = [
  'start',
  'complete',
  'breakStart',
  'breakEnd',
  'click',
  'flowPulse',
];

const SOUND_FILES: Record<SoundEffect, string> = {
  start: 'sounds/start.wav',
  complete: 'sounds/complete.wav',
  breakStart: 'sounds/break-start.wav',
  breakEnd: 'sounds/break-end.wav',
  click: 'sounds/click.wav',
  flowPulse: 'sounds/flow-pulse.wav',
};

const DEFAULT_VOLUMES: Record<SoundEffect, number> = {
  start: 0.5,
  complete: 0.6,
  breakStart: 0.4,
  breakEnd: 0.5,
  click: 0.3,
  flowPulse: 0.2,
};

const audioCache = new Map<SoundEffect, HTMLAudioElement>();

function getAudioUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}${file}`;
}

function getOrCreateAudio(effect: SoundEffect): HTMLAudioElement {
  let audio = audioCache.get(effect);
  if (!audio) {
    audio = new Audio(getAudioUrl(SOUND_FILES[effect]));
    audio.preload = 'auto';
    audioCache.set(effect, audio);
  }
  return audio;
}

export function preloadSounds(): void {
  for (const effect of ALL_SOUND_EFFECTS) {
    getOrCreateAudio(effect);
  }
}

/**
 * Force-play a sound, bypassing the enableSoundNotifications setting.
 * Used by the debug panel for previewing sounds.
 */
export function forcePlay(effect: SoundEffect, volume?: number): void {
  const audio = getOrCreateAudio(effect);
  audio.volume = volume ?? DEFAULT_VOLUMES[effect];
  audio.currentTime = 0;
  audio.play().catch(() => {
    /* browser blocked autoplay — ignore */
  });
}

/**
 * Play a sound only if enableSoundNotifications is on.
 */
export function playSound(effect: SoundEffect, volume?: number): void {
  const enabled = useSettingsStore.getState().settings.enableSoundNotifications;
  if (!enabled) return;
  forcePlay(effect, volume);
}
