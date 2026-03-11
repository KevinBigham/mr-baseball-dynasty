/**
 * Offseason pipeline.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../../types/player';
import type { TeamSeason, CoachingStaff } from '../../types/team';
import type { TransactionLogEntry } from '../../types/roster';
import type { OffseasonRecap } from '../../types/offseason';
import type { RandomGenerator } from '../math/prng';

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
}

export interface OffseasonResult {
  gen: RandomGenerator;
  recap: OffseasonRecap;
  newPlayers: Player[];
}

export function advanceOffseason(input: OffseasonInput): OffseasonResult {
  return {
    gen: input.gen,
    recap: {
      season: input.season,
      retirements: [],
      faSignings: [],
      rule5Picks: [],
      draftResult: { picks: [] },
    },
    newPlayers: [],
  };
}
