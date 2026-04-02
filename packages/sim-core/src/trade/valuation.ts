/**
 * @module valuation
 * Player trade value assessment with transparent, multi-dimensional scoring.
 * Trade value is NEVER a single opaque number — it decomposes into five
 * clearly defined dimensions so players (and AI GMs) can reason about deals.
 *
 * Internal rating scale: 0-550.  Trade value dimensions: 0-100.
 */

import type { GeneratedPlayer, Position } from '../player/generation.js';
import { PITCHER_POSITIONS } from '../player/generation.js';
import { hitterOverall, pitcherOverall, RATING_MAX } from '../player/attributes.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Dimension weights for the composite overall trade value. */
const WEIGHT_CURRENT_ABILITY = 0.35;
const WEIGHT_FUTURE_VALUE = 0.25;
const WEIGHT_CONTRACT_VALUE = 0.20;
const WEIGHT_POSITIONAL_SCARCITY = 0.10;
const WEIGHT_DURABILITY = 0.10;

/** Positional scarcity premiums (0-100). Rarer defensive positions score higher. */
const POSITION_SCARCITY: Record<Position, number> = {
  C: 80,
  SS: 75,
  CF: 70,
  SP: 65,
  CL: 60,
  '3B': 55,
  '2B': 50,
  RF: 45,
  LF: 40,
  '1B': 30,
  RP: 25,
  DH: 20,
};

/** Age thresholds for dev-phase future-value calculation. */
const AGE_PROSPECT_MAX = 22;
const AGE_ASCENT_MAX = 26;
const AGE_PRIME_MAX = 31;
const AGE_DECLINE_MAX = 37;

/** Estimated production-per-dollar thresholds for contract value. */
const PRE_ARB_SALARY = 0.7;          // league-minimum salary
const MAX_REASONABLE_SALARY = 40;     // supermax territory

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerTradeValue {
  playerId: string;
  overall: number;
  dimensions: {
    currentAbility: number;
    futureValue: number;
    contractValue: number;
    positionalScarcity: number;
    durability: number;
  };
}

export interface PackageComparison {
  /** -100 to +100.  Positive = deal favors the offering team. */
  fairness: number;
  offerValue: number;
  requestValue: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ratingPct(rating: number): number {
  return rating / RATING_MAX;
}

function isPitcher(position: Position): boolean {
  return (PITCHER_POSITIONS as readonly string[]).includes(position);
}

function getOverallRating(player: GeneratedPlayer): number {
  if (isPitcher(player.position) && player.pitcherAttributes) {
    return pitcherOverall(player.pitcherAttributes);
  }
  return hitterOverall(player.hitterAttributes);
}

/** Durability source attribute — hitters use hitterAttributes.durability,
 *  pitchers use pitcherAttributes.stamina as best proxy. */
function getDurabilityRaw(player: GeneratedPlayer): number {
  if (isPitcher(player.position) && player.pitcherAttributes) {
    return player.pitcherAttributes.stamina;
  }
  return player.hitterAttributes.durability;
}

// ---------------------------------------------------------------------------
// Dimension calculators
// ---------------------------------------------------------------------------

function calcCurrentAbility(overallRating: number): number {
  return clamp(ratingPct(overallRating) * 100, 0, 100);
}

function calcFutureValue(age: number, overallRating: number): number {
  const pct = ratingPct(overallRating);

  if (age <= AGE_PROSPECT_MAX) return clamp(80 + pct * 20, 0, 100);
  if (age <= AGE_ASCENT_MAX)   return clamp(60 + pct * 30, 0, 100);
  if (age <= AGE_PRIME_MAX)    return clamp(40 + pct * 30, 0, 100);
  if (age <= AGE_DECLINE_MAX)  return clamp(10 + pct * 20, 0, 100);
  return 0; // retirement-age players have no future value
}

function calcContractValue(overallRating: number, annualSalary: number): number {
  // Expected production on a 0-100 scale mirrors current ability.
  const expectedProduction = ratingPct(overallRating) * 100;

  // Salary cost normalized: 0 salary = 0 cost, MAX_REASONABLE_SALARY = 100 cost.
  const salaryCost = clamp((annualSalary / MAX_REASONABLE_SALARY) * 100, 0, 100);

  // Pre-arb players on minimum deals have massive surplus.
  const surplus = expectedProduction - salaryCost;

  // Map surplus (theoretical range ~ -100 to +100) into 0-100.
  return clamp((surplus + 100) / 2, 0, 100);
}

function calcPositionalScarcity(position: Position): number {
  return POSITION_SCARCITY[position] ?? 30;
}

function calcDurability(player: GeneratedPlayer): number {
  return clamp(ratingPct(getDurabilityRaw(player)) * 100, 0, 100);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a player's multi-dimensional trade value.
 *
 * Each dimension is scored 0-100. The composite `overall` is a weighted
 * sum of all five dimensions, also on a 0-100 scale.
 */
export function evaluatePlayerTradeValue(player: GeneratedPlayer): PlayerTradeValue {
  const overallRating = getOverallRating(player);

  const currentAbility = calcCurrentAbility(overallRating);
  const futureValue = calcFutureValue(player.age, overallRating);
  const contractValue = calcContractValue(overallRating, player.contract.annualSalary);
  const positionalScarcity = calcPositionalScarcity(player.position);
  const durability = calcDurability(player);

  const overall = clamp(
    Math.round(
      currentAbility * WEIGHT_CURRENT_ABILITY +
      futureValue * WEIGHT_FUTURE_VALUE +
      contractValue * WEIGHT_CONTRACT_VALUE +
      positionalScarcity * WEIGHT_POSITIONAL_SCARCITY +
      durability * WEIGHT_DURABILITY,
    ),
    0,
    100,
  );

  return {
    playerId: player.id,
    overall,
    dimensions: {
      currentAbility: Math.round(currentAbility),
      futureValue: Math.round(futureValue),
      contractValue: Math.round(contractValue),
      positionalScarcity,
      durability: Math.round(durability),
    },
  };
}

/**
 * Compare two trade packages and return a fairness score.
 *
 * `fairness` ranges from -100 to +100:
 *   positive  = deal favors the **offering** team (they get more value)
 *   zero      = perfectly fair
 *   negative  = deal favors the **receiving** team
 */
export function comparePackages(
  offered: GeneratedPlayer[],
  requested: GeneratedPlayer[],
): PackageComparison {
  const offerValue = offered.reduce(
    (sum, p) => sum + evaluatePlayerTradeValue(p).overall,
    0,
  );
  const requestValue = requested.reduce(
    (sum, p) => sum + evaluatePlayerTradeValue(p).overall,
    0,
  );

  const maxValue = Math.max(offerValue, requestValue, 1); // avoid division by zero
  const rawDiff = requestValue - offerValue;
  const fairness = clamp(Math.round((rawDiff / maxValue) * 100), -100, 100);

  return { fairness, offerValue, requestValue };
}
