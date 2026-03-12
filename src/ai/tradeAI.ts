/**
 * Trade AI engine.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../types/player';
import type { TeamStrategy } from '../types/team';
import type { RandomGenerator } from '../engine/math/prng';
import { evaluatePlayer } from '../engine/trading';

export interface TradePackage {
  fromTeamId: number;
  toTeamId: number;
  playersOffered: number[];
  playersRequested: number[];
}

export interface TradeMarketDiagnostics {
  totalProposals: number;
  acceptedCount: number;
}

export interface TradeMarketContext {
  deadlineUrgency: number;
  sameLeague: boolean;
  sameDivision: boolean;
  rivalryTax: number;
}

export interface TradeEvalResult {
  accepted: boolean;
  surplus: number;
  reason: string;
  marketDiagnostics: TradeMarketDiagnostics;
}

export interface TradeReputation {
  trustScore: number;
}

export interface CounterOfferResult {
  package: TradePackage;
  evaluation: TradeEvalResult;
  changed: boolean;
  rounds: number;
}

export function createTradeReputation(): TradeReputation {
  return { trustScore: 50 };
}

export function aiProposeTrades(
  _teamId: number,
  _strategy: TeamStrategy,
  _playerMap: Map<number, Player>,
  _teamStrategies: Map<number, TeamStrategy>,
  _scoutingProfiles: Map<number, unknown>,
  _reputations: Map<number, TradeReputation>,
  gen: RandomGenerator,
  _opts?: { deadlineUrgency?: number },
): [TradePackage[], RandomGenerator] {
  return [[], gen];
}

export function evaluateTrade(
  _pkg: TradePackage,
  _playerMap: Map<number, Player>,
  _teamStrategies: Map<number, TeamStrategy>,
  _scoutingProfiles: Map<number, unknown>,
  _reputations: Map<number, TradeReputation>,
  gen: RandomGenerator,
  _maxRounds?: number,
  _context?: TradeMarketContext,
): [TradeEvalResult, RandomGenerator] {
  return [{
    accepted: false,
    surplus: 0,
    reason: 'Trade engine stub',
    marketDiagnostics: { totalProposals: 0, acceptedCount: 0 },
  }, gen];
}

export function proposeCounterOffer(
  pkg: TradePackage,
  playerMap: Map<number, Player>,
  _teamStrategies: Map<number, TeamStrategy>,
  _scoutingProfiles: Map<number, unknown>,
  _reputations: Map<number, TradeReputation>,
  gen: RandomGenerator,
  maxRounds = 2,
  _context?: TradeMarketContext,
): [CounterOfferResult, RandomGenerator] {
  // Evaluate the current deal
  let offeredValue = 0;
  let requestedValue = 0;

  for (const pid of pkg.playersOffered) {
    const p = playerMap.get(pid);
    if (p) offeredValue += evaluatePlayer(p);
  }
  for (const pid of pkg.playersRequested) {
    const p = playerMap.get(pid);
    if (p) requestedValue += evaluatePlayer(p);
  }

  // The AI team (toTeamId) evaluates: are they getting enough?
  // offeredValue = what the user is giving TO the AI team
  // requestedValue = what the AI team would give UP
  const deficit = requestedValue - offeredValue; // positive = AI is giving up more

  // If the deal is already fair or favorable for AI, accept
  if (deficit <= requestedValue * 0.05) {
    return [{
      package: pkg,
      evaluation: {
        accepted: true,
        surplus: offeredValue - requestedValue,
        reason: 'Deal accepted.',
        marketDiagnostics: { totalProposals: 1, acceptedCount: 1 },
      },
      changed: false,
      rounds: 0,
    }, gen];
  }

  // If way too unfair (deficit > 40% of requested value), reject outright
  if (deficit > requestedValue * 0.40) {
    return [{
      package: pkg,
      evaluation: {
        accepted: false,
        surplus: -(deficit),
        reason: 'The value gap is too large. This deal is not close.',
        marketDiagnostics: { totalProposals: 1, acceptedCount: 0 },
      },
      changed: false,
      rounds: 1,
    }, gen];
  }

  // Counter-offer: find a prospect from the offering team (fromTeamId) to add
  // that fills the value gap
  const fromTeamProspects: Array<{ playerId: number; value: number }> = [];
  for (const [pid, p] of playerMap) {
    if (p.teamId !== pkg.fromTeamId) continue;
    if (pkg.playersOffered.includes(pid)) continue; // Already in the deal
    if (p.rosterData.rosterStatus === 'RETIRED' || p.rosterData.rosterStatus === 'FREE_AGENT') continue;
    if (p.rosterData.hasTenAndFive) continue;
    const val = evaluatePlayer(p);
    if (val > 0) fromTeamProspects.push({ playerId: pid, value: val });
  }

  // Sort by how close their value is to the deficit (find the best fit)
  fromTeamProspects.sort((a, b) => Math.abs(a.value - deficit) - Math.abs(b.value - deficit));

  let round = 0;
  let counterPkg = { ...pkg, playersOffered: [...pkg.playersOffered] };
  let currentDeficit = deficit;

  // Try to fill the gap by adding players (up to maxRounds additions)
  while (round < maxRounds && currentDeficit > requestedValue * 0.05 && fromTeamProspects.length > 0) {
    // Find the best-fitting prospect
    const bestFit = fromTeamProspects.shift()!;

    // Don't add someone way more valuable than the gap (would make it unfair the other way)
    if (bestFit.value > currentDeficit * 3) continue;

    counterPkg.playersOffered.push(bestFit.playerId);
    currentDeficit -= bestFit.value;
    round++;
  }

  const changed = counterPkg.playersOffered.length > pkg.playersOffered.length;
  const newOfferedValue = offeredValue + (deficit - currentDeficit);
  const accepted = currentDeficit <= requestedValue * 0.10;

  return [{
    package: counterPkg,
    evaluation: {
      accepted,
      surplus: newOfferedValue - requestedValue,
      reason: changed
        ? (accepted
          ? 'We\'ll do this deal if you include the additional player(s).'
          : 'Even with adjustments, the value gap is still too wide.')
        : 'No suitable counter-offer found.',
      marketDiagnostics: { totalProposals: 1, acceptedCount: accepted ? 1 : 0 },
    },
    changed,
    rounds: round,
  }, gen];
}
