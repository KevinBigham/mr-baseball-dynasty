/**
 * personalityModel.ts — Deterministic Personality / Archetype Derivation
 *
 * Pure module: no Math.random(), no Date.now(), no ambient state.
 * Same input → same output, always.
 *
 * Derives a PersonalityProfile from existing hidden player attributes
 * (workEthic, mentalToughness) plus age, overall, and position.
 *
 * Archetype priority (first match wins):
 *   1. Clubhouse Disruptor — low ethic AND low toughness
 *   2. Veteran Leader     — age 30+, high ethic, high toughness
 *   3. Hot Head           — very low mental toughness
 *   4. Young Star         — young, high overall, decent ethic
 *   5. Quiet Professional — solid ethic AND solid toughness
 *   6. Neutral            — fallback
 */

import {
  CHEMISTRY_VERSION,
  THRESHOLDS,
  POSITION_GROUP_MAP,
  REASON_CODES,
  type Archetype,
  type PositionGroup,
} from './chemistryContracts';
import type { PersonalityInput, PersonalityProfile } from '../types/chemistry';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clamp a number into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Normalize a trait value to the canonical 0–100 range. */
export function normalizeTrait(raw: number): number {
  return clamp(Math.round(raw), 0, 100);
}

/** Map a position string to a PositionGroup, defaulting to 'DH'. */
export function toPositionGroup(position: string): PositionGroup {
  return POSITION_GROUP_MAP[position] ?? 'DH';
}

// ─── Core derivation ─────────────────────────────────────────────────────────

/**
 * Derive a personality archetype from existing player data.
 *
 * Priority order matters: Clubhouse Disruptor is checked first because its
 * negative effect is the strongest signal. Veteran Leader comes next because
 * it requires the most specific combination (age + ethic + toughness).
 */
export function derivePersonality(input: PersonalityInput): PersonalityProfile {
  const we = normalizeTrait(input.workEthic);
  const mt = normalizeTrait(input.mentalToughness);
  const age = input.age;
  const ovr = input.overall;
  const posGroup = toPositionGroup(input.position);

  const t = THRESHOLDS;

  let archetype: Archetype;

  // 1. Clubhouse Disruptor — toxic combo
  if (we <= t.clubhouseDisruptor.maxWorkEthic && mt <= t.clubhouseDisruptor.maxMentalToughness) {
    archetype = 'clubhouse_disruptor';
  }
  // 2. Veteran Leader — experienced, disciplined, tough
  else if (
    age >= t.veteranLeader.minAge &&
    we >= t.veteranLeader.minWorkEthic &&
    mt >= t.veteranLeader.minMentalToughness
  ) {
    archetype = 'veteran_leader';
  }
  // 3. Hot Head — low mental toughness (but not bad enough for disruptor)
  else if (mt <= t.hotHead.maxMentalToughness) {
    archetype = 'hot_head';
  }
  // 4. Young Star — young + elite + decent work ethic
  else if (
    age <= t.youngStar.maxAge &&
    ovr >= t.youngStar.minOverall &&
    we >= t.youngStar.minWorkEthic
  ) {
    archetype = 'young_star';
  }
  // 5. Quiet Professional — solid across the board
  else if (
    we >= t.quietProfessional.minWorkEthic &&
    mt >= t.quietProfessional.minMentalToughness
  ) {
    archetype = 'quiet_professional';
  }
  // 6. Neutral fallback
  else {
    archetype = 'neutral';
  }

  return {
    archetype,
    reasonCode: REASON_CODES[archetype],
    positionGroup: posGroup,
    version: CHEMISTRY_VERSION,
  };
}

// ─── Batch helper ────────────────────────────────────────────────────────────

/**
 * Derive personality profiles for an array of inputs.
 * Convenience wrapper; each derivation is independent.
 */
export function derivePersonalities(inputs: PersonalityInput[]): PersonalityProfile[] {
  return inputs.map(derivePersonality);
}
