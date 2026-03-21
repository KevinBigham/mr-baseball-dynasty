/**
 * Round 4: Sound & Fury — Tests
 * Covers: PreferencesStore, AudioEngine, Sounds, Ambience, Animations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock localStorage for non-jsdom environments ──────────────────────────
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (i: number) => Object.keys(storage)[i] ?? null,
};
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
}

// ─── PreferencesStore Tests ────────────────────────────────────────────────

describe('PreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('has correct defaults', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    const state = usePreferencesStore.getState();
    expect(state.masterVolume).toBe(0.3);
    expect(state.soundEnabled).toBe(true);
    expect(state.ambientEnabled).toBe(true);
    expect(state.reduceMotion).toBe(false);
  });

  it('clamps volume to 0-1 range', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    usePreferencesStore.getState().setMasterVolume(1.5);
    expect(usePreferencesStore.getState().masterVolume).toBe(1);
    usePreferencesStore.getState().setMasterVolume(-0.5);
    expect(usePreferencesStore.getState().masterVolume).toBe(0);
  });

  it('persists sound toggle to localStorage', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    usePreferencesStore.getState().setSoundEnabled(false);
    expect(usePreferencesStore.getState().soundEnabled).toBe(false);
    const stored = JSON.parse(localStorage.getItem('mbd-preferences') ?? '{}');
    expect(stored.soundEnabled).toBe(false);
  });

  it('persists reduceMotion to localStorage', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    usePreferencesStore.getState().setReduceMotion(true);
    expect(usePreferencesStore.getState().reduceMotion).toBe(true);
    const stored = JSON.parse(localStorage.getItem('mbd-preferences') ?? '{}');
    expect(stored.reduceMotion).toBe(true);
  });

  it('persists ambient toggle to localStorage', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    usePreferencesStore.getState().setAmbientEnabled(false);
    expect(usePreferencesStore.getState().ambientEnabled).toBe(false);
    const stored = JSON.parse(localStorage.getItem('mbd-preferences') ?? '{}');
    expect(stored.ambientEnabled).toBe(false);
  });

  it('persists volume to localStorage', async () => {
    const { usePreferencesStore } = await import('../../src/store/preferencesStore');
    usePreferencesStore.getState().setMasterVolume(0.7);
    expect(usePreferencesStore.getState().masterVolume).toBe(0.7);
    const stored = JSON.parse(localStorage.getItem('mbd-preferences') ?? '{}');
    expect(stored.masterVolume).toBe(0.7);
  });
});

// ─── AudioEngine Tests ─────────────────────────────────────────────────────

describe('AudioEngine', () => {
  it('reports audio availability', async () => {
    const { isAudioAvailable } = await import('../../src/audio/audioEngine');
    expect(typeof isAudioAvailable()).toBe('boolean');
  });

  it('getAudioContext returns null or AudioContext', async () => {
    const { getAudioContext } = await import('../../src/audio/audioEngine');
    const ctx = getAudioContext();
    // In Node/test environment, AudioContext likely doesn't exist → null
    expect(ctx === null || typeof ctx === 'object').toBe(true);
  });

  it('setMasterVolume does not throw when no context', async () => {
    const { setMasterVolume } = await import('../../src/audio/audioEngine');
    expect(() => setMasterVolume(0.5)).not.toThrow();
  });
});

// ─── Sounds Tests ──────────────────────────────────────────────────────────

describe('Sound effects', () => {
  it('all sound functions exist and do not throw', async () => {
    const sounds = await import('../../src/audio/sounds');
    const fns = [
      'playClick', 'playNav', 'playStamp', 'playDraftPick',
      'playChime', 'playBuzz', 'playAdvance', 'playSigning', 'playSave',
    ] as const;
    for (const name of fns) {
      expect(typeof sounds[name]).toBe('function');
      // Should not throw even without AudioContext
      expect(() => sounds[name]()).not.toThrow();
    }
  });
});

// ─── Ambience Tests ────────────────────────────────────────────────────────

describe('Ambience', () => {
  it('setAmbienceMode does not throw for all modes', async () => {
    const { setAmbienceMode, stopAmbience } = await import('../../src/audio/ambience');
    const modes = ['office', 'season', 'playoffs', 'draft', 'offseason', 'silent'] as const;
    for (const mode of modes) {
      expect(() => setAmbienceMode(mode)).not.toThrow();
    }
    stopAmbience();
  });

  it('getCurrentAmbienceMode returns silent by default', async () => {
    vi.resetModules();
    const { getCurrentAmbienceMode } = await import('../../src/audio/ambience');
    expect(getCurrentAmbienceMode()).toBe('silent');
  });

  it('stopAmbience does not throw when no ambience is playing', async () => {
    const { stopAmbience } = await import('../../src/audio/ambience');
    expect(() => stopAmbience()).not.toThrow();
  });
});

// ─── CSS Animation Classes Tests ───────────────────────────────────────────

describe('CSS animation classes', () => {
  it('animation CSS keyframes are defined in index.css', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../../src/index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@keyframes mbd-slide-up');
    expect(css).toContain('@keyframes mbd-fade-in');
    expect(css).toContain('@keyframes mbd-attention-pulse');
    expect(css).toContain('@keyframes mbd-row-flash');
    expect(css).toContain('@keyframes mbd-decisive-flash');
    expect(css).toContain('@keyframes mbd-scale-pop');
    // Reduced motion media query
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
