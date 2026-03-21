/**
 * AudioEngine — singleton Web Audio API manager.
 * All sound generation is procedural (no audio files).
 * Lazy-initializes AudioContext on first user interaction (autoplay policy).
 */

let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _initialized = false;

/** Lazily create and return the shared AudioContext. */
export function getAudioContext(): AudioContext | null {
  if (_ctx) return _ctx;
  try {
    _ctx = new AudioContext();
    _masterGain = _ctx.createGain();
    _masterGain.connect(_ctx.destination);
    _initialized = true;
  } catch {
    // Web Audio not supported
    _ctx = null;
  }
  return _ctx;
}

/** Resume context if suspended (autoplay policy). Call on first user gesture. */
export async function ensureAudioResumed(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/** Get the master gain node (all sounds route through this). */
export function getMasterGain(): GainNode | null {
  if (!_masterGain && !_initialized) getAudioContext();
  return _masterGain;
}

/** Set master volume (0–1). */
export function setMasterVolume(volume: number): void {
  const gain = getMasterGain();
  if (gain) {
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), gain.context.currentTime);
  }
}

/** Check if audio engine is available. */
export function isAudioAvailable(): boolean {
  return _ctx !== null || typeof AudioContext !== 'undefined';
}
