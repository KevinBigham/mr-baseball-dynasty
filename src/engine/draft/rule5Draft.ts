import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import type { StandingsRow } from '../../types/league';
import { computeTeamProfile } from '../aiTeamIntelligence';
import { evaluatePlayer } from '../trading';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Rule5Selection {
  playerId: number;
  playerName: string;
  position: string;
  overall: number;
  potential: number;
  age: number;
  selectingTeamId: number;
  selectingTeamAbbr: string;
  originalTeamId: number;
  originalTeamAbbr: string;
}

// ─── Rule 5 Eligibility ─────────────────────────────────────────────────────

/**
 * Identify Rule 5 eligible players:
 * - Not on 40-man roster
 * - Signed at age 18+: 5+ seasons since signing
 * - Signed at age <18: 6+ seasons since signing
 * - Must be in a team's minor league system (not FA, DFA, or retired)
 */
export function identifyRule5Eligible(players: Player[], season: number): Player[] {
  return players.filter(p => {
    if (p.rosterData.isOn40Man) return false;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') return false;
    if (p.rosterData.rosterStatus === 'RETIRED') return false;
    if (p.rosterData.rosterStatus === 'DFA') return false;
    if (p.rosterData.rosterStatus === 'DRAFT_ELIGIBLE') return false;
    if (!p.rosterData.rosterStatus.startsWith('MINORS_')) return false;
    if (p.teamId <= 0) return false;

    const yearsInSystem = season - p.rosterData.signedSeason;
    const threshold = p.rosterData.signedAge < 18 ? 6 : 5;

    return yearsInSystem >= threshold;
  });
}

// ─── Conduct Rule 5 Draft ────────────────────────────────────────────────────

/**
 * AI teams select from Rule 5 eligible pool.
 * Selection order: inverse of standings (worst record picks first).
 * Selected players must be placed on the 25-man roster for the entire next season
 * or offered back to their original team.
 */
export function conductRule5Draft(
  players: Player[],
  teams: Team[],
  userTeamId: number,
  season: number,
  standings?: StandingsRow[],
): Rule5Selection[] {
  const eligible = identifyRule5Eligible(players, season);
  if (eligible.length === 0) return [];

  // Sort eligible by quality (best available for AI to consider)
  eligible.sort((a, b) => {
    const scoreA = a.overall * 0.4 + a.potential * 0.6;
    const scoreB = b.overall * 0.4 + b.potential * 0.6;
    return scoreB - scoreA;
  });

  // Draft order: inverse standings
  const teamOrder = standings
    ? [...standings].sort((a, b) => a.wins - b.wins).map(s => s.teamId)
    : teams.map(t => t.teamId);

  const selections: Rule5Selection[] = [];
  const selectedIds = new Set<number>();

  for (const teamId of teamOrder) {
    if (teamId === userTeamId) continue; // User selects manually

    const team = teams.find(t => t.teamId === teamId);
    if (!team) continue;

    // Check 40-man space (Rule 5 picks go on 40-man)
    const fortyManCount = players.filter(
      p => p.teamId === teamId && p.rosterData.isOn40Man,
    ).length;
    if (fortyManCount >= 40) continue;

    // Check active roster space (Rule 5 picks must be on 25-man)
    const activeCount = players.filter(
      p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE',
    ).length;
    if (activeCount >= 26) continue;

    const profile = computeTeamProfile(team, players, standings);

    // Find best available that fills a need
    let bestPick: Player | null = null;
    let bestScore = 0;

    for (const prospect of eligible) {
      if (selectedIds.has(prospect.playerId)) continue;
      if (prospect.teamId === teamId) continue; // Can't pick from own system

      let score = evaluatePlayer(prospect);

      // Position need bonus
      const posNeed = profile.positionalNeeds.find(n => n.position === prospect.position);
      if (posNeed) {
        if (posNeed.severity === 'critical') score += 15;
        else if (posNeed.severity === 'moderate') score += 8;
      }

      // Young high-potential bonus
      if (prospect.age <= 24 && prospect.potential >= 350) score += 10;

      // Must be MLB-ready enough to stay on roster all season
      if (prospect.overall < 200) score -= 20;

      // Contenders are less likely to use a roster spot on Rule 5
      if (profile.mode === 'contender' && prospect.overall < 280) score -= 15;

      if (score > bestScore) {
        bestScore = score;
        bestPick = prospect;
      }
    }

    // Only select if the prospect is worth a roster spot
    if (bestPick && bestScore >= 20) {
      const originalTeam = teams.find(t => t.teamId === bestPick!.teamId);

      selections.push({
        playerId: bestPick.playerId,
        playerName: bestPick.name,
        position: bestPick.position,
        overall: bestPick.overall,
        potential: bestPick.potential,
        age: bestPick.age,
        selectingTeamId: teamId,
        selectingTeamAbbr: team.abbreviation,
        originalTeamId: bestPick.teamId,
        originalTeamAbbr: originalTeam?.abbreviation ?? '???',
      });

      // Execute the selection
      bestPick.rosterData.rule5Selected = true;
      bestPick.rosterData.rule5OriginalTeamId = bestPick.teamId;
      bestPick.teamId = teamId;
      bestPick.rosterData.rosterStatus = 'MLB_ACTIVE';
      bestPick.rosterData.isOn40Man = true;

      selectedIds.add(bestPick.playerId);
    }
  }

  return selections;
}

/**
 * User selects a Rule 5 eligible player for their team.
 */
export function userRule5Pick(
  player: Player,
  userTeamId: number,
  players: Player[],
): { ok: boolean; error?: string } {
  // Verify eligibility
  if (player.rosterData.isOn40Man) return { ok: false, error: 'Player is already on a 40-man roster.' };
  if (player.teamId === userTeamId) return { ok: false, error: 'Cannot select from your own system.' };

  // Check 40-man and active roster space
  const fortyMan = players.filter(p => p.teamId === userTeamId && p.rosterData.isOn40Man).length;
  if (fortyMan >= 40) return { ok: false, error: '40-man roster is full.' };
  const active = players.filter(p => p.teamId === userTeamId && p.rosterData.rosterStatus === 'MLB_ACTIVE').length;
  if (active >= 26) return { ok: false, error: 'Active roster is full.' };

  player.rosterData.rule5Selected = true;
  player.rosterData.rule5OriginalTeamId = player.teamId;
  player.teamId = userTeamId;
  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.isOn40Man = true;

  return { ok: true };
}
