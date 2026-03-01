import type { RandomGenerator } from 'pure-rand';
import type { Player, Position } from '../../types/player';
import { toScoutingScale } from '../player/attributes';
import { clampedGaussian, nextInt } from '../math/prng';
import { generatePlayer } from '../player/generation';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DraftProspect {
  playerId: number;
  name: string;
  position: Position;
  age: number;
  scoutedOvr: number;    // 20-80 scouting scale (with fog)
  scoutedPot: number;    // 20-80 scouting scale (with fog)
  isPitcher: boolean;
  bats: string;
  throws: string;
  rank: number;          // Consensus rank (1 = best)
}

// ─── Pool Creation ───────────────────────────────────────────────────────────

/**
 * Extract MLB_ACTIVE players from the league into a draft pool.
 * Unassigns them: teamId → -1, rosterStatus → DRAFT_ELIGIBLE.
 */
export function createDraftPool(players: Player[]): Player[] {
  const pool: Player[] = [];
  for (const p of players) {
    if (p.rosterData.rosterStatus === 'MLB_ACTIVE') {
      p.teamId = -1;
      p.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
      pool.push(p);
    }
  }
  pool.sort((a, b) => b.overall - a.overall);
  return pool;
}

/**
 * Create scouted prospect views with fog-of-war noise.
 * scoutingAccuracy from StaffBonuses: 0.5 (bad) to 1.5 (great), default 1.0.
 */
export function scoutDraftPool(
  pool: Player[],
  scoutingAccuracy: number,
  gen: RandomGenerator,
): [DraftProspect[], RandomGenerator] {
  const noiseSigma = Math.max(10, 45 - scoutingAccuracy * 20);
  const prospects: DraftProspect[] = [];

  for (const p of pool) {
    let noisyOvr: number;
    [noisyOvr, gen] = clampedGaussian(gen, p.overall, noiseSigma, 50, 550);
    let noisyPot: number;
    [noisyPot, gen] = clampedGaussian(gen, p.potential, noiseSigma * 1.2, 50, 550);

    prospects.push({
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      age: p.age,
      scoutedOvr: toScoutingScale(noisyOvr),
      scoutedPot: toScoutingScale(noisyPot),
      isPitcher: p.isPitcher,
      bats: p.bats,
      throws: p.throws,
      rank: 0,
    });
  }

  // Rank by scouted overall (what the user/AI sees)
  prospects.sort((a, b) => b.scoutedOvr - a.scoutedOvr || b.scoutedPot - a.scoutedPot);
  for (let i = 0; i < prospects.length; i++) {
    prospects[i].rank = i + 1;
  }

  return [prospects, gen];
}

/**
 * Get the number of draft rounds for a given start mode.
 */
export function getDraftRounds(mode: string): number {
  switch (mode) {
    case 'snake10': return 10;
    case 'snake25': return 25;
    case 'snake26': return 26;
    case 'annual': return 5;
    default: return 0;
  }
}

// ─── Annual Amateur Draft Class ──────────────────────────────────────────────

const DRAFT_POSITIONS: Position[] = [
  'SS', 'SS', 'CF', 'CF', 'C', 'C',
  '2B', '3B', '1B', 'LF', 'RF', 'DH',
  'SP', 'SP', 'SP', 'SP', 'SP', 'SP',
  'RP', 'RP', 'RP',
];

/**
 * Generate an annual amateur draft class of ~150 prospects.
 * Mix of college players (higher floor) and HS players (higher ceiling).
 * Players start at DRAFT_ELIGIBLE with no team assignment.
 */
export function generateAnnualDraftClass(
  gen: RandomGenerator,
  season: number,
  count = 150,
): [Player[], RandomGenerator] {
  const prospects: Player[] = [];

  for (let i = 0; i < count; i++) {
    // Alternate between college and HS prospects
    let posIdx: number;
    [posIdx, gen] = nextInt(gen, 0, DRAFT_POSITIONS.length - 1);
    const pos = DRAFT_POSITIONS[posIdx];

    // College (60%) vs HS (40%)
    let isCollege: number;
    [isCollege, gen] = nextInt(gen, 0, 9);
    const level = isCollege < 6 ? 'AMINUS' as const : 'ROOKIE' as const;

    let player: Player;
    [player, gen] = generatePlayer(gen, -1, pos, level, season, 0);

    // Override age for draft eligibility
    if (isCollege < 6) {
      // College: 21-22
      let age: number;
      [age, gen] = nextInt(gen, 21, 22);
      player.age = age;
    } else {
      // High school: 18-19
      let age: number;
      [age, gen] = nextInt(gen, 18, 19);
      player.age = age;
      // HS players get higher potential but lower current overall
      player.potential = Math.min(550, player.potential + 30);
      player.overall = Math.max(50, player.overall - 20);
    }

    // Set as draft eligible
    player.teamId = -1;
    player.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
    player.rosterData.isOn40Man = false;
    player.rosterData.contractYearsRemaining = 0;
    player.rosterData.salary = 0;
    player.rosterData.signedSeason = season;
    player.rosterData.signedAge = player.age;

    prospects.push(player);
  }

  // Sort by quality (overall + potential weighted)
  prospects.sort((a, b) => {
    const scoreA = a.overall * 0.4 + a.potential * 0.6;
    const scoreB = b.overall * 0.4 + b.potential * 0.6;
    return scoreB - scoreA;
  });

  return [prospects, gen];
}
