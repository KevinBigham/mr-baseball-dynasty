/**
 * pitchTunnelEffectiveness.ts – Pitch Tunnel Effectiveness Engine
 *
 * Measures pitch deception at the decision point (tunnel point):
 *   - Tunnel distance (inches of separation at tunnel point)
 *   - Reaction time available after tunnel divergence
 *   - Whiff rate and called strike rate for tunnel pairs
 *   - Overall tunnel scores (0-100) and deception rankings
 *   - Release point consistency grading
 *
 * Bloomberg terminal aesthetic: #22c55e good, #ef4444 bad, #f59e0b neutral.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TunnelPair {
  pitch1: string;
  pitch2: string;
  tunnelDistance: number;       // inches of separation at tunnel point
  reactionTime: number;         // ms available after tunnel divergence
  effectivenessPct: number;     // 0-100
  whiffRateCombo: number;       // combined whiff rate for the pair
  calledStrikeRate: number;     // called strike rate when sequenced
}

export interface TunnelProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP' | 'CL';
  overallTunnelScore: number;   // 0-100
  bestPair: string;
  worstPair: string;
  avgTunnelDist: number;        // inches
  pairs: TunnelPair[];
  deceptionRank: number;
  releaseConsistency: number;   // 0-100
  notes: string;
}

export type TunnelGrade = 'elite_tunnel' | 'plus_tunnel' | 'avg_tunnel' | 'below_tunnel' | 'poor_tunnel';

// ── Display Maps ───────────────────────────────────────────────────────────

export const TUNNEL_GRADE_DISPLAY: Record<TunnelGrade, { label: string; color: string }> = {
  elite_tunnel: { label: 'Elite Tunnel',      color: '#22c55e' },
  plus_tunnel:  { label: 'Plus Tunnel',       color: '#4ade80' },
  avg_tunnel:   { label: 'Average Tunnel',    color: '#f59e0b' },
  below_tunnel: { label: 'Below Avg Tunnel',  color: '#f97316' },
  poor_tunnel:  { label: 'Poor Tunnel',       color: '#ef4444' },
};

export function tunnelGradeFromScore(score: number): TunnelGrade {
  if (score >= 82) return 'elite_tunnel';
  if (score >= 68) return 'plus_tunnel';
  if (score >= 48) return 'avg_tunnel';
  if (score >= 30) return 'below_tunnel';
  return 'poor_tunnel';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface TunnelEffectivenessSummary {
  totalPitchers: number;
  bestTunneler: string;
  avgTunnelScore: number;
  bestPair: string;
  tightestTunnel: string;
}

export function getTunnelEffectivenessSummary(profiles: TunnelProfile[]): TunnelEffectivenessSummary {
  if (profiles.length === 0) {
    return { totalPitchers: 0, bestTunneler: '-', avgTunnelScore: 0, bestPair: '-', tightestTunnel: '-' };
  }

  const sorted = [...profiles].sort((a, b) => b.overallTunnelScore - a.overallTunnelScore);
  const best = sorted[0];
  const avgScore = Math.round(profiles.reduce((s, p) => s + p.overallTunnelScore, 0) / profiles.length);

  // Find the tightest tunnel (smallest distance) across all pitchers
  let tightestDist = Infinity;
  let tightestName = '';
  let tightestPairLabel = '';
  for (const profile of profiles) {
    for (const pair of profile.pairs) {
      if (pair.tunnelDistance < tightestDist) {
        tightestDist = pair.tunnelDistance;
        tightestName = profile.name;
        tightestPairLabel = `${pair.pitch1}/${pair.pitch2}`;
      }
    }
  }

  // Find the best pair across all pitchers (highest effectiveness)
  let bestPairEff = 0;
  let bestPairLabel = '';
  for (const profile of profiles) {
    for (const pair of profile.pairs) {
      if (pair.effectivenessPct > bestPairEff) {
        bestPairEff = pair.effectivenessPct;
        bestPairLabel = `${pair.pitch1}/${pair.pitch2} (${profile.name})`;
      }
    }
  }

  return {
    totalPitchers: profiles.length,
    bestTunneler: best.name,
    avgTunnelScore: avgScore,
    bestPair: bestPairLabel,
    tightestTunnel: `${tightestName} — ${tightestPairLabel} (${tightestDist.toFixed(1)} in)`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function tp(
  p1: string, p2: string, dist: number, react: number,
  eff: number, whiff: number, cStrike: number,
): TunnelPair {
  return {
    pitch1: p1, pitch2: p2,
    tunnelDistance: dist,
    reactionTime: react,
    effectivenessPct: eff,
    whiffRateCombo: whiff,
    calledStrikeRate: cStrike,
  };
}

export function generateDemoTunnelEffectiveness(): TunnelProfile[] {
  return [
    // ── 1. Elite SP — elite fastball/changeup tunnel ────────────────────
    {
      id: 'tnl-cole-sp',
      name: 'Garrett Cole',
      team: 'NYY',
      role: 'SP',
      overallTunnelScore: 89,
      bestPair: '4-Seam/Changeup',
      worstPair: '4-Seam/Curveball',
      avgTunnelDist: 2.1,
      pairs: [
        tp('4-Seam FB', 'Changeup',   1.4, 142, 94, .382, .228),
        tp('4-Seam FB', 'Slider',      2.0, 158, 86, .348, .195),
        tp('4-Seam FB', 'Curveball',   3.2, 178, 72, .298, .168),
        tp('Slider',    'Changeup',    1.8, 148, 88, .358, .212),
        tp('Changeup',  'Curveball',   2.4, 165, 78, .312, .178),
      ],
      deceptionRank: 3,
      releaseConsistency: 92,
      notes: 'Elite tunnel between FB and CH — only 1.4 inches of separation at the tunnel point. Hitters cannot distinguish until 142ms before the plate. Release consistency is top-tier.',
    },

    // ── 2. Plus SP — sweeper/fastball specialist ────────────────────────
    {
      id: 'tnl-webb-sp',
      name: 'Logan Webb',
      team: 'SFG',
      role: 'SP',
      overallTunnelScore: 78,
      bestPair: 'Sinker/Sweeper',
      worstPair: 'Sinker/Changeup',
      avgTunnelDist: 2.6,
      pairs: [
        tp('Sinker',   'Sweeper',     1.8, 148, 90, .362, .218),
        tp('Sinker',   'Changeup',    2.8, 168, 74, .288, .185),
        tp('Sinker',   'Slider',      2.2, 155, 82, .332, .198),
        tp('Sweeper',  'Changeup',    3.0, 172, 68, .278, .162),
        tp('Slider',   'Changeup',    2.8, 170, 72, .282, .172),
        tp('Sinker',   'Curveball',   3.4, 182, 62, .262, .152),
      ],
      deceptionRank: 12,
      releaseConsistency: 84,
      notes: 'Sinker/Sweeper tunnel is devastating — the horizontal break divergence is late and violent. Deep repertoire but some pairs have wide separation.',
    },

    // ── 3. Elite closer — two-pitch tunnel dominance ────────────────────
    {
      id: 'tnl-diaz-cl',
      name: 'Edwin Diaz',
      team: 'NYM',
      role: 'CL',
      overallTunnelScore: 92,
      bestPair: '4-Seam/Slider',
      worstPair: '4-Seam/Changeup',
      avgTunnelDist: 1.6,
      pairs: [
        tp('4-Seam FB', 'Slider',      1.2, 135, 96, .412, .242),
        tp('4-Seam FB', 'Changeup',    2.0, 152, 82, .338, .198),
        tp('Slider',    'Changeup',    1.8, 148, 86, .352, .208),
        tp('4-Seam FB', '4-Seam FB (elevated)', 0.8, 125, 92, .368, .258),
      ],
      deceptionRank: 1,
      releaseConsistency: 96,
      notes: 'Best tunnel in baseball. FB/SL separation is just 1.2 inches — hitters have only 135ms to react. Release point is virtually identical across all pitches. Unhittable when located.',
    },

    // ── 4. Average SP — command over deception ──────────────────────────
    {
      id: 'tnl-gray-sp',
      name: 'Jon Gray',
      team: 'TEX',
      role: 'SP',
      overallTunnelScore: 54,
      bestPair: 'Fastball/Slider',
      worstPair: 'Fastball/Curveball',
      avgTunnelDist: 3.2,
      pairs: [
        tp('4-Seam FB', 'Slider',      2.6, 162, 72, .302, .188),
        tp('4-Seam FB', 'Curveball',   4.0, 195, 52, .248, .142),
        tp('4-Seam FB', 'Changeup',    2.8, 168, 68, .292, .178),
        tp('Slider',    'Curveball',   3.2, 178, 58, .268, .158),
        tp('Slider',    'Changeup',    3.4, 182, 56, .258, .152),
      ],
      deceptionRank: 68,
      releaseConsistency: 62,
      notes: 'Below-average tunnel metrics. Curveball is telegraphed by arm slot change — 4.0 inches of separation. Survives on stuff quality and command rather than deception.',
    },

    // ── 5. Below-average reliever — limited arsenal hurts tunnel ────────
    {
      id: 'tnl-smith-rp',
      name: 'Drew Smith',
      team: 'ATL',
      role: 'RP',
      overallTunnelScore: 38,
      bestPair: 'Sinker/Slider',
      worstPair: 'Sinker/Curveball',
      avgTunnelDist: 3.6,
      pairs: [
        tp('Sinker',   'Slider',      2.8, 168, 66, .288, .175),
        tp('Sinker',   'Curveball',   4.4, 202, 42, .228, .128),
        tp('Slider',   'Curveball',   3.8, 188, 48, .248, .142),
        tp('Sinker',   'Changeup',    3.4, 180, 54, .262, .158),
      ],
      deceptionRank: 142,
      releaseConsistency: 48,
      notes: 'Inconsistent release point undermines tunnel metrics. Hitters can identify the curveball early. Sinker/Slider pair is serviceable but the overall package lacks deception.',
    },

    // ── 6. Plus RP — cutter/sinker deception master ─────────────────────
    {
      id: 'tnl-clase-rp',
      name: 'Emmanuel Clase',
      team: 'CLE',
      role: 'RP',
      overallTunnelScore: 84,
      bestPair: 'Cutter/Sinker',
      worstPair: 'Cutter/Slider',
      avgTunnelDist: 1.9,
      pairs: [
        tp('Cutter',   'Sinker',      1.0, 130, 95, .392, .245),
        tp('Cutter',   'Slider',      2.4, 158, 78, .328, .195),
        tp('Sinker',   'Slider',      2.2, 155, 80, .338, .202),
        tp('Cutter',   'Changeup',    1.8, 148, 86, .358, .218),
        tp('Sinker',   'Changeup',    2.0, 152, 82, .342, .208),
      ],
      deceptionRank: 5,
      releaseConsistency: 90,
      notes: 'Cutter/Sinker tunnel is elite — same release, same tunnel, opposite break. Only 1.0 inches of divergence at the decision point. Hitters have to guess direction.',
    },
  ];
}
