import type { Position } from '../../types/player';

// ─── Scouting scale conversions ───────────────────────────────────────────────
// Internal: 0–550. MLB average ~400. AAA average ~300.
// Display: 20–80 scouting scale.

export function toScoutingScale(internal: number): number {
  return Math.round(20 + (Math.max(0, Math.min(550, internal)) / 550) * 60);
}

export function fromScoutingScale(scouting: number): number {
  return Math.round(((Math.max(20, Math.min(80, scouting)) - 20) / 60) * 550);
}

// ─── Aging curves by attribute ────────────────────────────────────────────────
// Returns delta to apply at a given age. Positive = growth, negative = decline.

export interface AgingCurve {
  peakAge: number;
  peakAge2?: number;   // For plateau ranges
  riseRate: number;    // pts/yr before peak
  declineRate: number; // pts/yr after peak (positive number = decline magnitude)
  earlyDeclineAge?: number; // Age when decline accelerates
  lateDeclineRate?: number;
}

export const HITTER_AGING: Record<keyof import('../../types/player').HitterAttributes, AgingCurve> = {
  contact:         { peakAge: 27, peakAge2: 29, riseRate: 15, declineRate: 6 },
  power:           { peakAge: 27, peakAge2: 30, riseRate: 18, declineRate: 10, earlyDeclineAge: 34, lateDeclineRate: 18 },
  eye:             { peakAge: 29, peakAge2: 32, riseRate: 10, declineRate: 4 },
  speed:           { peakAge: 23, peakAge2: 26, riseRate: 8,  declineRate: 15, earlyDeclineAge: 30, lateDeclineRate: 22 },
  baserunningIQ:   { peakAge: 28, peakAge2: 32, riseRate: 8,  declineRate: 2 },
  fielding:        { peakAge: 24, peakAge2: 28, riseRate: 20, declineRate: 8 },
  armStrength:     { peakAge: 24, peakAge2: 27, riseRate: 15, declineRate: 12 },
  durability:      { peakAge: 26, peakAge2: 30, riseRate: 5,  declineRate: 8 },
  platoonSensitivity: { peakAge: 25, riseRate: 0, declineRate: 0 }, // Stable
  offensiveIQ:     { peakAge: 30, peakAge2: 32, riseRate: 8,  declineRate: 1 }, // Very slow
  defensiveIQ:     { peakAge: 28, peakAge2: 30, riseRate: 8,  declineRate: 1 },
  workEthic:       { peakAge: 25, riseRate: 0, declineRate: 0 }, // Stable
  mentalToughness: { peakAge: 35, riseRate: 3,  declineRate: 0 }, // Increases with experience
};

export const PITCHER_AGING: Record<keyof import('../../types/player').PitcherAttributes, AgingCurve> = {
  stuff:              { peakAge: 25, peakAge2: 28, riseRate: 18, declineRate: 12, earlyDeclineAge: 33, lateDeclineRate: 20 },
  movement:           { peakAge: 27, peakAge2: 30, riseRate: 12, declineRate: 6 },
  command:            { peakAge: 29, peakAge2: 33, riseRate: 10, declineRate: 4 },
  stamina:            { peakAge: 26, peakAge2: 30, riseRate: 10, declineRate: 10 },
  pitchArsenalCount:  { peakAge: 28, riseRate: 0.1, declineRate: 0 }, // Via dev lab
  gbFbTendency:       { peakAge: 25, riseRate: 0, declineRate: 0 }, // Stable
  holdRunners:        { peakAge: 28, riseRate: 5,  declineRate: 2 },
  durability:         { peakAge: 26, peakAge2: 30, riseRate: 5,  declineRate: 8 },
  recoveryRate:       { peakAge: 24, peakAge2: 28, riseRate: 8,  declineRate: 12 },
  platoonTendency:    { peakAge: 25, riseRate: 0,  declineRate: 0 },
  pitchTypeMix:       { peakAge: 25, riseRate: 0,  declineRate: 0 }, // Managed separately
  pitchingIQ:         { peakAge: 30, peakAge2: 34, riseRate: 8,  declineRate: 1 }, // Very slow
  workEthic:          { peakAge: 25, riseRate: 0,  declineRate: 0 },
  mentalToughness:    { peakAge: 35, riseRate: 3,  declineRate: 0 },
};

// ─── Positional overall weight mappings ──────────────────────────────────────
// How much each attribute contributes to "overall" rating per position

export const HITTER_OVERALL_WEIGHTS: Record<Position, Partial<Record<keyof import('../../types/player').HitterAttributes, number>>> = {
  'C':  { contact: 0.25, power: 0.20, eye: 0.10, fielding: 0.20, armStrength: 0.10, durability: 0.10, offensiveIQ: 0.05 },
  '1B': { contact: 0.20, power: 0.30, eye: 0.15, fielding: 0.15, armStrength: 0.05, durability: 0.10, offensiveIQ: 0.05 },
  '2B': { contact: 0.25, power: 0.15, eye: 0.15, fielding: 0.20, armStrength: 0.10, speed: 0.05, durability: 0.05, defensiveIQ: 0.05 },
  '3B': { contact: 0.20, power: 0.25, eye: 0.10, fielding: 0.18, armStrength: 0.12, durability: 0.10, offensiveIQ: 0.05 },
  'SS': { contact: 0.20, power: 0.12, eye: 0.13, fielding: 0.25, armStrength: 0.12, speed: 0.08, durability: 0.05, defensiveIQ: 0.05 },
  'LF': { contact: 0.22, power: 0.25, eye: 0.15, fielding: 0.15, armStrength: 0.08, speed: 0.10, durability: 0.05 },
  'CF': { contact: 0.22, power: 0.18, eye: 0.12, fielding: 0.20, armStrength: 0.08, speed: 0.15, durability: 0.05 },
  'RF': { contact: 0.20, power: 0.28, eye: 0.12, fielding: 0.15, armStrength: 0.10, speed: 0.08, durability: 0.07 },
  'DH': { contact: 0.22, power: 0.33, eye: 0.18, durability: 0.12, offensiveIQ: 0.10, baserunningIQ: 0.05 },
  'SP': { contact: 0.5, power: 0.3, eye: 0.2 }, // Fallback — won't be used for SPs normally
  'RP': { contact: 0.5, power: 0.3, eye: 0.2 },
  'CL': { contact: 0.5, power: 0.3, eye: 0.2 },
};

export const PITCHER_OVERALL_WEIGHTS: Record<'SP' | 'RP' | 'CL', Record<string, number>> = {
  'SP': { stuff: 0.25, movement: 0.20, command: 0.25, stamina: 0.15, pitchArsenalCount: 0.05, pitchingIQ: 0.10 },
  'RP': { stuff: 0.35, movement: 0.18, command: 0.25, stamina: 0.05, pitchArsenalCount: 0.05, pitchingIQ: 0.08, recoveryRate: 0.04 },
  'CL': { stuff: 0.38, movement: 0.15, command: 0.25, stamina: 0.05, pitchArsenalCount: 0.05, pitchingIQ: 0.07, mentalToughness: 0.05 },
};

// ─── Compute overall rating from attributes ───────────────────────────────────
export function computeHitterOverall(
  attrs: import('../../types/player').HitterAttributes,
  pos: Position,
): number {
  const weights = HITTER_OVERALL_WEIGHTS[pos];
  let total = 0;
  let weightSum = 0;
  for (const [attr, w] of Object.entries(weights)) {
    if (w === undefined) continue;
    const val = attrs[attr as keyof import('../../types/player').HitterAttributes];
    if (typeof val === 'number') {
      total += val * w;
      weightSum += w;
    }
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

export function computePitcherOverall(
  attrs: import('../../types/player').PitcherAttributes,
  pos: 'SP' | 'RP' | 'CL',
): number {
  const weights = PITCHER_OVERALL_WEIGHTS[pos];
  let total = 0;
  let weightSum = 0;
  for (const [attr, w] of Object.entries(weights)) {
    const val = attrs[attr as keyof import('../../types/player').PitcherAttributes];
    if (typeof val === 'number') {
      total += val * w;
      weightSum += w;
    }
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

// ─── Default blank hitter attributes ─────────────────────────────────────────
export function blankHitterAttributes(): import('../../types/player').HitterAttributes {
  return {
    contact: 0, power: 0, eye: 0, speed: 0,
    baserunningIQ: 0, fielding: 0, armStrength: 0,
    durability: 0, platoonSensitivity: 0,
    offensiveIQ: 0, defensiveIQ: 0,
    workEthic: 50, mentalToughness: 50,
  };
}

export function blankPitcherAttributes(): import('../../types/player').PitcherAttributes {
  return {
    stuff: 0, movement: 0, command: 0, stamina: 0,
    pitchArsenalCount: 2, gbFbTendency: 50,
    holdRunners: 0, durability: 0, recoveryRate: 0,
    platoonTendency: 0,
    pitchTypeMix: { fastball: 0.55, breaking: 0.30, offspeed: 0.15 },
    pitchingIQ: 0, workEthic: 50, mentalToughness: 50,
  };
}
