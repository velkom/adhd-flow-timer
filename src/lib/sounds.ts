import { useSettingsStore } from '@/stores/settingsStore';
import { DEFAULT_SETTINGS } from './types';

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

/** Absolute ceiling per effect after master gain (reduces harsh peaks at max in-app volume). */
const EFFECT_VOLUME_CAPS: Record<SoundEffect, number> = {
  start: 0.35,
  complete: 0.35,
  breakStart: 0.28,
  breakEnd: 0.3,
  click: 0.22,
  flowPulse: 0.15,
};

const audioCache = new Map<SoundEffect, HTMLAudioElement>();

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function resolveEffectiveVolume(effect: SoundEffect, baseVolume?: number): number {
  const rawMaster = useSettingsStore.getState().settings.soundVolume;
  const master = clamp01(
    typeof rawMaster === 'number' && !Number.isNaN(rawMaster)
      ? rawMaster
      : DEFAULT_SETTINGS.soundVolume,
  );
  const base = baseVolume ?? DEFAULT_VOLUMES[effect];
  const scaled = base * master;
  const cap = EFFECT_VOLUME_CAPS[effect];
  return clamp01(Math.min(scaled, cap));
}

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
  audio.volume = resolveEffectiveVolume(effect, volume);
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
