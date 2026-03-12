/**
 * Prospect rankings.
 * Generates Top 100 prospect list from minor league players,
 * weighted by potential, age, and overall rating.
 */

import type { Player } from '../../types/player';
import type { RandomGenerator } from '../math/prng';

export interface ProspectRanking {
  rank: number;
  playerId: number;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  teamId: number;
  eta: string;        // Estimated MLB arrival: "2027", "2028", etc.
  grade: string;      // Prospect grade: A+, A, B+, B, C+, C
  riskLevel: string;  // 'Low' | 'Medium' | 'High'
}

function computeProspectScore(player: Player): number {
  // Weight: 60% potential, 25% overall, 15% youth bonus
  const potentialScore = player.potential * 0.6;
  const overallScore = player.overall * 0.25;
  const youthBonus = Math.max(0, (25 - player.age) * 8) * 0.15;
  return potentialScore + overallScore + youthBonus;
}

function estimateETA(player: Player, currentSeason: number): string {
  const gap = player.potential - player.overall;
  const yearsToMLB = Math.max(1, Math.ceil(gap / 40));
  return String(currentSeason + yearsToMLB);
}

function gradeProspect(score: number): string {
  if (score >= 350) return 'A+';
  if (score >= 300) return 'A';
  if (score >= 260) return 'B+';
  if (score >= 220) return 'B';
  if (score >= 180) return 'C+';
  return 'C';
}

function assessRisk(player: Player): string {
  const volatility = player.development.sigma;
  if (volatility >= 35) return 'High';
  if (volatility >= 20) return 'Medium';
  return 'Low';
}

export function generateTop100(
  playerMap: Map<number, Player>,
  gen: RandomGenerator,
  currentSeason = 2026,
): [ProspectRanking[], RandomGenerator] {
  const prospects: Array<{ player: Player; score: number }> = [];

  for (const player of playerMap.values()) {
    // Minor league players only (not MLB active, not retired, not FA)
    const status = player.rosterData.rosterStatus;
    if (!status.startsWith('MINORS_') && status !== 'DRAFT_ELIGIBLE') continue;
    if (player.age > 28) continue; // Too old for prospect lists
    if (player.teamId <= 0) continue;

    const score = computeProspectScore(player);
    if (score > 100) { // Minimum threshold
      prospects.push({ player, score });
    }
  }

  // Sort by score descending
  prospects.sort((a, b) => b.score - a.score);

  // Take top 100
  const rankings: ProspectRanking[] = prospects.slice(0, 100).map((p, i) => ({
    rank: i + 1,
    playerId: p.player.playerId,
    name: p.player.name,
    position: p.player.position,
    age: p.player.age,
    overall: p.player.overall,
    potential: p.player.potential,
    teamId: p.player.teamId,
    eta: estimateETA(p.player, currentSeason),
    grade: gradeProspect(p.score),
    riskLevel: assessRisk(p.player),
  }));

  return [rankings, gen];
}
