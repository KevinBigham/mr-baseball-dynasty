/**
 * SettingsPanel — audio and accessibility settings overlay.
 * Volume slider, mute toggle, ambient toggle, reduce motion toggle.
 */

import { usePreferencesStore } from '../../store/preferencesStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useCallback } from 'react';

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const {
    masterVolume, soundEnabled, ambientEnabled, reduceMotion,
    setMasterVolume, setSoundEnabled, setAmbientEnabled, setReduceMotion,
  } = usePreferencesStore();

  useEscapeKey(useCallback(() => onClose(), [onClose]));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bloomberg-border bg-[#0F1930] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div id="settings-title" className="text-orange-500 font-bold text-xs tracking-widest">SETTINGS</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-sm transition-colors"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* ── Audio Section ───────────────────────────── */}
          <div className="border-b border-[#1E2A4A] pb-3">
            <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] mb-3">AUDIO</div>

            {/* Sound Enabled Toggle */}
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-gray-300 text-xs">Sound Effects</span>
              <button
                role="switch"
                aria-checked={soundEnabled}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${soundEnabled ? 'bg-orange-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            {/* Ambient Toggle */}
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-gray-300 text-xs">Ambient Soundscape</span>
              <button
                role="switch"
                aria-checked={ambientEnabled}
                onClick={() => setAmbientEnabled(!ambientEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${ambientEnabled ? 'bg-orange-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${ambientEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">Volume</span>
                <span className="text-gray-500 text-[10px] tabular-nums">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(masterVolume * 100)}
                onChange={e => setMasterVolume(Number(e.target.value) / 100)}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                disabled={!soundEnabled}
                aria-label="Master volume"
              />
            </div>
          </div>

          {/* ── Accessibility Section ──────────────────── */}
          <div>
            <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] mb-3">ACCESSIBILITY</div>

            {/* Reduce Motion Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-300 text-xs">Reduce Motion</span>
                <div className="text-[9px] text-gray-500 mt-0.5">Disables all animations</div>
              </div>
              <button
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`relative w-10 h-5 rounded-full transition-colors ${reduceMotion ? 'bg-orange-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${reduceMotion ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
