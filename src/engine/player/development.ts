import type { RandomGenerator } from 'pure-rand';
import type { Player, HitterAttributes, PitcherAttributes } from '../../types/player';
import {
  HITTER_AGING, PITCHER_AGING,
  computeHitterOverall, computePitcherOverall,
} from './attributes';
import type { AgingCurve } from './attributes';
import { gaussian } from '../math/prng';

// ─── Aging delta for a single attribute ──────────────────────────────────────
// Returns the deterministic component: positive = improvement, negative = decline.

function agingDelta(curve: AgingCurve, age: number): number {
  const peakStart = curve.peakAge;
  const peakEnd   = curve.peakAge2 ?? curve.peakAge;

  if (age < peakStart) {
    // Rising phase
    return curve.riseRate;
  } else if (age <= peakEnd) {
    // Plateau — tiny natural erosion even at peak
    return -0.5;
  } else {
    // Declining phase — accelerate after earlyDeclineAge
    if (curve.earlyDeclineAge !== undefined && age >= curve.earlyDeclineAge) {
      return -(curve.lateDeclineRate ?? curve.declineRate);
    }
    return -curve.declineRate;
  }
}

// ─── Develop a single numeric attribute (0–550 scale) ────────────────────────

function developNumericAttr(
  gen: RandomGenerator,
  current: number,
  delta: number,
  noiseSigma: number,
  workEthicFactor: number,  // scales growth only (not decline)
  min = 50,
  max = 550,
): [number, RandomGenerator] {
  // WorkEthic only helps while attribute is improving
  const adjustedDelta = delta > 0 ? delta * workEthicFactor : delta;
  let noise: number;
  [noise, gen] = gaussian(gen, 0, noiseSigma);
  const newVal = Math.max(min, Math.min(max, Math.round(current + adjustedDelta + noise)));
  return [newVal, gen];
}

// ─── Develop hitter attributes ────────────────────────────────────────────────

function developHitterAttrs(
  gen: RandomGenerator,
  attrs: HitterAttributes,
  age: number,
  sigma: number,
  workEthicFactor: number,
): [HitterAttributes, RandomGenerator] {
  // Per-attribute noise is a fraction of player-level sigma
  const attrSigma = sigma * 0.55;
  const newAttrs  = { ...attrs };

  // Standard numeric attributes on 0–550 scale
  const numericKeys: Array<keyof HitterAttributes> = [
    'contact', 'power', 'eye', 'speed', 'baserunningIQ',
    'fielding', 'armStrength', 'durability', 'offensiveIQ', 'defensiveIQ',
  ];

  for (const key of numericKeys) {
    const curve = HITTER_AGING[key];
    if (!curve || (curve.riseRate === 0 && curve.declineRate === 0)) continue;

    const current = attrs[key] as number;
    const delta   = agingDelta(curve, age);

    let newVal: number;
    [newVal, gen] = developNumericAttr(gen, current, delta, attrSigma, workEthicFactor);
    (newAttrs[key] as number) = newVal;
  }

  // mentalToughness (0–100): grows toward 100 asymptotically with experience
  {
    const gap    = 100 - attrs.mentalToughness;
    const growth = gap * 0.08; // 8% of remaining gap per season
    let noise: number;
    [noise, gen] = gaussian(gen, 0, 2);
    newAttrs.mentalToughness = Math.max(0, Math.min(100,
      Math.round(attrs.mentalToughness + growth + noise),
    ));
  }

  // platoonSensitivity and workEthic are stable personality traits — no change
  // (already copied by spread)

  return [newAttrs, gen];
}

// ─── Develop pitcher attributes ───────────────────────────────────────────────

function developPitcherAttrs(
  gen: RandomGenerator,
  attrs: PitcherAttributes,
  age: number,
  sigma: number,
  workEthicFactor: number,
): [PitcherAttributes, RandomGenerator] {
  const attrSigma = sigma * 0.55;
  const newAttrs  = { ...attrs, pitchTypeMix: { ...attrs.pitchTypeMix } };

  const numericKeys: Array<keyof PitcherAttributes> = [
    'stuff', 'movement', 'command', 'stamina',
    'holdRunners', 'durability', 'recoveryRate', 'pitchingIQ',
  ];

  for (const key of numericKeys) {
    const curve = PITCHER_AGING[key];
    if (!curve || (curve.riseRate === 0 && curve.declineRate === 0)) continue;

    const current = attrs[key] as number;
    const delta   = agingDelta(curve, age);

    let newVal: number;
    [newVal, gen] = developNumericAttr(gen, current, delta, attrSigma, workEthicFactor);
    (newAttrs[key] as number) = newVal;
  }

  // pitchArsenalCount (2–5): small chance to add a pitch during ascent/prime
  {
    const curve = PITCHER_AGING.pitchArsenalCount;
    if (age <= (curve.peakAge ?? 28) && attrs.pitchArsenalCount < 5) {
      let noise: number;
      [noise, gen] = gaussian(gen, 0, 0.08);
      // Expected growth ~0.05/season (add a pitch every ~20 seasons at base, faster with ethics)
      const delta = 0.05 * workEthicFactor + noise;
      // Only round up when the fractional accumulation tips over
      // (We track continuous count, round for display)
      const newCount = Math.max(2, Math.min(5, attrs.pitchArsenalCount + Math.max(0, delta)));
      newAttrs.pitchArsenalCount = Math.round(newCount);
    }
  }

  // mentalToughness: same asymptotic growth
  {
    const gap    = 100 - attrs.mentalToughness;
    const growth = gap * 0.08;
    let noise: number;
    [noise, gen] = gaussian(gen, 0, 2);
    newAttrs.mentalToughness = Math.max(0, Math.min(100,
      Math.round(attrs.mentalToughness + growth + noise),
    ));
  }

  // platoonTendency, workEthic, gbFbTendency, pitchTypeMix: stable
  return [newAttrs, gen];
}

// ─── Phase from age ───────────────────────────────────────────────────────────

function computePhaseFromAge(age: number): 'prospect' | 'ascent' | 'prime' | 'decline' {
  if (age <= 21) return 'prospect';
  if (age <= 26) return 'ascent';
  if (age <= 32) return 'prime';
  return 'decline';
}

// ─── Retirement probability ───────────────────────────────────────────────────
// Based on age + how far the player has fallen from their peak overall.

function retirementProbability(age: number, overallDrop: number): number {
  // Base by age
  let base: number;
  if      (age < 35)  base = 0.01;
  else if (age === 35) base = 0.05;
  else if (age === 36) base = 0.10;
  else if (age === 37) base = 0.20;
  else if (age === 38) base = 0.35;
  else if (age === 39) base = 0.50;
  else                 base = 0.65; // 40+

  // Players who have fallen far from peak become more likely to hang it up
  const dropBonus = Math.max(0, (overallDrop - 30) / 100) * 0.20;
  return Math.min(0.95, base + dropBonus);
}

// ─── Development event classification ────────────────────────────────────────

export interface DevelopmentEvent {
  playerId: number;
  playerName: string;
  type: 'breakout' | 'bust' | 'retirement';
  /** Positive = gained; negative = lost */
  overallDelta?: number;
}

// ─── Develop one player by one offseason ─────────────────────────────────────
//
// Returns [newPlayer, nextGen, event | null].
// Immutable: input player is never mutated.

export function developPlayer(
  player: Player,
  gen: RandomGenerator,
): [Player, RandomGenerator, DevelopmentEvent | null] {
  // Already retired — no-op
  if (
    player.development.phase === 'retirement' ||
    player.rosterData.rosterStatus === 'RETIRED'
  ) {
    return [player, gen, null];
  }

  const newAge = player.age + 1;
  const sigma  = player.development.sigma;

  const workEthic = player.isPitcher
    ? (player.pitcherAttributes?.workEthic ?? 50)
    : (player.hitterAttributes?.workEthic  ?? 50);
  // workEthicFactor: 0.6 (low=20) → 1.4 (high=80), centered at 1.0 for 50
  const workEthicFactor = 0.60 + (workEthic / 100) * 0.80;

  // ── Retirement check ──────────────────────────────────────────────────────
  // Consume two RNG draws deterministically (one float, one float)
  let retireRoll: number;
  [retireRoll, gen] = gaussian(gen, 0.5, 0.25);
  retireRoll = Math.max(0, Math.min(1, retireRoll));

  const overallDrop = Math.max(0, player.potential - player.overall);
  const retireProb  = retirementProbability(newAge, overallDrop);

  if (newAge >= 35 && retireRoll < retireProb) {
    const retired: Player = {
      ...player,
      age:         newAge,
      development: { ...player.development, phase: 'retirement' },
      rosterData:  { ...player.rosterData,  rosterStatus: 'RETIRED' },
    };
    return [
      retired,
      gen,
      { playerId: player.playerId, playerName: player.name, type: 'retirement' },
    ];
  }

  // ── Attribute development ─────────────────────────────────────────────────
  let newHitterAttrs  = player.hitterAttributes;
  let newPitcherAttrs = player.pitcherAttributes;

  if (player.hitterAttributes) {
    [newHitterAttrs, gen] = developHitterAttrs(
      gen, player.hitterAttributes, newAge, sigma, workEthicFactor,
    );
  } else if (player.pitcherAttributes) {
    [newPitcherAttrs, gen] = developPitcherAttrs(
      gen, player.pitcherAttributes, newAge, sigma, workEthicFactor,
    );
  }

  // ── Recompute overall ─────────────────────────────────────────────────────
  let newOverall = player.overall;
  if (newHitterAttrs) {
    newOverall = computeHitterOverall(newHitterAttrs, player.position);
  } else if (newPitcherAttrs && (
    player.position === 'SP' || player.position === 'RP' || player.position === 'CL'
  )) {
    newOverall = computePitcherOverall(newPitcherAttrs, player.position);
  }

  // ── Sigma decay: veterans become more predictable ─────────────────────────
  // Sigma decays ~8% per season, floors at 5 pts (randomness never fully disappears)
  const newSigma = Math.max(5, sigma * 0.92);

  // ── Phase update ──────────────────────────────────────────────────────────
  const newPhase = computePhaseFromAge(newAge);

  // ── Classify notable event ────────────────────────────────────────────────
  const overallDelta = newOverall - player.overall;
  let event: DevelopmentEvent | null = null;
  if (overallDelta >= 20) {
    event = { playerId: player.playerId, playerName: player.name, type: 'breakout', overallDelta };
  } else if (overallDelta <= -20) {
    event = { playerId: player.playerId, playerName: player.name, type: 'bust', overallDelta };
  }

  const newPlayer: Player = {
    ...player,
    age:              newAge,
    overall:          newOverall,
    hitterAttributes: newHitterAttrs,
    pitcherAttributes: newPitcherAttrs,
    development: {
      theta: player.development.theta,
      sigma: newSigma,
      phase: newPhase,
    },
  };

  return [newPlayer, gen, event];
}

// ─── Bulk offseason advancement for all players ───────────────────────────────
// Call once per offseason. Mutates the players array in-place for efficiency
// (the caller already owns the mutable state inside the worker).

export function advanceOffseason(
  players: Player[],
  gen: RandomGenerator,
): { players: Player[]; events: DevelopmentEvent[]; gen: RandomGenerator } {
  const events: DevelopmentEvent[] = [];
  const newPlayers: Player[] = [];

  for (const player of players) {
    let event: DevelopmentEvent | null;
    let newPlayer: Player;
    [newPlayer, gen, event] = developPlayer(player, gen);
    newPlayers.push(newPlayer);
    if (event) events.push(event);
  }

  return { players: newPlayers, events, gen };
}
