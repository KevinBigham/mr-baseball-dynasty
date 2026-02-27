import type { Position } from '../types/player';

// ─── Positional Bayesian priors ───────────────────────────────────────────────
// For hitter attributes. Internal scale 0–550.
// MLB average ~400. AAA average ~300.
// Catchers hit less; 1B and DH hit more. CF and SS have speed priors.

export interface HitterPrior {
  contact: number;
  power: number;
  eye: number;
  speed: number;
  fielding: number;
  armStrength: number;
  durability: number;
}

export const POSITIONAL_HITTER_PRIORS: Record<Position, HitterPrior> = {
  'C':  { contact: 330, power: 310, eye: 330, speed: 270, fielding: 380, armStrength: 390, durability: 340 },
  '1B': { contact: 385, power: 430, eye: 375, speed: 270, fielding: 340, armStrength: 320, durability: 360 },
  '2B': { contact: 365, power: 310, eye: 355, speed: 380, fielding: 390, armStrength: 340, durability: 360 },
  '3B': { contact: 365, power: 390, eye: 355, speed: 340, fielding: 370, armStrength: 380, durability: 360 },
  'SS': { contact: 360, power: 310, eye: 350, speed: 400, fielding: 400, armStrength: 390, durability: 360 },
  'LF': { contact: 370, power: 380, eye: 355, speed: 370, fielding: 350, armStrength: 340, durability: 360 },
  'CF': { contact: 370, power: 345, eye: 345, speed: 430, fielding: 390, armStrength: 360, durability: 360 },
  'RF': { contact: 370, power: 400, eye: 355, speed: 350, fielding: 360, armStrength: 380, durability: 360 },
  'DH': { contact: 375, power: 445, eye: 385, speed: 240, fielding: 0,   armStrength: 0,   durability: 360 },
  // Pitcher priors not used for hitter generation; placeholders
  'SP': { contact: 200, power: 150, eye: 200, speed: 300, fielding: 280, armStrength: 320, durability: 340 },
  'RP': { contact: 200, power: 150, eye: 200, speed: 300, fielding: 250, armStrength: 320, durability: 320 },
  'CL': { contact: 200, power: 150, eye: 200, speed: 300, fielding: 250, armStrength: 330, durability: 330 },
};

export interface PitcherPrior {
  stuff: number;
  movement: number;
  command: number;
  stamina: number;
  gbFbTendency: number; // 0–100
}

// SP: more stamina, command; CL: more stuff; RP: balanced
export const POSITIONAL_PITCHER_PRIORS: Record<'SP' | 'RP' | 'CL', PitcherPrior> = {
  'SP': { stuff: 400, movement: 370, command: 445, stamina: 380, gbFbTendency: 50 },
  'RP': { stuff: 390, movement: 360, command: 370, stamina: 290, gbFbTendency: 48 },
  'CL': { stuff: 420, movement: 350, command: 390, stamina: 270, gbFbTendency: 45 },
};

// ─── Stabilization points (PA/BF before observed rate dominates prior) ───────
export const STABILIZATION_POINTS = {
  kRate: 60,
  bbRate: 120,
  babip: 800,
  isopower: 160,
  pitcherK: 70,
  pitcherBB: 170,
  pitcherBABIP: 2000, // Never adjust pitcher on short BABIP stretch
} as const;

// ─── League baseline rates (calibrated to real MLB) ──────────────────────────
export const LEAGUE_RATES = {
  kRate: 0.225,       // Hitter K%
  bbRate: 0.087,      // Hitter BB%
  hbpRate: 0.011,
  hrRate: 0.034,      // HR per PA
  babip: 0.292,
  gbPercent: 0.45,    // Of balls in play
  fbPercent: 0.35,
  ldPercent: 0.20,
  pitcherKRate: 0.225,  // Pitcher K% (vs BF)
  pitcherBBRate: 0.073,
  pitcherHRRate: 0.030,
} as const;
