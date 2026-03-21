import type { RandomGenerator } from 'pure-rand';
import type { Player, Position } from '../../types/player';
import type { Team } from '../../types/team';
import type { DraftProspect } from './draftPool';
import { nextInt } from '../math/prng';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DraftPick {
  round: number;
  pick?: number;         // Overall pick (worker/event-log alias)
  pickNumber: number;    // Overall pick (1-indexed)
  teamId: number;
  teamAbbr: string;
  playerId: number;
  playerName: string;
  position: Position;
  scoutedOvr: number;
  scoutedPot?: number;
  type?: string;
}

export interface DraftBoardState {
  mode: string;
  available: DraftProspect[];
  picks: DraftPick[];
  draftOrder: number[];       // Team IDs for round 1
  currentRound: number;       // 1-indexed
  currentPickInRound: number; // 0-indexed
  totalRounds: number;
  userTeamId: number;
  isUserTurn: boolean;
  isComplete: boolean;
  pickingTeamId: number;
  pickingTeamAbbr: string;
  overallPick: number;
}

// ─── Ideal Roster Composition ────────────────────────────────────────────────

const IDEAL_ROSTER: Record<string, number> = {
  C: 2, '1B': 2, '2B': 2, SS: 2, '3B': 2,
  LF: 3, CF: 3, RF: 3, DH: 1,
  SP: 5, RP: 7, CL: 1,
};

// ─── Draft Order ─────────────────────────────────────────────────────────────

/**
 * Generate draft order with seeded Fisher-Yates shuffle.
 */
export function generateDraftOrder(
  teams: Team[],
  gen: RandomGenerator,
): [number[], RandomGenerator] {
  const ids = teams.map(t => t.teamId);
  for (let i = ids.length - 1; i > 0; i--) {
    let j: number;
    [j, gen] = nextInt(gen, 0, i);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return [ids, gen];
}

/**
 * Snake draft: odd rounds go left→right, even rounds reverse.
 */
export function getPickingTeam(
  order: number[],
  round: number,
  pickInRound: number,
): number {
  const isReversed = round % 2 === 0;
  const idx = isReversed ? (order.length - 1 - pickInRound) : pickInRound;
  return order[idx];
}

export function getOverallPick(round: number, pickInRound: number, teamCount: number): number {
  return (round - 1) * teamCount + pickInRound + 1;
}

// ─── AI Pick Selection ───────────────────────────────────────────────────────

/**
 * AI selects the best available player based on needs and round.
 */
export function aiSelectPlayer(
  available: DraftProspect[],
  teamPicks: DraftPick[],
  round: number,
): number {
  if (available.length === 0) return -1;

  // Track what this team has already drafted
  const drafted: Record<string, number> = {};
  for (const pick of teamPicks) {
    drafted[pick.position] = (drafted[pick.position] ?? 0) + 1;
  }

  // Need multiplier by position
  const getNeedMult = (pos: string): number => {
    const have = drafted[pos] ?? 0;
    const ideal = IDEAL_ROSTER[pos] ?? 1;
    if (have >= ideal) return 0.2;
    if (have === 0 && ideal >= 2) return 1.6;
    if (have === 0) return 1.4;
    return 1.0;
  };

  // BPA weight is higher in early rounds
  const bpaWeight = round <= 3 ? 0.85 : round <= 10 ? 0.6 : 0.35;
  const needWeight = 1 - bpaWeight;

  let bestIdx = 0;
  let bestScore = -Infinity;
  const limit = Math.min(available.length, 80);

  for (let i = 0; i < limit; i++) {
    const p = available[i];
    const baseScore = (1 / (p.rank + 3)) * 100;
    // Factor in potential: dynasty drafts should value ceiling, not just current floor.
    // potentialBonus ranges from 0 (ovr == pot) to ~0.5 (large gap).
    const potGap = (p.scoutedPot ?? p.scoutedOvr) - p.scoutedOvr;
    const potentialBonus = Math.max(0, potGap / 80) * 0.5; // up to +50% for high-ceiling prospects
    const needMult = getNeedMult(p.position);
    const score = baseScore * (1 + potentialBonus) * (bpaWeight + needWeight * needMult);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return available[bestIdx].playerId;
}

// ─── Post-Draft Roster Filling ───────────────────────────────────────────────

/**
 * Distribute undrafted pool players to teams that still need active roster spots.
 * Remaining undrafted players become free agents.
 */
export function fillRemainingRosters(players: Player[], teams: Team[]): void {
  const undrafted = players
    .filter(p => p.rosterData.rosterStatus === 'DRAFT_ELIGIBLE')
    .sort((a, b) => b.overall - a.overall);

  for (const team of teams) {
    const teamActive = players.filter(
      p => p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    const posCounts: Record<string, number> = {};
    for (const p of teamActive) {
      posCounts[p.position] = (posCounts[p.position] ?? 0) + 1;
    }

    for (const [pos, ideal] of Object.entries(IDEAL_ROSTER)) {
      const have = posCounts[pos] ?? 0;
      for (let i = have; i < ideal; i++) {
        const idx = undrafted.findIndex(p => p.position === pos);
        if (idx >= 0) {
          const p = undrafted[idx];
          p.teamId = team.teamId;
          p.rosterData.rosterStatus = 'MLB_ACTIVE';
          p.rosterData.isOn40Man = true;
          undrafted.splice(idx, 1);
          posCounts[pos] = (posCounts[pos] ?? 0) + 1;
        }
      }
    }
  }

  for (const p of undrafted) {
    p.rosterData.rosterStatus = 'FREE_AGENT';
    p.teamId = -1;
  }
}
