import { create } from 'zustand';

/**
 * PreferencesStore — user preferences that persist across games via localStorage.
 * Covers audio, animation, and accessibility settings.
 */

const STORAGE_KEY = 'mbd-preferences';

interface PreferencesStore {
  // Audio
  masterVolume: number;   // 0–1
  soundEnabled: boolean;  // master mute toggle
  ambientEnabled: boolean;

  // Accessibility / Motion
  reduceMotion: boolean;

  // Setters
  setMasterVolume: (v: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setAmbientEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
}

function loadPrefs(): Partial<PreferencesStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function persistPrefs(state: Partial<PreferencesStore>) {
  try {
    const current = loadPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch { /* ignore */ }
}

const saved = loadPrefs();

export const usePreferencesStore = create<PreferencesStore>(set => ({
  masterVolume:   saved.masterVolume ?? 0.3,
  soundEnabled:   saved.soundEnabled ?? true,
  ambientEnabled: saved.ambientEnabled ?? true,
  reduceMotion:   saved.reduceMotion ?? false,

  setMasterVolume: v => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ masterVolume: clamped });
    persistPrefs({ masterVolume: clamped });
  },
  setSoundEnabled: v => {
    set({ soundEnabled: v });
    persistPrefs({ soundEnabled: v });
  },
  setAmbientEnabled: v => {
    set({ ambientEnabled: v });
    persistPrefs({ ambientEnabled: v });
  },
  setReduceMotion: v => {
    set({ reduceMotion: v });
    persistPrefs({ reduceMotion: v });
  },
}));
