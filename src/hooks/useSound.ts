/**
 * useSound — React hook for playing UI sound effects.
 * Reads preferences store; no-ops when sound is disabled.
 * Ensures AudioContext is resumed on first user interaction.
 */

import { useCallback, useRef } from 'react';
import { usePreferencesStore } from '../store/preferencesStore';
import { ensureAudioResumed, setMasterVolume } from '../audio/audioEngine';
import * as sounds from '../audio/sounds';

export type SoundName = keyof typeof sounds;

export function useSound() {
  const soundEnabled = usePreferencesStore(s => s.soundEnabled);
  const masterVolume = usePreferencesStore(s => s.masterVolume);
  const resumedRef = useRef(false);

  const play = useCallback(async (name: SoundName) => {
    if (!soundEnabled) return;

    // Ensure context is resumed on first play
    if (!resumedRef.current) {
      await ensureAudioResumed();
      resumedRef.current = true;
    }

    setMasterVolume(masterVolume);
    const fn = sounds[name];
    if (typeof fn === 'function') fn();
  }, [soundEnabled, masterVolume]);

  return { play };
}
