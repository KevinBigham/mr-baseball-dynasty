import type { Player } from '../types/player';
import type { Team } from '../types/team';

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
}

export function processAISignings(
  players: Player[],
  teams: Team[],
  userTeamId: number,
): { count: number; signings: AISigningRecord[] } {
  const freeAgents = players
    .filter(p => p.rosterData.rosterStatus === 'FREE_AGENT')
    .sort((a, b) => b.overall - a.overall);

  const signings: AISigningRecord[] = [];

  for (const team of teams) {
    if (team.teamId === userTeamId) continue;

    const teamPlayers = players.filter(p => p.teamId === team.teamId);
    const activeCount = teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE').length;
    const fortyManCount = teamPlayers.filter(p => p.rosterData.isOn40Man).length;

    // Each team tries to fill up to 25 active roster spots
    const needActive = Math.max(0, 25 - activeCount);
    const fortyManSpace = 40 - fortyManCount;
    const canSign = Math.min(needActive, fortyManSpace, 5); // Max 5 signings per team

    let teamSigned = 0;
    for (const fa of freeAgents) {
      if (teamSigned >= canSign) break;
      if (fa.rosterData.rosterStatus !== 'FREE_AGENT') continue;
      if (fa.overall < 200) continue; // Skip very low rated players

      const years = projectYears(fa);
      const salary = projectSalary(fa);

      signings.push({
        playerName: fa.name,
        position: fa.position,
        overall: fa.overall,
        teamAbbr: team.abbreviation,
        teamId: team.teamId,
        salary,
        years,
      });

      fa.teamId = team.teamId;
      fa.rosterData.rosterStatus = 'MLB_ACTIVE';
      fa.rosterData.isOn40Man = true;
      fa.rosterData.contractYearsRemaining = years;
      fa.rosterData.salary = salary;
      fa.rosterData.freeAgentEligible = false;

      teamSigned++;
    }
  }

  return { count: signings.length, signings };
}
