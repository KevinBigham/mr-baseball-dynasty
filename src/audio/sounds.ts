/**
 * Procedural UI sound effects using Web Audio API.
 * Zero audio files — all sounds are synthesized.
 * Each function creates short-lived oscillator/noise nodes.
 */

import { getAudioContext, getMasterGain } from './audioEngine';

// ─── Helpers ──────────────────────────────────────────────────

function createOsc(ctx: AudioContext, type: OscillatorType, freq: number, gain: number, duration: number, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function createNoiseBurst(ctx: AudioContext, duration: number, gain: number, dest: AudioNode): void {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5; // Using Math.random is fine for audio noise (not simulation)
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(g);
  g.connect(dest);
  source.start(ctx.currentTime);
}

// ─── Sound Effects ──────────────────────────────────────────

/** Subtle mechanical click — Bloomberg terminal feel */
export function playClick(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Short high-frequency burst with fast decay
  createOsc(ctx, 'square', 1200, 0.08, 0.04, master);
  createNoiseBurst(ctx, 0.02, 0.06, master);
}

/** Soft navigation sound — page turn / tab switch */
export function playNav(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Gentle descending sweep
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  g.gain.setValueAtTime(0.05, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(g);
  g.connect(master);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/** Trade completed — stamp/seal sound */
export function playStamp(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  createOsc(ctx, 'square', 220, 0.12, 0.08, master);
  createNoiseBurst(ctx, 0.06, 0.15, master);
  createOsc(ctx, 'sine', 330, 0.06, 0.15, master);
}

/** Draft pick — card flip / gavel bang */
export function playDraftPick(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Sharp attack + resonant decay
  createNoiseBurst(ctx, 0.03, 0.18, master);
  createOsc(ctx, 'triangle', 440, 0.1, 0.12, master);
  createOsc(ctx, 'sine', 660, 0.05, 0.18, master);
}

/** Milestone achieved — chime */
export function playChime(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Two-tone ascending chime
  createOsc(ctx, 'sine', 523, 0.08, 0.2, master);
  setTimeout(() => {
    if (ctx.state === 'running') {
      createOsc(ctx, 'sine', 784, 0.06, 0.3, master);
    }
  }, 80);
}

/** Error/warning — subtle buzz */
export function playBuzz(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  createOsc(ctx, 'sawtooth', 150, 0.06, 0.12, master);
}

/** Season advance — whoosh */
export function playAdvance(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Rising sweep with noise
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
  g.gain.setValueAtTime(0.06, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(g);
  g.connect(master);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
  createNoiseBurst(ctx, 0.08, 0.04, master);
}

/** Signing / confirmation — cash register cha-ching */
export function playSigning(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  // Bell-like strike + shimmer
  createOsc(ctx, 'sine', 1047, 0.08, 0.15, master);
  createOsc(ctx, 'sine', 1319, 0.06, 0.2, master);
  setTimeout(() => {
    if (ctx.state === 'running') {
      createOsc(ctx, 'triangle', 1568, 0.04, 0.25, master);
    }
  }, 60);
}

/** Save confirmation — brief positive tone */
export function playSave(): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;
  createOsc(ctx, 'sine', 440, 0.06, 0.1, master);
  createOsc(ctx, 'sine', 554, 0.04, 0.15, master);
}
