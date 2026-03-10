/**
 * chemistryContracts.ts — Chemistry v1 Constants & Contract Layer
 *
 * Versioned constants and contract definitions for the chemistry system.
 * This file is the single source of truth for chemistry version, archetype
 * definitions, and threshold tuning values used by personalityModel.ts.
 *
 * Design rules:
 *   - No runtime state, no side effects
 *   - All thresholds are plain numbers (easy to tune)
 *   - Archetype list is a closed union (type-safe)
 */

// ─── Version ─────────────────────────────────────────────────────────────────

/** Bump this when the chemistry contract changes in a breaking way. */
export const CHEMISTRY_VERSION = 1 as const;

// ─── Archetype union ─────────────────────────────────────────────────────────

/**
 * Canonical personality archetypes derived from existing player data.
 * Slice 1A: engine-only, no UI surface.
 */
export const ARCHETYPES = [
  'veteran_leader',
  'clubhouse_cancer',
  'quiet_professional',
  'hot_head',
  'young_star',
  'neutral',
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

// ─── Derivation thresholds ───────────────────────────────────────────────────

/**
 * Thresholds used by personalityModel.ts to classify archetypes.
 * Grouped by archetype for readability.
 */
export const THRESHOLDS = {
  veteranLeader: {
    minAge: 30,
    minWorkEthic: 70,
    minMentalToughness: 75,
  },
  clubhouseCancer: {
    maxWorkEthic: 30,
    maxMentalToughness: 40,
  },
  quietProfessional: {
    minWorkEthic: 60,
    minMentalToughness: 60,
  },
  hotHead: {
    maxMentalToughness: 30,
  },
  youngStar: {
    maxAge: 25,
    minOverall: 400,
    minWorkEthic: 50,
  },
} as const;

// ─── Position groups (for future mentor-bond logic) ──────────────────────────

export type PositionGroup = 'IF' | 'OF' | 'SP' | 'RP' | 'C' | 'DH';

export const POSITION_GROUP_MAP: Record<string, PositionGroup> = {
  C: 'C',
  '1B': 'IF',
  '2B': 'IF',
  '3B': 'IF',
  SS: 'IF',
  LF: 'OF',
  CF: 'OF',
  RF: 'OF',
  DH: 'DH',
  SP: 'SP',
  RP: 'RP',
  CL: 'RP',
};

// ─── Reason codes ────────────────────────────────────────────────────────────

/**
 * Reason codes explain WHY a particular archetype was assigned.
 * Useful for debugging and future narrative generation.
 */
export const REASON_CODES = {
  veteran_leader: 'age_30_plus_high_ethic_tough',
  clubhouse_cancer: 'low_ethic_low_tough',
  quiet_professional: 'solid_ethic_solid_tough',
  hot_head: 'low_mental_toughness',
  young_star: 'young_high_overall_decent_ethic',
  neutral: 'no_strong_archetype_signal',
} as const satisfies Record<Archetype, string>;

export type ReasonCode = (typeof REASON_CODES)[Archetype];
