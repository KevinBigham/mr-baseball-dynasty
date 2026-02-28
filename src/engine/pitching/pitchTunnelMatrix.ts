/**
 * Pitch Tunneling Effectiveness Matrix — Mr. Baseball Dynasty (Wave 71)
 *
 * Analyzes pitch-pair tunnel scores to determine which pitch combos
 * most effectively deceive hitters. Tunnel score is computed from:
 *   - Release point similarity (how close the two pitches look at release)
 *   - Movement divergence (how much they separate after the tunnel point)
 *   - Velocity differential (speed gap that disrupts hitter timing)
 *
 * Higher tunnel scores = more deceptive pairing.
 * Each pitcher gets a full NxN matrix of their arsenal plus league comparison.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type TunnelPitchType = 'FF' | 'SL' | 'CB' | 'CH' | 'CT' | 'SI' | 'SP' | 'KN';

export interface TunnelPitchInfo {
  label: string;
  color: string;
  avgVelo: number;          // league-average velocity
  vertBreak: number;        // inches of vertical break (positive = rise)
  horizBreak: number;       // inches of horizontal break (positive = arm-side)
  releaseHeight: number;    // feet above mound
}

export interface TunnelPairScore {
  pitchA: TunnelPitchType;
  pitchB: TunnelPitchType;
  releaseSimilarity: number;     // 0-100, how close release points are
  movementDivergence: number;    // 0-100, how far apart they end up
  veloDifferential: number;      // mph gap
  tunnelScore: number;           // 0-100 composite deception score
  whiffRateDelta: number;        // % increase in whiff rate when paired
  grade: string;                 // A+ through F
  scouting: string;              // text description of the tunnel effect
}

export interface PitcherTunnelProfile {
  playerId: number;
  name: string;
  team: string;
  position: 'SP' | 'RP' | 'CL';
  pitchTypes: TunnelPitchType[];
  tunnelPairs: TunnelPairScore[];
  bestPair: TunnelPairScore;
  worstPair: TunnelPairScore;
  overallTunnelGrade: string;
  overallTunnelScore: number;
  leaguePercentile: number;       // 0-100
}

export interface LeagueTunnelAverages {
  pairAverages: Record<string, number>;  // "FF-SL" -> 72
  overallAvg: number;
}

export interface PitchTunnelMatrixData {
  pitchers: PitcherTunnelProfile[];
  leagueAverages: LeagueTunnelAverages;
}

// ── Pitch type config ────────────────────────────────────────────────────────

export const TUNNEL_PITCH_INFO: Record<TunnelPitchType, TunnelPitchInfo> = {
  FF: { label: '4-Seam FB',  color: '#ef4444', avgVelo: 94.5, vertBreak: 15.2, horizBreak: -7.8,  releaseHeight: 5.9 },
  SL: { label: 'Slider',     color: '#3b82f6', avgVelo: 85.3, vertBreak: 1.8,  horizBreak: 2.4,   releaseHeight: 5.8 },
  CB: { label: 'Curveball',  color: '#a855f7', avgVelo: 79.1, vertBreak: -7.5, horizBreak: 6.1,   releaseHeight: 5.7 },
  CH: { label: 'Changeup',   color: '#22c55e', avgVelo: 86.2, vertBreak: 10.1, horizBreak: -14.2, releaseHeight: 5.8 },
  CT: { label: 'Cutter',     color: '#f97316', avgVelo: 89.8, vertBreak: 7.4,  horizBreak: -1.2,  releaseHeight: 5.9 },
  SI: { label: 'Sinker',     color: '#eab308', avgVelo: 93.1, vertBreak: 7.0,  horizBreak: -14.8, releaseHeight: 5.8 },
  SP: { label: 'Splitter',   color: '#06b6d4', avgVelo: 87.4, vertBreak: 3.2,  horizBreak: -10.6, releaseHeight: 5.8 },
  KN: { label: 'Knuckleball',color: '#94a3b8', avgVelo: 78.0, vertBreak: 8.5,  horizBreak: -0.5,  releaseHeight: 5.6 },
};

// ── Tunnel Grading ───────────────────────────────────────────────────────────

function tunnelGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 82) return 'A';
  if (score >= 75) return 'A-';
  if (score >= 68) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 52) return 'B-';
  if (score >= 44) return 'C+';
  if (score >= 36) return 'C';
  if (score >= 28) return 'C-';
  if (score >= 20) return 'D';
  return 'F';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ── Scouting descriptions ────────────────────────────────────────────────────

function tunnelScouting(pitchA: TunnelPitchType, pitchB: TunnelPitchType, score: number): string {
  const a = TUNNEL_PITCH_INFO[pitchA].label;
  const b = TUNNEL_PITCH_INFO[pitchB].label;

  if (score >= 85) return `Elite tunnel. ${a} and ${b} look identical out of the hand — hitters have no chance to differentiate until it's too late.`;
  if (score >= 70) return `Strong tunnel pairing. ${a} into ${b} creates late deception that generates swings and misses.`;
  if (score >= 55) return `Decent tunnel. ${a}-${b} pairing shows enough overlap to keep hitters off-balance when sequenced correctly.`;
  if (score >= 40) return `Below-average tunnel. Hitters can pick up the ${a}-${b} difference early in flight.`;
  return `Poor tunnel. ${a} and ${b} have very different release signatures — hitters can identify the pitch type early.`;
}

// ── Pair score computation ───────────────────────────────────────────────────

function computeTunnelPairScore(
  pitchA: TunnelPitchType,
  pitchB: TunnelPitchType,
  pitcherVariance: number,   // 0-1, how much this pitcher deviates from average
): TunnelPairScore {
  const a = TUNNEL_PITCH_INFO[pitchA];
  const b = TUNNEL_PITCH_INFO[pitchB];

  // Release similarity: closer release heights = higher score
  const releaseDist = Math.abs(a.releaseHeight - b.releaseHeight);
  const releaseSimilarity = clamp(Math.round(100 - releaseDist * 80 + (Math.random() * 12 - 6) * pitcherVariance), 10, 99);

  // Movement divergence: bigger difference in break = more deception AFTER tunnel point
  const vertDiff = Math.abs(a.vertBreak - b.vertBreak);
  const horizDiff = Math.abs(a.horizBreak - b.horizBreak);
  const totalMovementDiff = Math.sqrt(vertDiff * vertDiff + horizDiff * horizDiff);
  const movementDivergence = clamp(Math.round(totalMovementDiff * 3.2 + (Math.random() * 10 - 5) * pitcherVariance), 5, 99);

  // Velocity differential
  const veloDifferential = Math.round(Math.abs(a.avgVelo - b.avgVelo) * 10) / 10 +
    Math.round((Math.random() * 4 - 2) * pitcherVariance * 10) / 10;
  const veloFactor = clamp(veloDifferential, 0, 20);

  // Optimal velo differential is 8-12 mph: too little = hitter adjusts, too much = can spot it
  const veloOptimal = 1 - Math.abs(veloFactor - 10) / 15;

  // Composite tunnel score: high release similarity + high movement divergence + optimal velo gap
  const rawScore = releaseSimilarity * 0.40 + movementDivergence * 0.35 + veloOptimal * 100 * 0.25;
  const tunnelScore = clamp(Math.round(rawScore + (Math.random() * 8 - 4) * pitcherVariance), 10, 98);

  // Whiff rate delta: better tunneling = more whiffs
  const whiffRateDelta = Math.round((tunnelScore / 100) * 12 * 10) / 10;

  return {
    pitchA,
    pitchB,
    releaseSimilarity,
    movementDivergence,
    veloDifferential: Math.round(Math.abs(a.avgVelo - b.avgVelo) * 10) / 10,
    tunnelScore,
    whiffRateDelta,
    grade: tunnelGrade(tunnelScore),
    scouting: tunnelScouting(pitchA, pitchB, tunnelScore),
  };
}

// ── Pitcher tunnel profile generation ────────────────────────────────────────

function generatePitcherTunnelProfile(
  playerId: number,
  name: string,
  team: string,
  position: 'SP' | 'RP' | 'CL',
  pitchTypes: TunnelPitchType[],
  skillLevel: number,  // 0-1, higher = better tunneling
): PitcherTunnelProfile {
  const variance = 1 - skillLevel * 0.3; // better pitchers have less random variance
  const tunnelPairs: TunnelPairScore[] = [];

  // Generate all unique pairs
  for (let i = 0; i < pitchTypes.length; i++) {
    for (let j = i + 1; j < pitchTypes.length; j++) {
      const pair = computeTunnelPairScore(pitchTypes[i], pitchTypes[j], variance);
      // Skill level nudges scores up
      pair.tunnelScore = clamp(Math.round(pair.tunnelScore + skillLevel * 15 - 5), 10, 98);
      pair.grade = tunnelGrade(pair.tunnelScore);
      pair.scouting = tunnelScouting(pitchTypes[i], pitchTypes[j], pair.tunnelScore);
      tunnelPairs.push(pair);
    }
  }

  // Sort by tunnel score descending
  tunnelPairs.sort((a, b) => b.tunnelScore - a.tunnelScore);

  const bestPair = tunnelPairs[0];
  const worstPair = tunnelPairs[tunnelPairs.length - 1];
  const avgScore = Math.round(tunnelPairs.reduce((s, p) => s + p.tunnelScore, 0) / tunnelPairs.length);
  const percentile = clamp(Math.round(avgScore * 1.05 + skillLevel * 10 - 5), 1, 99);

  return {
    playerId,
    name,
    team,
    position,
    pitchTypes,
    tunnelPairs,
    bestPair,
    worstPair,
    overallTunnelGrade: tunnelGrade(avgScore),
    overallTunnelScore: avgScore,
    leaguePercentile: percentile,
  };
}

// ── League averages computation ──────────────────────────────────────────────

function computeLeagueAverages(pitchers: PitcherTunnelProfile[]): LeagueTunnelAverages {
  const pairSums: Record<string, { total: number; count: number }> = {};

  for (const p of pitchers) {
    for (const pair of p.tunnelPairs) {
      const key = `${pair.pitchA}-${pair.pitchB}`;
      if (!pairSums[key]) pairSums[key] = { total: 0, count: 0 };
      pairSums[key].total += pair.tunnelScore;
      pairSums[key].count += 1;
    }
  }

  const pairAverages: Record<string, number> = {};
  let totalAll = 0;
  let countAll = 0;
  for (const [key, v] of Object.entries(pairSums)) {
    pairAverages[key] = Math.round(v.total / v.count);
    totalAll += v.total;
    countAll += v.count;
  }

  return {
    pairAverages,
    overallAvg: countAll > 0 ? Math.round(totalAll / countAll) : 50,
  };
}

// ── Demo data generation ─────────────────────────────────────────────────────

export function generateDemoPitchTunnelMatrix(): PitchTunnelMatrixData {
  const pitchers: PitcherTunnelProfile[] = [
    generatePitcherTunnelProfile(
      201, 'Marcus Stroud', 'NYM', 'SP',
      ['FF', 'SL', 'CH', 'CB'], 0.85
    ),
    generatePitcherTunnelProfile(
      202, 'Tyler Kauffman', 'NYM', 'SP',
      ['FF', 'CT', 'CH', 'SI'], 0.72
    ),
    generatePitcherTunnelProfile(
      203, 'Diego Velasquez', 'NYM', 'SP',
      ['SI', 'SL', 'CH', 'CB', 'CT'], 0.78
    ),
    generatePitcherTunnelProfile(
      204, 'Ryne Kessler', 'NYM', 'RP',
      ['FF', 'SL', 'SP'], 0.90
    ),
    generatePitcherTunnelProfile(
      205, 'Jordan McAllister', 'NYM', 'CL',
      ['FF', 'SL', 'CT'], 0.88
    ),
    generatePitcherTunnelProfile(
      206, 'Hideo Nakamura', 'NYM', 'SP',
      ['SP', 'FF', 'SL', 'CH'], 0.82
    ),
    generatePitcherTunnelProfile(
      207, 'Caleb Rowan', 'NYM', 'RP',
      ['SI', 'SL', 'CH'], 0.65
    ),
    generatePitcherTunnelProfile(
      208, 'Andre Baptiste', 'NYM', 'RP',
      ['FF', 'CB', 'CH', 'CT'], 0.58
    ),
  ];

  const leagueAverages = computeLeagueAverages(pitchers);

  return { pitchers, leagueAverages };
}

// ── Utility exports for UI ───────────────────────────────────────────────────

export function getPairKey(a: TunnelPitchType, b: TunnelPitchType): string {
  return `${a}-${b}`;
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#eab308';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#3b82f6';
  if (score >= 50) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}
