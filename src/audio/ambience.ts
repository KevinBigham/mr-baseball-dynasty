/**
 * Ambient Soundscape System — procedural background audio that changes with game context.
 * Uses filtered noise + low-frequency oscillators for atmosphere.
 * All sounds are generated, not loaded from files.
 */

import { getAudioContext, getMasterGain } from './audioEngine';

export type AmbienceMode = 'office' | 'season' | 'playoffs' | 'draft' | 'offseason' | 'silent';

interface AmbienceState {
  mode: AmbienceMode;
  nodes: AudioNode[];
  sources: (AudioBufferSourceNode | OscillatorNode)[];
}

let _state: AmbienceState | null = null;

/** Stop all ambient sounds. */
export function stopAmbience(): void {
  if (!_state) return;
  _state.sources.forEach(s => {
    try { s.stop(); } catch { /* already stopped */ }
  });
  _state.nodes.forEach(n => { n.disconnect(); });
  _state = null;
}

/** Create a looping filtered noise buffer. */
function createLoopingNoise(
  ctx: AudioContext,
  dest: AudioNode,
  volume: number,
  lpFreq: number,
  hpFreq: number,
): { source: AudioBufferSourceNode; nodes: AudioNode[] } {
  const duration = 4; // 4-second loop
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown noise (smoother than white)
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1; // Audio noise, not simulation
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(lpFreq, ctx.currentTime);

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(hpFreq, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  // Fade in over 1 second
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1);

  source.connect(lp);
  lp.connect(hp);
  hp.connect(gain);
  gain.connect(dest);

  source.start(ctx.currentTime);

  return { source, nodes: [lp, hp, gain] };
}

/** Create a sub-bass drone. */
function createDrone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  volume: number,
): { source: OscillatorNode; nodes: AudioNode[] } {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(ctx.currentTime);

  return { source: osc, nodes: [gain] };
}

/** Set the ambient soundscape mode. */
export function setAmbienceMode(mode: AmbienceMode): void {
  if (_state?.mode === mode) return;
  stopAmbience();
  if (mode === 'silent') return;

  const ctx = getAudioContext();
  const master = getMasterGain();
  if (!ctx || !master) return;

  // Create an ambient gain node at low volume (ambient is subtle)
  const ambientGain = ctx.createGain();
  ambientGain.gain.setValueAtTime(0.35, ctx.currentTime);
  ambientGain.connect(master);

  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  const nodes: AudioNode[] = [ambientGain];

  switch (mode) {
    case 'office': {
      // Soft office ambiance — low rumble, very quiet
      const noise = createLoopingNoise(ctx, ambientGain, 0.03, 400, 60);
      sources.push(noise.source);
      nodes.push(...noise.nodes);
      const drone = createDrone(ctx, ambientGain, 55, 0.015);
      sources.push(drone.source);
      nodes.push(...drone.nodes);
      break;
    }
    case 'season': {
      // Distant crowd murmur — wider frequency band
      const crowd = createLoopingNoise(ctx, ambientGain, 0.05, 1200, 100);
      sources.push(crowd.source);
      nodes.push(...crowd.nodes);
      const bass = createDrone(ctx, ambientGain, 80, 0.012);
      sources.push(bass.source);
      nodes.push(...bass.nodes);
      break;
    }
    case 'playoffs': {
      // Louder crowd — higher energy
      const crowd = createLoopingNoise(ctx, ambientGain, 0.08, 2000, 150);
      sources.push(crowd.source);
      nodes.push(...crowd.nodes);
      const bass = createDrone(ctx, ambientGain, 100, 0.02);
      sources.push(bass.source);
      nodes.push(...bass.nodes);
      // Organ-like overtone
      const organ = createDrone(ctx, ambientGain, 262, 0.008);
      sources.push(organ.source);
      nodes.push(...organ.nodes);
      break;
    }
    case 'draft': {
      // War room tension — quiet with occasional low tones
      const noise = createLoopingNoise(ctx, ambientGain, 0.025, 300, 80);
      sources.push(noise.source);
      nodes.push(...noise.nodes);
      const tension = createDrone(ctx, ambientGain, 65, 0.018);
      sources.push(tension.source);
      nodes.push(...tension.nodes);
      break;
    }
    case 'offseason': {
      // Quieter office — rain-like filtered noise
      const rain = createLoopingNoise(ctx, ambientGain, 0.04, 800, 200);
      sources.push(rain.source);
      nodes.push(...rain.nodes);
      break;
    }
  }

  _state = { mode, nodes, sources };
}

/** Get current ambience mode. */
export function getCurrentAmbienceMode(): AmbienceMode {
  return _state?.mode ?? 'silent';
}
