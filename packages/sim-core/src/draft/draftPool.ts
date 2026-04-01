/**
 * @module draftPool
 * Draft class generation: creates ~300 amateur draft prospects per season.
 * Uses GameRNG for all randomness — Math.random() is NEVER used.
 */

import type { GameRNG } from '../math/prng.js';
import {
  generatePlayer,
  HITTER_POSITIONS,
  PITCHER_POSITIONS,
  ALL_POSITIONS,
} from '../player/generation.js';
import type { GeneratedPlayer, Position } from '../player/generation.js';
import { toDisplayRating, clampRating } from '../player/attributes.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total number of prospects generated per draft class. */
const DRAFT_CLASS_SIZE = 300;

/** Number of draft rounds. */
export const DRAFT_ROUNDS = 20;

/** Number of teams in the league. */
export const NUM_TEAMS = 32;

/** Talent tier boundaries (pick ranges and internal overall ranges). */
const TALENT_TIERS = [
  { maxPick: 10,  overallMin: 250, overallMax: 400 },
  { maxPick: 30,  overallMin: 200, overallMax: 300 },
  { maxPick: 160, overallMin: 150, overallMax: 250 }, // rounds 2-5
  { maxPick: 320, overallMin: 100, overallMax: 200 }, // rounds 6-10
  { maxPick: 640, overallMin: 60,  overallMax: 150 }, // rounds 11-20
] as const;

/** Scouting grade noise standard deviations by tier (top picks = more variance). */
const SCOUTING_NOISE_BY_TIER = [15, 12, 10, 8, 6] as const;

/** Background type weights: college is most common, then HS, then international. */
const BACKGROUND_WEIGHTS = {
  college: 55,
  high_school: 30,
  international: 15,
} as const;

type ProspectBackground = 'college' | 'high_school' | 'international';
const BACKGROUNDS: ProspectBackground[] = ['college', 'high_school', 'international'];
const BG_WEIGHTS: number[] = [
  BACKGROUND_WEIGHTS.college,
  BACKGROUND_WEIGHTS.high_school,
  BACKGROUND_WEIGHTS.international,
];

/** Age ranges by background. */
const AGE_RANGES: Record<ProspectBackground, [number, number]> = {
  college: [20, 22],
  high_school: [17, 18],
  international: [17, 20],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraftProspect {
  player: GeneratedPlayer;
  scoutingGrade: number;     // 20-80 perceived grade (may differ from true rating)
  signability: number;       // 0-1, higher = easier to sign
  collegeOrHS: ProspectBackground;
  draftRound: number;        // Projected round (1-20)
  positionRank: number;      // Rank among same-position prospects
}

export interface DraftClass {
  season: number;
  prospects: DraftProspect[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Determine which talent tier a prospect index falls into. */
function getTierIndex(prospectIndex: number): number {
  for (let i = 0; i < TALENT_TIERS.length; i++) {
    if (prospectIndex < TALENT_TIERS[i]!.maxPick) return i;
  }
  return TALENT_TIERS.length - 1;
}

/** Convert internal overall (0-550) to scouting grade (20-80) with noise. */
function scoutingGradeFromOverall(
  rng: GameRNG,
  trueOverall: number,
  noiseStddev: number,
): number {
  const baseGrade = toDisplayRating(trueOverall);
  const noise = rng.nextGaussian(0, noiseStddev);
  return Math.max(20, Math.min(80, Math.round(baseGrade + noise)));
}

/** Determine projected draft round from a prospect's rank in the class. */
function projectedRound(prospectIndex: number): number {
  const picksPerRound = NUM_TEAMS;
  return Math.min(DRAFT_ROUNDS, Math.floor(prospectIndex / picksPerRound) + 1);
}

/** Pick a random position with realistic draft distribution. */
function pickDraftPosition(rng: GameRNG): Position {
  // Draft classes skew toward pitchers (~55%) and athletic positions
  const positions = [...ALL_POSITIONS] as Position[];
  const weights = positions.map((pos) => {
    if (pos === 'SP') return 25;
    if (pos === 'RP' || pos === 'CL') return 10;
    if (pos === 'SS' || pos === 'CF') return 10;
    if (pos === 'C') return 6;
    if (pos === 'DH') return 1;
    return 6; // remaining hitter positions
  });
  return rng.weightedPick(positions, weights);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full draft class of ~300 amateur prospects for a given season.
 * Prospects are created with realistic talent distribution and scouting variance.
 */
export function generateDraftClass(rng: GameRNG, season: number): DraftClass {
  const prospects: DraftProspect[] = [];

  for (let i = 0; i < DRAFT_CLASS_SIZE; i++) {
    const tierIdx = getTierIndex(i);
    const tier = TALENT_TIERS[tierIdx]!;
    const noiseStddev = SCOUTING_NOISE_BY_TIER[tierIdx]!;

    // Pick background
    const background = rng.weightedPick(BACKGROUNDS, BG_WEIGHTS);
    const [ageMin, ageMax] = AGE_RANGES[background];

    // Pick position
    const position = pickDraftPosition(rng);

    // Generate the player at ROOKIE/INTERNATIONAL level as a Prospect
    const rosterLevel = background === 'international' ? 'INTERNATIONAL' : 'ROOKIE';
    const player = generatePlayer(rng, position, 'draft_pool', rosterLevel);

    // Override age to match background
    (player as { age: number }).age = rng.nextInt(ageMin, ageMax);
    (player as { developmentPhase: string }).developmentPhase = 'Prospect';

    // Scale overall to match talent tier expectations
    const targetOverall = rng.nextInt(tier.overallMin, tier.overallMax);
    const currentOverall = player.overallRating;
    if (currentOverall > 0) {
      const scaleFactor = targetOverall / currentOverall;
      // Scale the relevant attributes to hit the target overall
      scalePlayerAttributes(player, scaleFactor);
      (player as { overallRating: number }).overallRating = recomputeOverall(player);
    }

    const scoutingGrade = scoutingGradeFromOverall(rng, player.overallRating, noiseStddev);
    const signability = computeSignability(rng, background, tierIdx);

    prospects.push({
      player,
      scoutingGrade,
      signability,
      collegeOrHS: background,
      draftRound: projectedRound(i),
      positionRank: 0, // filled by rankProspects
    });
  }

  // Assign position ranks
  const ranked = rankProspects(prospects);

  return { season, prospects: ranked };
}

/**
 * Rank prospects by scouting grade (descending) and assign positionRank
 * within each position group.
 */
export function rankProspects(prospects: DraftProspect[]): DraftProspect[] {
  // Sort by scouting grade descending
  const sorted = [...prospects].sort((a, b) => b.scoutingGrade - a.scoutingGrade);

  // Assign position ranks
  const positionCounters = new Map<string, number>();

  for (const prospect of sorted) {
    const pos = prospect.player.position;
    const rank = (positionCounters.get(pos) ?? 0) + 1;
    positionCounters.set(pos, rank);
    prospect.positionRank = rank;
  }

  // Re-assign projected round based on overall ranking
  for (let i = 0; i < sorted.length; i++) {
    sorted[i]!.draftRound = projectedRound(i);
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// Attribute scaling helpers
// ---------------------------------------------------------------------------

function scalePlayerAttributes(player: GeneratedPlayer, factor: number): void {
  const ha = player.hitterAttributes;
  ha.contact = clampRating(ha.contact * factor);
  ha.power = clampRating(ha.power * factor);
  ha.eye = clampRating(ha.eye * factor);
  ha.speed = clampRating(ha.speed * factor);
  ha.defense = clampRating(ha.defense * factor);
  ha.durability = clampRating(ha.durability * factor);

  if (player.pitcherAttributes) {
    const pa = player.pitcherAttributes;
    pa.stuff = clampRating(pa.stuff * factor);
    pa.control = clampRating(pa.control * factor);
    pa.stamina = clampRating(pa.stamina * factor);
    pa.velocity = clampRating(pa.velocity * factor);
    pa.movement = clampRating(pa.movement * factor);
  }
}

function recomputeOverall(player: GeneratedPlayer): number {
  const isPitcher = player.pitcherAttributes !== null;
  if (isPitcher) {
    const pa = player.pitcherAttributes!;
    return Math.round(
      pa.stuff * 0.30 + pa.control * 0.25 + pa.stamina * 0.15 +
      pa.velocity * 0.15 + pa.movement * 0.15,
    );
  }
  const ha = player.hitterAttributes;
  return Math.round(
    ha.contact * 0.25 + ha.power * 0.20 + ha.eye * 0.15 +
    ha.speed * 0.15 + ha.defense * 0.15 + ha.durability * 0.10,
  );
}

function computeSignability(
  rng: GameRNG,
  background: ProspectBackground,
  tierIdx: number,
): number {
  // College players are easier to sign; top picks harder (want more money)
  const baseSignability =
    background === 'college' ? 0.85 :
    background === 'high_school' ? 0.60 :
    0.50; // international

  // Higher tier (lower index) = harder to sign (they have leverage)
  const tierPenalty = (4 - tierIdx) * 0.05; // top tier: -0.20, bottom: 0
  const noise = rng.nextGaussian(0, 0.08);

  return Math.max(0, Math.min(1, baseSignability - tierPenalty + noise));
}
