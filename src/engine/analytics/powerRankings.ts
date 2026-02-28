/**
 * Power Rankings — Mr. Baseball Dynasty
 *
 * Computes team strength ratings based on roster quality:
 *   - Overall roster talent (WAR potential)
 *   - Rotation depth
 *   - Bullpen quality
 *   - Lineup depth
 *   - Farm system strength
 *
 * Returns a 0-100 rating for each team.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';

export interface PowerRanking {
  teamId: number;
  teamName: string;
  abbreviation: string;
  rank: number;
  rating: number;         // 0-100 overall power rating
  offenseRating: number;  // 0-100 lineup quality
  rotationRating: number; // 0-100 starting rotation
  bullpenRating: number;  // 0-100 bullpen quality
  farmRating: number;     // 0-100 minor league depth
  trend: number;          // Win-loss recent trend (-1 to +1)
}

export function computePowerRankings(
  teams: Team[],
  players: Player[],
): PowerRanking[] {
  const rankings: PowerRanking[] = [];

  for (const team of teams) {
    const roster = players.filter(p => p.teamId === team.teamId);
    const active = roster.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE');
    const minors = roster.filter(p => p.rosterData.rosterStatus === 'MINOR_LEAGUE' || p.rosterData.rosterStatus === 'MINOR_LEAGUE_40MAN');

    // Offense: top 9 hitters by overall
    const hitters = active.filter(p => !p.isPitcher).sort((a, b) => b.overall - a.overall);
    const top9 = hitters.slice(0, 9);
    const avgHitterOvr = top9.length > 0
      ? top9.reduce((s, p) => s + p.overall, 0) / top9.length
      : 40;
    const offenseRating = Math.min(100, Math.max(0, Math.round((avgHitterOvr - 30) * 1.5)));

    // Rotation: top 5 starters by overall
    const starters = active.filter(p => p.position === 'SP').sort((a, b) => b.overall - a.overall);
    const top5SP = starters.slice(0, 5);
    const avgSPOvr = top5SP.length > 0
      ? top5SP.reduce((s, p) => s + p.overall, 0) / top5SP.length
      : 40;
    const rotationRating = Math.min(100, Math.max(0, Math.round((avgSPOvr - 30) * 1.5)));

    // Bullpen: top 5 relievers
    const relievers = active.filter(p => p.position === 'RP' || p.position === 'CL').sort((a, b) => b.overall - a.overall);
    const top5RP = relievers.slice(0, 5);
    const avgRPOvr = top5RP.length > 0
      ? top5RP.reduce((s, p) => s + p.overall, 0) / top5RP.length
      : 40;
    const bullpenRating = Math.min(100, Math.max(0, Math.round((avgRPOvr - 30) * 1.5)));

    // Farm: average potential of top minor leaguers
    const farmProspects = minors
      .filter(p => p.age <= 25)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 10);
    const avgFarmPot = farmProspects.length > 0
      ? farmProspects.reduce((s, p) => s + p.potential, 0) / farmProspects.length
      : 40;
    const farmRating = Math.min(100, Math.max(0, Math.round((avgFarmPot - 30) * 1.5)));

    // Win/loss trend
    const { wins, losses } = team.seasonRecord;
    const total = wins + losses;
    const trend = total > 0 ? (wins / total - 0.5) * 2 : 0; // -1 to +1

    // Overall rating: weighted blend
    const rating = Math.round(
      offenseRating * 0.30 +
      rotationRating * 0.30 +
      bullpenRating * 0.15 +
      farmRating * 0.10 +
      trend * 15 // Recent performance
    );

    rankings.push({
      teamId: team.teamId,
      teamName: team.name,
      abbreviation: team.abbreviation,
      rank: 0,
      rating: Math.min(100, Math.max(0, rating)),
      offenseRating,
      rotationRating,
      bullpenRating,
      farmRating,
      trend,
    });
  }

  // Sort by rating descending and assign ranks
  rankings.sort((a, b) => b.rating - a.rating);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  return rankings;
}
