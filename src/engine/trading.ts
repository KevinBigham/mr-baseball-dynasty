import type { Player } from '../types/player';
import type { Team } from '../types/team';

// ─── Trade types ────────────────────────────────────────────────────────────

export interface TradeProposal {
  tradeId: number;
  partnerTeamId: number;
  partnerTeamName: string;
  partnerTeamAbbr: string;
  offered: TradePlayerInfo[];  // Partner is offering these
  requested: TradePlayerInfo[]; // Partner wants these from user
  fairness: number; // -100 to +100 (positive = user getting better deal)
}

export interface TradePlayerInfo {
  playerId: number;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  salary: number;
  contractYearsRemaining: number;
  tradeValue: number;
}

export interface TradeResult {
  ok: boolean;
  error?: string;
}

// ─── Trade value evaluation ─────────────────────────────────────────────────

export function evaluatePlayer(player: Player): number {
  // Base value from overall rating (0-550 scale, map to 0-60)
  let value = (player.overall / 550) * 60;

  // Potential bonus (younger players with high potential are worth more)
  const potentialGap = player.potential - player.overall;
  if (potentialGap > 0) {
    value += (potentialGap / 550) * 20;
  }

  // Age curve: peak value at 26, declining after 30
  if (player.age <= 26) {
    value *= 1.1;
  } else if (player.age <= 29) {
    value *= 1.0;
  } else if (player.age <= 32) {
    value *= 0.85;
  } else if (player.age <= 35) {
    value *= 0.65;
  } else {
    value *= 0.4;
  }

  // Contract factor: cheap players are more valuable
  const yearsLeft = player.rosterData.contractYearsRemaining;
  const salary = player.rosterData.salary;
  if (salary < 1_000_000 && yearsLeft >= 3) {
    value *= 1.2; // Pre-arb bargain
  } else if (salary > 15_000_000) {
    value *= 0.85; // Expensive
  } else if (salary > 25_000_000) {
    value *= 0.7;
  }

  // MLB-ready bonus
  if (player.rosterData.rosterStatus === 'MLB_ACTIVE') {
    value *= 1.05;
  }

  return Math.round(Math.max(0, Math.min(100, value)));
}

function playerToTradeInfo(player: Player): TradePlayerInfo {
  return {
    playerId: player.playerId,
    name: player.name,
    position: player.position,
    age: player.age,
    overall: player.overall,
    potential: player.potential,
    salary: player.rosterData.salary,
    contractYearsRemaining: player.rosterData.contractYearsRemaining,
    tradeValue: evaluatePlayer(player),
  };
}

// ─── AI trade offer generation ──────────────────────────────────────────────

export function generateTradeOffers(
  userTeamId: number,
  players: Player[],
  teams: Team[],
): TradeProposal[] {
  const userPlayers = players.filter(
    p => p.teamId === userTeamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')) &&
    p.rosterData.rosterStatus !== 'FREE_AGENT' &&
    p.rosterData.rosterStatus !== 'RETIRED'
  );
  if (userPlayers.length === 0) return [];

  const otherTeams = teams.filter(t => t.teamId !== userTeamId);
  const proposals: TradeProposal[] = [];
  let tradeIdCounter = Date.now();

  // Generate 2-3 offers from random teams
  const numOffers = Math.min(3, otherTeams.length);
  const shuffledTeams = [...otherTeams].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numOffers; i++) {
    const partnerTeam = shuffledTeams[i];
    const partnerPlayers = players.filter(
      p => p.teamId === partnerTeam.teamId &&
      (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')) &&
      p.overall >= 200 // Minimum quality
    );

    if (partnerPlayers.length < 1) continue;

    // Find a desirable user player (top-half of roster)
    const sortedUserPlayers = [...userPlayers].sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));
    const targetIdx = Math.floor(Math.random() * Math.min(10, sortedUserPlayers.length));
    const targetPlayer = sortedUserPlayers[targetIdx];
    const targetValue = evaluatePlayer(targetPlayer);

    // Build an offering package to roughly match value
    const sortedPartnerPlayers = [...partnerPlayers].sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));
    const offered: Player[] = [];
    let offeredValue = 0;

    for (const p of sortedPartnerPlayers) {
      if (offeredValue >= targetValue * 0.85) break;
      if (offered.length >= 2) break;
      offered.push(p);
      offeredValue += evaluatePlayer(p);
    }

    if (offered.length === 0) continue;

    const fairness = offeredValue - targetValue;

    proposals.push({
      tradeId: tradeIdCounter++,
      partnerTeamId: partnerTeam.teamId,
      partnerTeamName: partnerTeam.name,
      partnerTeamAbbr: partnerTeam.abbreviation,
      offered: offered.map(playerToTradeInfo),
      requested: [playerToTradeInfo(targetPlayer)],
      fairness: Math.round(Math.max(-100, Math.min(100, fairness))),
    });
  }

  return proposals;
}

// ─── Execute a trade ────────────────────────────────────────────────────────

export function executeTrade(
  players: Player[],
  userTeamId: number,
  partnerTeamId: number,
  userPlayerIds: number[],
  partnerPlayerIds: number[],
): TradeResult {
  // Validate all players exist and belong to correct teams
  for (const pid of userPlayerIds) {
    const p = players.find(pl => pl.playerId === pid);
    if (!p) return { ok: false, error: `Player ${pid} not found.` };
    if (p.teamId !== userTeamId) return { ok: false, error: `${p.name} is not on your team.` };
  }
  for (const pid of partnerPlayerIds) {
    const p = players.find(pl => pl.playerId === pid);
    if (!p) return { ok: false, error: `Player ${pid} not found.` };
    if (p.teamId !== partnerTeamId) return { ok: false, error: `${p.name} is not on the partner team.` };
  }

  // Swap team assignments
  for (const pid of userPlayerIds) {
    const p = players.find(pl => pl.playerId === pid)!;
    p.teamId = partnerTeamId;
    // Demote to minors if coming from MLB
    if (p.rosterData.rosterStatus === 'MLB_ACTIVE') {
      p.rosterData.rosterStatus = 'MINORS_AAA';
    }
  }
  for (const pid of partnerPlayerIds) {
    const p = players.find(pl => pl.playerId === pid)!;
    p.teamId = userTeamId;
    if (p.rosterData.rosterStatus === 'MLB_ACTIVE') {
      p.rosterData.rosterStatus = 'MINORS_AAA';
    }
    p.rosterData.isOn40Man = true;
  }

  return { ok: true };
}

// ─── Evaluate user-proposed trade fairness ──────────────────────────────────

export function evaluateProposedTrade(
  players: Player[],
  userPlayerIds: number[],
  partnerPlayerIds: number[],
): { fair: boolean; userValue: number; partnerValue: number } {
  let userValue = 0;
  let partnerValue = 0;

  for (const pid of userPlayerIds) {
    const p = players.find(pl => pl.playerId === pid);
    if (p) userValue += evaluatePlayer(p);
  }
  for (const pid of partnerPlayerIds) {
    const p = players.find(pl => pl.playerId === pid);
    if (p) partnerValue += evaluatePlayer(p);
  }

  // AI accepts if getting at least 85% of value
  const fair = userValue >= partnerValue * 0.85;
  return { fair, userValue, partnerValue };
}
