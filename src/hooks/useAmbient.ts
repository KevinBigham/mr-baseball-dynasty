/**
 * useAmbient — React hook for context-sensitive ambient audio.
 * Automatically sets ambience mode based on game phase.
 * Respects user preferences (ambient toggle, volume).
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { ensureAudioResumed, setMasterVolume } from '../audio/audioEngine';
import { setAmbienceMode, stopAmbience, type AmbienceMode } from '../audio/ambience';

export function useAmbient(): void {
  const gamePhase = useGameStore(s => s.gamePhase);
  const gameStarted = useGameStore(s => s.gameStarted);
  const soundEnabled = usePreferencesStore(s => s.soundEnabled);
  const ambientEnabled = usePreferencesStore(s => s.ambientEnabled);
  const masterVolume = usePreferencesStore(s => s.masterVolume);

  useEffect(() => {
    if (!soundEnabled || !ambientEnabled || !gameStarted) {
      stopAmbience();
      return;
    }

    // Map game phase to ambience mode
    let mode: AmbienceMode = 'office';
    switch (gamePhase) {
      case 'in_season':
      case 'simulating':
        mode = 'season';
        break;
      case 'postseason':
        mode = 'playoffs';
        break;
      case 'offseason':
        mode = 'offseason';
        break;
      case 'preseason':
        mode = 'office';
        break;
      default:
        mode = 'office';
    }

    void ensureAudioResumed().then(() => {
      setMasterVolume(masterVolume);
      setAmbienceMode(mode);
    });

    return () => { stopAmbience(); };
  }, [gamePhase, gameStarted, soundEnabled, ambientEnabled, masterVolume]);
}
