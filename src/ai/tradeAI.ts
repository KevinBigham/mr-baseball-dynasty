/**
 * Trade AI engine.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../types/player';
import type { TeamStrategy } from '../types/team';
import type { RandomGenerator } from '../engine/math/prng';

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
  _playerMap: Map<number, Player>,
  _teamStrategies: Map<number, TeamStrategy>,
  _scoutingProfiles: Map<number, unknown>,
  _reputations: Map<number, TradeReputation>,
  gen: RandomGenerator,
  _maxRounds?: number,
  _context?: TradeMarketContext,
): [CounterOfferResult, RandomGenerator] {
  return [{
    package: pkg,
    evaluation: {
      accepted: false,
      surplus: 0,
      reason: 'Counter offer stub',
      marketDiagnostics: { totalProposals: 0, acceptedCount: 0 },
    },
    changed: false,
    rounds: 0,
  }, gen];
}
