import type { Player } from '../types/player';
import type { Team } from '../types/team';
import type { StandingsRow } from '../types/league';
import { computeTeamProfile } from './aiTeamIntelligence';
import { evaluatePlayer } from './trading';

// ─── Generate free agent class (end of season) ──────────────────────────────
// Players whose contracts expire and have enough service time become FAs.
export function generateFreeAgentClass(players: Player[]): number {
  let count = 0;
  for (const p of players) {
    if (p.rosterData.rosterStatus === 'RETIRED') continue;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') continue;

    // Decrement contract year
    if (p.rosterData.contractYearsRemaining > 0) {
      p.rosterData.contractYearsRemaining--;
    }

    // Become FA if contract expired and eligible
    if (p.rosterData.contractYearsRemaining <= 0 && p.rosterData.freeAgentEligible) {
      p.rosterData.rosterStatus = 'FREE_AGENT';
      p.rosterData.isOn40Man = false;
      p.teamId = -1;
      count++;
    }
  }
  return count;
}

// ─── Project salary for a free agent ─────────────────────────────────────────
export function projectSalary(player: Player): number {
  const ovr = player.overall;
  const age = player.age;

  // Base salary by overall rating
  let base: number;
  if (ovr >= 450) base = 25_000_000;
  else if (ovr >= 400) base = 15_000_000;
  else if (ovr >= 350) base = 8_000_000;
  else if (ovr >= 300) base = 4_000_000;
  else if (ovr >= 250) base = 2_000_000;
  else base = 1_000_000;

  // Scale by ovr ratio
  const ovrFactor = Math.max(0.5, ovr / 400);
  base = Math.round(base * ovrFactor);

  // Age discount: penalty for players 33+
  if (age >= 37) base = Math.round(base * 0.4);
  else if (age >= 35) base = Math.round(base * 0.6);
  else if (age >= 33) base = Math.round(base * 0.8);

  // Round to nearest 100K
  return Math.round(base / 100_000) * 100_000;
}

// ─── Project contract years ──────────────────────────────────────────────────
export function projectYears(player: Player): number {
  const age = player.age;
  const ovr = player.overall;

  if (age >= 37) return 1;
  if (age >= 35) return Math.min(2, ovr >= 400 ? 2 : 1);
  if (age >= 33) return Math.min(3, ovr >= 400 ? 3 : 2);
  if (age >= 30) return Math.min(4, ovr >= 400 ? 4 : 3);
  if (ovr >= 450) return 6;
  if (ovr >= 400) return 5;
  return Math.min(4, Math.max(1, Math.floor((ovr - 200) / 50)));
}

// ─── Sign a free agent ──────────────────────────────────────────────────────
export interface SignResult {
  ok: boolean;
  error?: string;
}

export function signFreeAgent(
  player: Player,
  teamId: number,
  years: number,
  annualSalary: number,
  allPlayers: Player[],
): SignResult {
  if (player.rosterData.rosterStatus !== 'FREE_AGENT') {
    return { ok: false, error: 'Player is not a free agent.' };
  }

  // Check 40-man space
  const fortyMan = allPlayers.filter(p => p.teamId === teamId && p.rosterData.isOn40Man).length;
  if (fortyMan >= 40) {
    return { ok: false, error: '40-man roster is full.' };
  }

  player.teamId = teamId;
  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.isOn40Man = true;
  player.rosterData.contractYearsRemaining = years;
  player.rosterData.salary = annualSalary;
  player.rosterData.freeAgentEligible = false;

  return { ok: true };
}

// ─── AI team free agent signings ─────────────────────────────────────────────
export interface AISigningRecord {
  playerName: string;
  position: string;
  overall: number;
  teamAbbr: string;
  teamId: number;
  salary: number;
  years: number;
  reason: string;
}

/**
 * Score how interested a team is in a specific free agent.
 * Returns 0 = no interest, higher = more interested.
 */
function scoreInterest(
  team: Team,
  fa: Player,
  players: Player[],
  standings?: StandingsRow[],
): number {
  const profile = computeTeamProfile(team, players, standings);
  const needs = profile.positionalNeeds;

  // Base interest from player quality
  const tradeValue = evaluatePlayer(fa);
  let interest = tradeValue;

  // Position need bonus
  const posNeed = needs.find(n => n.position === fa.position);
  if (posNeed) {
    if (posNeed.severity === 'critical') interest += 25;
    else if (posNeed.severity === 'moderate') interest += 12;
    else interest += 5;
  }

  // Mode-based adjustments
  if (profile.mode === 'contender') {
    // Contenders want proven MLB-ready talent
    if (fa.overall >= 350) interest += 15;
    // Contenders won't sign aging vets on long deals
    if (fa.age >= 35 && fa.overall < 350) interest -= 20;
  } else if (profile.mode === 'rebuilder') {
    // Rebuilders avoid expensive veterans
    if (fa.age >= 30 && fa.overall >= 350) interest -= 30;
    // Rebuilders prefer cheap, young options
    if (fa.age <= 27 && fa.overall >= 280) interest += 10;
    // Rebuilders have minimal interest in high-salary FAs
    const salary = projectSalary(fa);
    if (salary > 10_000_000) interest -= 20;
  }

  // Payroll check: skip if team can't afford
  const currentPayroll = players
    .filter(p => p.teamId === team.teamId && p.rosterData.salary > 0)
    .reduce((s, p) => s + p.rosterData.salary, 0);
  if (currentPayroll + projectSalary(fa) > team.budget * 1.1) {
    interest -= 40;
  }

  // 40-man space check
  const fortyManCount = players.filter(p => p.teamId === team.teamId && p.rosterData.isOn40Man).length;
  if (fortyManCount >= 40) interest = -100;

  return interest;
}

export function processAISignings(
  players: Player[],
  teams: Team[],
  userTeamId: number,
  standings?: StandingsRow[],
): { count: number; signings: AISigningRecord[] } {
  const freeAgents = players
    .filter(p => p.rosterData.rosterStatus === 'FREE_AGENT')
    .sort((a, b) => b.overall - a.overall);

  // Market factor: thin class = inflation, deep class = deflation
  const faClassSize = freeAgents.filter(f => f.overall >= 250).length;
  const marketFactor = faClassSize < 20 ? 1.15 : faClassSize > 60 ? 0.90 : 1.0;

  const signings: AISigningRecord[] = [];
  const teamSignCounts = new Map<number, number>();

  for (const fa of freeAgents) {
    if (fa.rosterData.rosterStatus !== 'FREE_AGENT') continue;
    if (fa.overall < 200) continue;

    // Score interest from all AI teams
    const interested: Array<{ team: Team; score: number }> = [];
    for (const team of teams) {
      if (team.teamId === userTeamId) continue;
      const signed = teamSignCounts.get(team.teamId) ?? 0;
      if (signed >= 5) continue; // Max 5 signings per team

      const score = scoreInterest(team, fa, players, standings);
      if (score > 10) {
        interested.push({ team, score });
      }
    }

    if (interested.length === 0) continue;

    // Best-fit team wins
    interested.sort((a, b) => b.score - a.score);
    const winner = interested[0];

    // Bidding war: multiple teams interested = salary inflation
    const bidWarFactor = interested.length >= 3 ? 1.15 : interested.length >= 2 ? 1.05 : 1.0;

    const baseSalary = projectSalary(fa);
    const adjustedSalary = Math.round((baseSalary * marketFactor * bidWarFactor) / 100_000) * 100_000;
    const years = projectYears(fa);

    // Determine reason for signing
    const profile = computeTeamProfile(winner.team, players, standings);
    const posNeed = profile.positionalNeeds.find(n => n.position === fa.position);
    let reason = 'Depth signing';
    if (posNeed?.severity === 'critical') reason = 'Fills critical need at ' + fa.position;
    else if (posNeed?.severity === 'moderate') reason = 'Addresses need at ' + fa.position;
    else if (fa.overall >= 400) reason = 'Premium talent acquisition';

    signings.push({
      playerName: fa.name,
      position: fa.position,
      overall: fa.overall,
      teamAbbr: winner.team.abbreviation,
      teamId: winner.team.teamId,
      salary: adjustedSalary,
      years,
      reason,
    });

    fa.teamId = winner.team.teamId;
    fa.rosterData.rosterStatus = 'MLB_ACTIVE';
    fa.rosterData.isOn40Man = true;
    fa.rosterData.contractYearsRemaining = years;
    fa.rosterData.salary = adjustedSalary;
    fa.rosterData.freeAgentEligible = false;

    teamSignCounts.set(winner.team.teamId, (teamSignCounts.get(winner.team.teamId) ?? 0) + 1);
  }

  return { count: signings.length, signings };
}
