import type { Player, PlayerSeasonStats } from '../types/player';
import type { Team } from '../types/team';
import type { StandingsRow } from '../types/league';
import { computeTeamProfile, evaluateTradeForTeam, type TeamProfile } from './aiTeamIntelligence';

// ─── Trade types ────────────────────────────────────────────────────────────

export interface TradeProposal {
  tradeId: number;
  partnerTeamId: number;
  partnerTeamName: string;
  partnerTeamAbbr: string;
  offered: TradePlayerInfo[];  // Partner is offering these
  requested: TradePlayerInfo[]; // Partner wants these from user
  fairness: number; // -100 to +100 (positive = user getting better deal)
  reason?: string;    // AI motivation for the trade
  aiAccepts?: boolean; // Whether the AI team would accept this deal
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
  isPitcher: boolean;
  stats: {
    avg?: number; hr?: number; ops?: number;
    era?: number; k9?: number; whip?: number;
  };
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

function playerToTradeInfo(player: Player, raw?: PlayerSeasonStats): TradePlayerInfo {
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);
  const stats: TradePlayerInfo['stats'] = {};
  if (raw) {
    if (isPitcher) {
      stats.era = raw.outs > 0 ? Number(((raw.er / raw.outs) * 27).toFixed(2)) : undefined;
      stats.k9 = raw.outs > 0 ? Number(((raw.ka / (raw.outs / 3)) * 9).toFixed(1)) : undefined;
      stats.whip = raw.outs > 0 ? Number(((raw.bba + raw.ha) / (raw.outs / 3)).toFixed(2)) : undefined;
    } else {
      stats.avg = raw.ab > 0 ? Number((raw.h / raw.ab).toFixed(3)) : undefined;
      stats.hr = raw.hr;
      if (raw.ab > 0 && raw.pa > 0) {
        const obp = (raw.h + raw.bb + raw.hbp) / raw.pa;
        const slg = (raw.h - raw.doubles - raw.triples - raw.hr + raw.doubles * 2 + raw.triples * 3 + raw.hr * 4) / raw.ab;
        stats.ops = Number((obp + slg).toFixed(3));
      }
    }
  }
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
    isPitcher,
    stats,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTradeEligible(players: Player[], teamId: number): Player[] {
  return players.filter(
    p => p.teamId === teamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')) &&
    p.rosterData.rosterStatus !== 'FREE_AGENT' &&
    p.rosterData.rosterStatus !== 'RETIRED' &&
    !p.rosterData.hasTenAndFive
  );
}

function findSurplusPlayers(profile: TeamProfile, players: Player[]): Player[] {
  const teamPlayers = players.filter(p => p.teamId === profile.teamId &&
    (p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus.startsWith('MINORS_')));
  const needPositions = new Set(profile.positionalNeeds.map(n => n.position));
  // Players at positions that are NOT needs
  return teamPlayers.filter(p => !needPositions.has(p.position) && p.overall >= 200);
}

// ─── Smart AI trade offer generation ────────────────────────────────────────

export function generateTradeOffers(
  userTeamId: number,
  players: Player[],
  teams: Team[],
  statsMap?: Map<number, PlayerSeasonStats>,
  standings?: StandingsRow[],
): TradeProposal[] {
  const userPlayers = getTradeEligible(players, userTeamId);
  if (userPlayers.length === 0) return [];

  const otherTeams = teams.filter(t => t.teamId !== userTeamId);
  const proposals: TradeProposal[] = [];
  let tradeIdCounter = Date.now();

  // Compute profiles for all AI teams
  const profiles = new Map<number, TeamProfile>();
  for (const team of otherTeams) {
    profiles.set(team.teamId, computeTeamProfile(team, players, standings));
  }

  // Each AI team evaluates whether it wants to trade with the user
  const interested: Array<{ team: Team; profile: TeamProfile; score: number }> = [];

  for (const team of otherTeams) {
    const profile = profiles.get(team.teamId)!;
    if (profile.positionalNeeds.length === 0) continue;

    // Does the user have anyone at a position this team needs?
    const hasMatch = profile.positionalNeeds.some(need =>
      userPlayers.some(p => p.position === need.position && evaluatePlayer(p) > 15)
    );
    if (!hasMatch) continue;

    // Score how motivated this team is to trade
    let motivation = 0;
    if (profile.mode === 'contender') motivation += 15; // Contenders trade aggressively
    if (profile.mode === 'rebuilder') motivation += 10; // Rebuilders sell
    const criticalNeeds = profile.positionalNeeds.filter(n => n.severity === 'critical').length;
    motivation += criticalNeeds * 8;

    interested.push({ team, profile, score: motivation });
  }

  interested.sort((a, b) => b.score - a.score);

  // Generate 3-5 offers from the most motivated teams
  const maxOffers = Math.min(5, interested.length);
  for (let i = 0; i < maxOffers; i++) {
    const { team: partnerTeam, profile } = interested[i];
    const partnerPlayers = getTradeEligible(players, partnerTeam.teamId);
    if (partnerPlayers.length < 1) continue;

    // What does this team need from the user?
    const targetCandidates = userPlayers
      .filter(p => profile.positionalNeeds.some(n => n.position === p.position))
      .sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));

    // Fallback: if no positional matches, target user's best available
    const target = targetCandidates.length > 0
      ? targetCandidates[0]
      : [...userPlayers].sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a))[
          Math.min(i, userPlayers.length - 1)
        ];

    if (!target) continue;
    const targetValue = evaluatePlayer(target);

    // Build offering package from surplus positions
    const surplus = findSurplusPlayers(profile, players)
      .sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));

    // Fallback to any tradeable players
    const offerPool = surplus.length > 0 ? surplus : [...partnerPlayers].sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));
    const offered: Player[] = [];
    let offeredValue = 0;

    // Contenders overpay for needs; rebuilders try to extract maximum value
    const overpayFactor = profile.mode === 'contender' ? 1.0 : 0.9;

    for (const p of offerPool) {
      if (offeredValue >= targetValue * overpayFactor) break;
      if (offered.length >= 3) break;
      // Skip offering players the team critically needs
      const isNeed = profile.positionalNeeds.some(n => n.position === p.position && n.severity === 'critical');
      if (isNeed) continue;
      offered.push(p);
      offeredValue += evaluatePlayer(p);
    }

    if (offered.length === 0) continue;

    // Context-aware fairness evaluation
    const tradeEval = evaluateTradeForTeam(profile, [target], offered);
    const fairness = offeredValue - targetValue;

    // Determine reason
    const posNeed = profile.positionalNeeds.find(n => n.position === target.position);
    let reason = 'Depth trade';
    if (posNeed?.severity === 'critical') reason = `Urgently needs ${target.position}`;
    else if (posNeed?.severity === 'moderate') reason = `Targeting ${target.position} upgrade`;
    else if (profile.mode === 'contender') reason = 'Win-now acquisition';
    else if (profile.mode === 'rebuilder') reason = 'Selling for prospects';

    proposals.push({
      tradeId: tradeIdCounter++,
      partnerTeamId: partnerTeam.teamId,
      partnerTeamName: partnerTeam.name,
      partnerTeamAbbr: partnerTeam.abbreviation,
      offered: offered.map(p => playerToTradeInfo(p, statsMap?.get(p.playerId))),
      requested: [playerToTradeInfo(target, statsMap?.get(target.playerId))],
      fairness: Math.round(Math.max(-100, Math.min(100, fairness))),
      reason,
      aiAccepts: tradeEval.accept,
    });
  }

  return proposals;
}

// ─── Shop Player ────────────────────────────────────────────────────────────

export function shopPlayer(
  playerId: number,
  players: Player[],
  teams: Team[],
  statsMap?: Map<number, PlayerSeasonStats>,
  standings?: StandingsRow[],
): TradeProposal[] {
  const player = players.find(p => p.playerId === playerId);
  if (!player) return [];
  const userTeamId = player.teamId;
  const playerValue = evaluatePlayer(player);

  const otherTeams = teams.filter(t => t.teamId !== userTeamId);
  const offers: TradeProposal[] = [];
  let tradeIdCounter = Date.now();

  for (const team of otherTeams) {
    const profile = computeTeamProfile(team, players, standings);

    // Is this team interested?
    let interest = 0;
    const posNeed = profile.positionalNeeds.find(n => n.position === player.position);
    if (posNeed) {
      if (posNeed.severity === 'critical') interest += 25;
      else if (posNeed.severity === 'moderate') interest += 15;
      else interest += 5;
    }

    // Mode-based interest
    if (profile.mode === 'contender' && player.overall >= 350) interest += 10;
    if (profile.mode === 'rebuilder' && player.age >= 30 && player.rosterData.salary > 10_000_000) interest -= 20;
    if (profile.mode === 'rebuilder' && player.age <= 25) interest += 10;

    if (interest <= 0) continue;

    // Build return package
    const teamPlayers = getTradeEligible(players, team.teamId)
      .sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));

    const offered: Player[] = [];
    let offeredValue = 0;

    for (const p of teamPlayers) {
      if (offeredValue >= playerValue * 0.85) break;
      if (offered.length >= 3) break;
      offered.push(p);
      offeredValue += evaluatePlayer(p);
    }

    if (offered.length === 0) continue;

    // Would this team accept giving up these players?
    const tradeEval = evaluateTradeForTeam(profile, [player], offered);
    if (!tradeEval.accept) continue;

    offers.push({
      tradeId: tradeIdCounter++,
      partnerTeamId: team.teamId,
      partnerTeamName: team.name,
      partnerTeamAbbr: team.abbreviation,
      offered: offered.map(p => playerToTradeInfo(p, statsMap?.get(p.playerId))),
      requested: [playerToTradeInfo(player, statsMap?.get(player.playerId))],
      fairness: Math.round(offeredValue - playerValue),
      reason: tradeEval.reason,
      aiAccepts: true,
    });
  }

  return offers.sort((a, b) => b.fairness - a.fairness).slice(0, 10);
}

// ─── Find Trades for Need ───────────────────────────────────────────────────

export function findTradesForNeed(
  userTeamId: number,
  position: string,
  players: Player[],
  teams: Team[],
  statsMap?: Map<number, PlayerSeasonStats>,
  standings?: StandingsRow[],
): TradeProposal[] {
  // Find candidates at the desired position on other teams
  const otherTeams = teams.filter(t => t.teamId !== userTeamId);
  const userPlayers = getTradeEligible(players, userTeamId);
  const offers: TradeProposal[] = [];
  let tradeIdCounter = Date.now();

  for (const team of otherTeams) {
    const profile = computeTeamProfile(team, players, standings);
    const teamPlayers = getTradeEligible(players, team.teamId);

    // Find their best player at the position the user needs
    const candidates = teamPlayers
      .filter(p => p.position === position && p.overall >= 250)
      .sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));

    if (candidates.length === 0) continue;

    const target = candidates[0];
    const targetValue = evaluatePlayer(target);

    // What would they want from us?
    // Prefer offering from positions the AI team needs
    const userOffer = [...userPlayers]
      .filter(p => p.playerId !== target.playerId)
      .sort((a, b) => {
        const aNeed = profile.positionalNeeds.some(n => n.position === a.position) ? 1 : 0;
        const bNeed = profile.positionalNeeds.some(n => n.position === b.position) ? 1 : 0;
        if (aNeed !== bNeed) return bNeed - aNeed;
        return evaluatePlayer(b) - evaluatePlayer(a);
      });

    const offered: Player[] = [];
    let offeredValue = 0;

    for (const p of userOffer) {
      if (offeredValue >= targetValue * 0.85) break;
      if (offered.length >= 3) break;
      offered.push(p);
      offeredValue += evaluatePlayer(p);
    }

    if (offered.length === 0) continue;

    // Would the AI accept?
    const tradeEval = evaluateTradeForTeam(profile, offered, [target]);

    offers.push({
      tradeId: tradeIdCounter++,
      partnerTeamId: team.teamId,
      partnerTeamName: team.name,
      partnerTeamAbbr: team.abbreviation,
      offered: [playerToTradeInfo(target, statsMap?.get(target.playerId))],
      requested: offered.map(p => playerToTradeInfo(p, statsMap?.get(p.playerId))),
      fairness: Math.round(targetValue - offeredValue),
      reason: tradeEval.reason,
      aiAccepts: tradeEval.accept,
    });
  }

  return offers.sort((a, b) => {
    // Sort: accepted trades first, then by target quality
    if (a.aiAccepts !== b.aiAccepts) return a.aiAccepts ? -1 : 1;
    return (b.offered[0]?.overall ?? 0) - (a.offered[0]?.overall ?? 0);
  }).slice(0, 10);
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

  // Swap team assignments (players keep their current roster status)
  for (const pid of userPlayerIds) {
    const p = players.find(pl => pl.playerId === pid)!;
    p.teamId = partnerTeamId;
  }
  for (const pid of partnerPlayerIds) {
    const p = players.find(pl => pl.playerId === pid)!;
    p.teamId = userTeamId;
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
