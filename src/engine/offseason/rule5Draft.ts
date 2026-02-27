/**
 * Rule 5 Draft — Mr. Baseball Dynasty
 *
 * MLB Rule 5 Draft mechanics:
 *   - Players NOT on 40-man roster after certain service time are eligible
 *   - Teams can select eligible players from other organizations
 *   - Selected players MUST stay on 25/26-man roster all season or be returned
 *   - Protection: add to 40-man before Rule 5 draft to protect
 *
 * Eligibility: Signed at 18+ and 5 seasons in org, or signed <18 and 4 seasons
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Rule5Eligible {
  playerId:      number;
  name:          string;
  position:      string;
  age:           number;
  teamId:        number;
  teamName:      string;
  overall:       number;
  potential:     number;
  scoutGrade:    number;
  isPitcher:     boolean;
  seasonsInOrg:  number;
}

export interface Rule5Selection {
  playerId:       number;
  playerName:     string;
  fromTeamId:     number;
  fromTeamName:   string;
  toTeamId:       number;
  toTeamName:     string;
  position:       string;
  overall:        number;
}

export interface Rule5Result {
  selections:     Rule5Selection[];
  protectedCount: number;  // Players protected by user before draft
}

// ─── Identify eligible players ──────────────────────────────────────────────────

export function identifyRule5Eligible(
  players: Player[],
  teams: Team[],
  currentSeason: number,
): Rule5Eligible[] {
  const teamMap = new Map(teams.map(t => [t.teamId, t.name]));
  const eligible: Rule5Eligible[] = [];

  for (const p of players) {
    // Must be in a minor league level and NOT on 40-man
    if (p.rosterData.isOn40Man) continue;
    if (p.rosterData.rosterStatus === 'RETIRED') continue;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') continue;
    if (p.rosterData.rosterStatus === 'DFA') continue;
    if (p.rosterData.rosterStatus === 'MLB_ACTIVE') continue;
    if (p.teamId <= 0) continue;

    // Rule 5 eligibility: depends on when signed
    const seasonsInOrg = currentSeason - p.rosterData.signedSeason;
    const signedYoung = p.rosterData.signedAge < 18;
    const requiredSeasons = signedYoung ? 4 : 5;

    if (seasonsInOrg < requiredSeasons) continue;

    // Only reasonably talented players get selected
    const grade = toScoutingScale(p.overall);
    if (grade < 35) continue;

    eligible.push({
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      age: p.age,
      teamId: p.teamId,
      teamName: teamMap.get(p.teamId) ?? '???',
      overall: p.overall,
      potential: p.potential,
      scoutGrade: grade,
      isPitcher: p.isPitcher,
      seasonsInOrg,
    });
  }

  // Sort by talent
  eligible.sort((a, b) => b.overall - a.overall);
  return eligible;
}

// ─── Protect a player (add to 40-man) ───────────────────────────────────────────

export function protectPlayer(player: Player, teamPlayers: Player[]): { ok: boolean; error?: string } {
  if (player.rosterData.isOn40Man) return { ok: false, error: 'Already on 40-man roster.' };

  const fortyManCount = teamPlayers.filter(p =>
    p.teamId === player.teamId && p.rosterData.isOn40Man
  ).length;

  if (fortyManCount >= 40) return { ok: false, error: '40-man roster full. DFA someone first.' };

  player.rosterData.isOn40Man = true;
  return { ok: true };
}

// ─── Run Rule 5 Draft (AI selections) ───────────────────────────────────────────

export function runRule5Draft(
  players: Player[],
  teams: Team[],
  userTeamId: number,
  currentSeason: number,
): Rule5Result {
  const eligible = identifyRule5Eligible(players, teams, currentSeason);
  const teamMap = new Map(teams.map(t => [t.teamId, t]));
  const selections: Rule5Selection[] = [];

  // AI teams pick in reverse standings order
  const aiTeams = teams
    .filter(t => t.teamId !== userTeamId)
    .sort((a, b) => a.seasonRecord.wins - b.seasonRecord.wins);

  for (const team of aiTeams) {
    // Does this team have 40-man space?
    const fortyManCount = players.filter(p =>
      p.teamId === team.teamId && p.rosterData.isOn40Man
    ).length;
    if (fortyManCount >= 40) continue;

    // Does this team have 26-man space? (Rule 5 picks must stay on active roster)
    const activeCount = players.filter(p =>
      p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
    ).length;
    if (activeCount >= 26) continue;

    // Find best available from OTHER teams
    const candidate = eligible.find(e =>
      e.teamId !== team.teamId &&
      !selections.some(s => s.playerId === e.playerId) &&
      toScoutingScale(e.overall) >= 42 // Only pick reasonably good players
    );

    if (!candidate) continue;

    // Contenders are less likely to take Rule 5 gambles
    if (team.strategy === 'contender' && toScoutingScale(candidate.overall) < 50) continue;

    // Execute selection
    const player = players.find(p => p.playerId === candidate.playerId);
    if (!player) continue;

    const fromTeamName = teamMap.get(player.teamId)?.name ?? '???';
    player.teamId = team.teamId;
    player.rosterData.rosterStatus = 'MLB_ACTIVE';
    player.rosterData.isOn40Man = true;
    player.rosterData.rule5Selected = true;
    player.rosterData.rule5OriginalTeamId = candidate.teamId;

    selections.push({
      playerId: candidate.playerId,
      playerName: candidate.name,
      fromTeamId: candidate.teamId,
      fromTeamName,
      toTeamId: team.teamId,
      toTeamName: team.name,
      position: candidate.position,
      overall: candidate.overall,
    });
  }

  return { selections, protectedCount: 0 };
}

// ─── User selects a Rule 5 player ───────────────────────────────────────────────

export function userRule5Pick(
  player: Player,
  userTeamId: number,
  players: Player[],
  teams: Team[],
): { ok: boolean; error?: string } {
  // Check 40-man space
  const fortyManCount = players.filter(p =>
    p.teamId === userTeamId && p.rosterData.isOn40Man
  ).length;
  if (fortyManCount >= 40) return { ok: false, error: '40-man roster full.' };

  // Check 26-man space
  const activeCount = players.filter(p =>
    p.teamId === userTeamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
  ).length;
  if (activeCount >= 26) return { ok: false, error: 'Active roster full (26 max).' };

  const fromTeam = teams.find(t => t.teamId === player.teamId);
  void fromTeam;

  player.rosterData.rule5Selected = true;
  player.rosterData.rule5OriginalTeamId = player.teamId;
  player.teamId = userTeamId;
  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.isOn40Man = true;

  return { ok: true };
}
