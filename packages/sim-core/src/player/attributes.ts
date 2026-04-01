/**
 * @module attributes
 * Player attribute system: 0-550 internal scale, 20-80 display (scouting) scale.
 * Named constants replace magic numbers everywhere.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Internal rating bounds (engine calculations) */
export const RATING_MIN = 0;
export const RATING_MAX = 550;

/** Display (scouting) scale bounds */
export const DISPLAY_MIN = 20;
export const DISPLAY_MAX = 80;

/** Letter grade thresholds on internal scale */
export const GRADE_THRESHOLDS = {
  A: 440,
  B: 330,
  C: 220,
  D: 110,
  F: 0,
} as const;

/** Hitter attribute weights for overall calculation */
export const HITTER_WEIGHTS = {
  contact: 0.25,
  power: 0.20,
  eye: 0.15,
  speed: 0.15,
  defense: 0.15,
  durability: 0.10,
} as const;

/** Pitcher attribute weights for overall calculation */
export const PITCHER_WEIGHTS = {
  stuff: 0.30,
  control: 0.25,
  stamina: 0.15,
  velocity: 0.15,
  movement: 0.15,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HitterAttributes {
  contact: number;
  power: number;
  eye: number;
  speed: number;
  defense: number;
  durability: number;
}

export interface PitcherAttributes {
  stuff: number;
  control: number;
  stamina: number;
  velocity: number;
  movement: number;
}

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** Convert internal (0-550) to display (20-80) scale. */
export function toDisplayRating(internal: number): number {
  const clamped = Math.max(RATING_MIN, Math.min(RATING_MAX, internal));
  return Math.round(DISPLAY_MIN + (clamped / RATING_MAX) * (DISPLAY_MAX - DISPLAY_MIN));
}

/** Convert display (20-80) back to internal (0-550) scale. */
export function toInternalRating(display: number): number {
  const clamped = Math.max(DISPLAY_MIN, Math.min(DISPLAY_MAX, display));
  return Math.round(((clamped - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * RATING_MAX);
}

/** Get letter grade from internal rating. */
export function toLetterGrade(internal: number): LetterGrade {
  if (internal >= GRADE_THRESHOLDS.A) return 'A';
  if (internal >= GRADE_THRESHOLDS.B) return 'B';
  if (internal >= GRADE_THRESHOLDS.C) return 'C';
  if (internal >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

// ---------------------------------------------------------------------------
// Overall rating calculations
// ---------------------------------------------------------------------------

/** Compute overall rating for a hitter (weighted sum, 0-550). */
export function hitterOverall(attrs: HitterAttributes): number {
  return Math.round(
    attrs.contact * HITTER_WEIGHTS.contact +
    attrs.power * HITTER_WEIGHTS.power +
    attrs.eye * HITTER_WEIGHTS.eye +
    attrs.speed * HITTER_WEIGHTS.speed +
    attrs.defense * HITTER_WEIGHTS.defense +
    attrs.durability * HITTER_WEIGHTS.durability
  );
}

/** Compute overall rating for a pitcher (weighted sum, 0-550). */
export function pitcherOverall(attrs: PitcherAttributes): number {
  return Math.round(
    attrs.stuff * PITCHER_WEIGHTS.stuff +
    attrs.control * PITCHER_WEIGHTS.control +
    attrs.stamina * PITCHER_WEIGHTS.stamina +
    attrs.velocity * PITCHER_WEIGHTS.velocity +
    attrs.movement * PITCHER_WEIGHTS.movement
  );
}

/** Clamp a rating to the valid internal range. */
export function clampRating(value: number): number {
  return Math.max(RATING_MIN, Math.min(RATING_MAX, Math.round(value)));
}
