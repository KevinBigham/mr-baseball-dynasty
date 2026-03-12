/**
 * Offseason pipeline.
 * Handles player aging, attribute development (SDE), retirement,
 * contract progression, free agent class generation, and AI signings.
 */

import type { Player } from '../../types/player';
import type { TeamSeason, Team, CoachingStaff } from '../../types/team';
import type { TransactionLogEntry } from '../../types/roster';
import type { OffseasonRecap } from '../../types/offseason';
import type { RandomGenerator } from '../math/prng';
import { developPlayer } from '../player/development';
import { bonusesFromCoaching } from '../staffEffects';
import { generateFreeAgentClass, processAISignings } from '../freeAgency';
import { generateAnnualDraftClass } from '../draft/draftPool';
import { generateIntlClass, processAIIntlSignings } from '../internationalSigning';
import { ensureMinimumRosters } from '../rosterGuard';

export interface TeamBidModifier {
  bidAggression: number;
  offerMultiplier: number;
  payrollTarget: number;
  maxPayrollCap: number;
  luxuryTaxComfort: number;
}

export interface OffseasonInput {
  players: Map<number, Player>;
  teamSeasons: Map<number, TeamSeason>;
  season: number;
  gen: RandomGenerator;
  transactionLog: TransactionLogEntry[];
  coachingStaffs: Map<number, CoachingStaff>;
  seasonHistory: unknown[];
  nextDraftPlayerId: number;
  ownerBidModifiers?: Map<number, TeamBidModifier>;
  /** Full team list (needed for AI free agency) */
  teams?: Team[];
  /** User's team ID (AI teams sign FAs around the user) */
  userTeamId?: number;
}

export interface OffseasonResult {
  gen: RandomGenerator;
  recap: OffseasonRecap;
  newPlayers: Player[];
}

export function advanceOffseason(input: OffseasonInput): OffseasonResult {
  let gen = input.gen;
  const retirements: number[] = [];

  // ── Phase 1: Player development (age + SDE + retirement) ─────────────────

  // Build per-team staff dev bonuses
  const teamDevBonuses = new Map<number, { hitter: number; pitcher: number }>();
  for (const [teamId, coaching] of input.coachingStaffs) {
    const bonuses = bonusesFromCoaching(coaching);
    teamDevBonuses.set(teamId, {
      hitter: bonuses.hitterDevMultiplier,
      pitcher: bonuses.pitcherDevMultiplier,
    });
  }

  for (const [playerId, player] of input.players) {
    if (player.rosterData.rosterStatus === 'RETIRED') continue;

    const staffBonus = teamDevBonuses.get(player.teamId);
    const [developed, nextGen, _event] = developPlayer(player, gen, staffBonus);
    gen = nextGen;

    if (developed.rosterData.rosterStatus === 'RETIRED' || developed.development.phase === 'retirement') {
      developed.rosterData.rosterStatus = 'RETIRED';
      retirements.push(playerId);
    }

    input.players.set(playerId, developed);
  }

  // ── Phase 2: Service time eligibility update ─────────────────────────────
  // After a full season, players gain ~172 service days.
  // 172 days = 1 service year. 6 years = FA eligible.
  // 3 years = arb eligible.

  for (const player of input.players.values()) {
    if (player.rosterData.rosterStatus === 'RETIRED') continue;
    if (player.rosterData.rosterStatus === 'FREE_AGENT') continue;

    const serviceYears = Math.floor(player.rosterData.serviceTimeDays / 172);

    // FA eligibility: 6+ service years
    if (serviceYears >= 6) {
      player.rosterData.freeAgentEligible = true;
    }

    // Arbitration eligibility: 3-5 service years (not yet FA eligible)
    if (serviceYears >= 3 && serviceYears < 6) {
      player.rosterData.arbitrationEligible = true;
      // Bump salary based on arb year
      const arbYear = serviceYears - 2; // 1, 2, or 3
      const marketFraction = arbYear === 1 ? 0.4 : arbYear === 2 ? 0.6 : 0.8;
      const marketValue = Math.round((player.overall / 550) * 20_000_000 * marketFraction);
      player.rosterData.salary = Math.max(player.rosterData.salary, Math.round(marketValue / 100_000) * 100_000);
    }
  }

  // ── Phase 3: Contract progression + FA class generation ──────────────────
  // Decrements contract years, makes expired-contract FA-eligible players free agents

  const updatedPlayers = Array.from(input.players.values());
  const newFACount = generateFreeAgentClass(updatedPlayers);

  // Sync mutations back to map
  for (const p of updatedPlayers) {
    input.players.set(p.playerId, p);
  }

  // ── Phase 4: AI free agent signings ──────────────────────────────────────

  const faSignings: OffseasonRecap['faSignings'] = [];

  if (input.teams && input.teams.length > 0) {
    const allPlayers = Array.from(input.players.values());
    const userTeamId = input.userTeamId ?? 1;
    const { signings } = processAISignings(allPlayers, input.teams, userTeamId);

    for (const s of signings) {
      // Sync signed player state back to map
      const player = allPlayers.find(p => p.name === s.playerName && p.teamId === s.teamId);
      if (player) {
        input.players.set(player.playerId, player);
        faSignings.push({
          playerId: player.playerId,
          teamId: s.teamId,
          years: s.years,
          annualSalary: s.salary,
        });
      }
    }
  }

  void newFACount; // consumed by FA class generation side effects

  // ── Phase 5: Generate annual draft class (new talent entering the league) ──
  const newPlayers: Player[] = [];
  let nextPlayerId = input.nextDraftPlayerId;

  try {
    const [draftClass, nextGen] = generateAnnualDraftClass(gen, input.season + 1, 150);
    gen = nextGen;
    for (const prospect of draftClass) {
      prospect.playerId = nextPlayerId++;
      newPlayers.push(prospect);
      input.players.set(prospect.playerId, prospect);
    }
  } catch { /* draft class generation non-fatal */ }

  // ── Phase 6: Generate international signing class ──────────────────────────
  try {
    const [_intlProspects, intlPlayers, nextGen] = generateIntlClass(gen, nextPlayerId, input.season + 1);
    gen = nextGen;
    for (const prospect of intlPlayers) {
      newPlayers.push(prospect);
      input.players.set(prospect.playerId, prospect);
      nextPlayerId = Math.max(nextPlayerId, prospect.playerId + 1);
    }

    // ── Phase 7: AI international signings ─────────────────────────────────
    if (input.teams && input.teams.length > 0 && _intlProspects.length > 0) {
      const teamInfos = input.teams.map(t => ({ teamId: t.teamId, abbreviation: t.abbreviation }));
      const allPlayers = Array.from(input.players.values());
      const [_aiIntlResult, nextGen2] = processAIIntlSignings(
        _intlProspects, allPlayers, teamInfos, input.userTeamId ?? 1, gen,
      );
      gen = nextGen2;
      // Sync signed intl prospects back to map
      for (const p of allPlayers) {
        input.players.set(p.playerId, p);
      }
    }
  } catch { /* intl signing non-fatal */ }

  // ── Phase 8: Ensure minimum rosters (prevent forfeit bugs) ────────────────
  try {
    const allPlayers = Array.from(input.players.values());
    if (input.teams && input.teams.length > 0) {
      ensureMinimumRosters(allPlayers, input.teams);
      // Sync any promoted players back
      for (const p of allPlayers) {
        input.players.set(p.playerId, p);
      }
    }
  } catch { /* roster guard non-fatal */ }

  return {
    gen,
    recap: {
      season: input.season,
      retirements,
      faSignings,
      rule5Picks: [],
      draftResult: { picks: [] },
    },
    newPlayers,
  };
}
