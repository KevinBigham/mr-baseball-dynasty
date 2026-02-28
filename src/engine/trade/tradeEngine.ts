/**
 * Trade Engine — Mr. Baseball Dynasty
 *
 * Handles trade proposals, AI evaluation, and execution.
 * Inspired by OOTP's trade system:
 *   - AI evaluates based on value differential, team needs, and strategy
 *   - Contenders more willing to trade prospects for MLB talent
 *   - Rebuilders more willing to trade veterans for prospects
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import {
  calculatePlayerValue,
  calculatePackageValue,
  assessTeamNeeds,
} from './valuation';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TradeProposal {
  fromTeamId: number;
  toTeamId: number;
  playersOffered: number[];   // player IDs from proposing team
  playersRequested: number[]; // player IDs from target team
}

export type TradeResponse = 'ACCEPT' | 'REJECT' | 'INTERESTED';

export interface TradeEvaluation {
  response: TradeResponse;
  valueDiff: number;           // positive = trade favors the evaluator
  reason: string;
  counterOffer?: TradeProposal;
}

export interface TradeRecord {
  season: number;
  date: string;
  team1Id: number;
  team2Id: number;
  team1Players: number[];
  team2Players: number[];
  team1PlayerNames: string[];
  team2PlayerNames: string[];
}

// ─── AI Trade Evaluation ────────────────────────────────────────────────────────

export function evaluateTrade(
  proposal: TradeProposal,
  teams: Team[],
  players: Player[],
): TradeEvaluation {
  const fromTeam = teams.find(t => t.teamId === proposal.fromTeamId);
  const toTeam = teams.find(t => t.teamId === proposal.toTeamId);
  if (!fromTeam || !toTeam) {
    return { response: 'REJECT', valueDiff: 0, reason: 'Invalid teams.' };
  }

  const offeredPlayers = proposal.playersOffered
    .map(id => players.find(p => p.playerId === id))
    .filter((p): p is Player => !!p);
  const requestedPlayers = proposal.playersRequested
    .map(id => players.find(p => p.playerId === id))
    .filter((p): p is Player => !!p);

  if (offeredPlayers.length === 0 || requestedPlayers.length === 0) {
    return { response: 'REJECT', valueDiff: 0, reason: 'Empty trade.' };
  }

  // Check for untradeable players (10-and-5 veto right)
  for (const p of requestedPlayers) {
    if (p.rosterData.hasTenAndFive) {
      return { response: 'REJECT', valueDiff: 0, reason: `${p.name} has 10-and-5 trade veto rights.` };
    }
  }

  const offeredValue = calculatePackageValue(offeredPlayers);
  const requestedValue = calculatePackageValue(requestedPlayers);
  const valueDiff = offeredValue - requestedValue;

  // Team needs adjustment
  const toNeeds = assessTeamNeeds(toTeam, players);
  let needsBonus = 0;
  for (const offered of offeredPlayers) {
    const need = toNeeds.needs.find(n => n.position === offered.position);
    if (need) needsBonus += need.urgency * 1.5;
  }

  // Strategy adjustment
  let strategyMod = 0;
  if (toTeam.strategy === 'contender') {
    // Contenders value MLB-ready talent more
    const mlbReady = offeredPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE');
    strategyMod += mlbReady.length * 3;
    // But are less willing to give up their stars
    const starsRequested = requestedPlayers.filter(p => calculatePlayerValue(p) > 60);
    strategyMod -= starsRequested.length * 5;
  } else if (toTeam.strategy === 'rebuilder') {
    // Rebuilders love young prospects
    const youngProspects = offeredPlayers.filter(p => p.age <= 25 && p.potential > p.overall);
    strategyMod += youngProspects.length * 4;
    // And are willing to move expensive veterans
    const expensiveVets = requestedPlayers.filter(p => p.age > 30 && p.rosterData.salary > 5_000_000);
    strategyMod += expensiveVets.length * 3;
  }

  const adjustedDiff = valueDiff + needsBonus + strategyMod;

  // Decision thresholds
  if (adjustedDiff >= 5) {
    return {
      response: 'ACCEPT',
      valueDiff: adjustedDiff,
      reason: tradeAcceptReason(toTeam, offeredPlayers, requestedPlayers),
    };
  }

  if (adjustedDiff >= -5) {
    return {
      response: 'INTERESTED',
      valueDiff: adjustedDiff,
      reason: `${toTeam.name} are intrigued but want more. Sweeten the deal.`,
    };
  }

  return {
    response: 'REJECT',
    valueDiff: adjustedDiff,
    reason: tradeRejectReason(toTeam, adjustedDiff),
  };
}

function tradeAcceptReason(team: Team, _offered: Player[], _requested: Player[]): string {
  const reasons = [
    `The ${team.name} see this as a win for their ${team.strategy === 'contender' ? 'October push' : 'rebuild'}.`,
    `${team.name} front office likes the return and accepts.`,
    `The ${team.name} believe this fills a key need.`,
    `${team.name} GM pulled the trigger. Deal is done.`,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)]!;
}

function tradeRejectReason(team: Team, diff: number): string {
  if (diff < -20) {
    return `The ${team.name} hung up the phone. Insulting offer.`;
  }
  if (diff < -10) {
    return `${team.name} say they'd need significantly more to make this work.`;
  }
  return `${team.name} politely declined. They want a better package.`;
}

// ─── Execute a trade ────────────────────────────────────────────────────────────

export function executeTrade(
  proposal: TradeProposal,
  players: Player[],
  season: number,
): TradeRecord {
  const team1Names: string[] = [];
  const team2Names: string[] = [];

  // Move offered players to target team
  for (const id of proposal.playersOffered) {
    const p = players.find(pl => pl.playerId === id);
    if (p) {
      team1Names.push(p.name);
      p.teamId = proposal.toTeamId;
      p.rosterData.serviceTimeCurrentTeamDays = 0;
    }
  }

  // Move requested players to proposing team
  for (const id of proposal.playersRequested) {
    const p = players.find(pl => pl.playerId === id);
    if (p) {
      team2Names.push(p.name);
      p.teamId = proposal.fromTeamId;
      p.rosterData.serviceTimeCurrentTeamDays = 0;
    }
  }

  return {
    season,
    date: 'trade',
    team1Id: proposal.fromTeamId,
    team2Id: proposal.toTeamId,
    team1Players: [...proposal.playersOffered],
    team2Players: [...proposal.playersRequested],
    team1PlayerNames: team1Names,
    team2PlayerNames: team2Names,
  };
}

// ─── Get tradeable players for a team ───────────────────────────────────────────

export function getTradeablePlayers(players: Player[], teamId: number): Player[] {
  return players.filter(p =>
    p.teamId === teamId &&
    p.rosterData.rosterStatus !== 'RETIRED' &&
    p.rosterData.rosterStatus !== 'FREE_AGENT' &&
    p.rosterData.rosterStatus !== 'DRAFT_ELIGIBLE' &&
    !p.rosterData.hasTenAndFive,
  );
}
