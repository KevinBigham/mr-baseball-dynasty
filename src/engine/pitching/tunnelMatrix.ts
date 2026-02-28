/**
 * tunnelMatrix.ts – Pitch tunneling matrix
 *
 * Analyzes how well each pair of pitches in a pitcher's arsenal
 * "tunnels" — appearing identical through the tunnel point before
 * diverging. Higher tunnel scores indicate more deceptive combos.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TunnelPair {
  pitch1: string;
  pitch2: string;
  tunnelScore: number;       // 0-100
  tunnelDistance: number;     // inches apart at tunnel point
  plateDistance: number;      // inches apart at plate
  effectiveDeception: number; // 0-100
  whiffRateCombo: number;    // whiff% when used in sequence
  runValuePer100: number;    // run value per 100 pitches
}

export interface PitcherTunnelProfile {
  id: string;
  name: string;
  team: string;
  pos: string;
  overall: number;
  pitches: string[];
  overallTunnelGrade: number; // 0-100
  bestPair: string;
  worstPair: string;
  matrix: TunnelPair[];
  avgTunnelScore: number;
  notes: string;
}

export function getTunnelColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#4ade80';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface TunnelSummary {
  avgTeamTunnel: number;
  bestTunneler: string;
  bestPairOverall: string;
  eliteTunnelers: number;
}

export function getTunnelSummary(profiles: PitcherTunnelProfile[]): TunnelSummary {
  const avg = Math.round(profiles.reduce((s, p) => s + p.overallTunnelGrade, 0) / profiles.length);
  const best = profiles.reduce((a, b) => a.overallTunnelGrade > b.overallTunnelGrade ? a : b, profiles[0]);
  const allPairs = profiles.flatMap(p => p.matrix);
  const bestPair = allPairs.reduce((a, b) => a.tunnelScore > b.tunnelScore ? a : b, allPairs[0]);
  const elites = profiles.filter(p => p.overallTunnelGrade >= 75).length;
  return {
    avgTeamTunnel: avg,
    bestTunneler: best.name,
    bestPairOverall: `${bestPair.pitch1}→${bestPair.pitch2}`,
    eliteTunnelers: elites,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PITCHERS = [
  { name: 'Spencer Strider', team: 'ATL', ovr: 89, pitches: ['4-Seam', 'Slider', 'Changeup'] },
  { name: 'Zack Wheeler', team: 'PHI', ovr: 88, pitches: ['4-Seam', 'Slider', 'Curve', 'Changeup'] },
  { name: 'Gerrit Cole', team: 'NYY', ovr: 87, pitches: ['4-Seam', 'Slider', 'Curve', 'Cutter', 'Change'] },
  { name: 'Corbin Burnes', team: 'BAL', ovr: 86, pitches: ['Cutter', 'Curve', 'Sinker', 'Changeup'] },
  { name: 'Dylan Cease', team: 'SD', ovr: 84, pitches: ['4-Seam', 'Slider', 'Curve', 'Changeup'] },
  { name: 'Logan Webb', team: 'SF', ovr: 85, pitches: ['Sinker', 'Slider', 'Changeup', 'Curve'] },
  { name: 'Sonny Gray', team: 'STL', ovr: 83, pitches: ['4-Seam', 'Slider', 'Curve', 'Changeup'] },
  { name: 'Chris Sale', team: 'ATL', ovr: 86, pitches: ['4-Seam', 'Slider', 'Changeup'] },
];

function generatePairs(pitches: string[], seed: number): TunnelPair[] {
  const pairs: TunnelPair[] = [];
  for (let i = 0; i < pitches.length; i++) {
    for (let j = i + 1; j < pitches.length; j++) {
      const ts = 35 + ((seed * 7 + i * 11 + j * 17) % 55);
      const tunnelDist = Math.round((10 - ts * 0.08) * 10) / 10;
      const plateDist = tunnelDist + 3 + ((seed + i + j) % 8);
      const deception = Math.round(ts * 0.9 + ((seed + j) % 10));
      const whiff = 18 + ((seed * 3 + i * j) % 22);
      const rv = Math.round((-5 + (ts / 10) + ((seed + i * 3) % 5) - 3) * 10) / 10;
      pairs.push({
        pitch1: pitches[i],
        pitch2: pitches[j],
        tunnelScore: ts,
        tunnelDistance: tunnelDist,
        plateDistance: Math.round(plateDist * 10) / 10,
        effectiveDeception: Math.min(deception, 100),
        whiffRateCombo: whiff,
        runValuePer100: rv,
      });
    }
  }
  return pairs;
}

export function generateDemoTunnelMatrix(): PitcherTunnelProfile[] {
  return PITCHERS.map((p, i) => {
    const pairs = generatePairs(p.pitches, i + 10);
    const avgTs = Math.round(pairs.reduce((s, pr) => s + pr.tunnelScore, 0) / pairs.length);
    const bestP = pairs.reduce((a, b) => a.tunnelScore > b.tunnelScore ? a : b, pairs[0]);
    const worstP = pairs.reduce((a, b) => a.tunnelScore < b.tunnelScore ? a : b, pairs[0]);
    return {
      id: `tm-${i}`,
      name: p.name,
      team: p.team,
      pos: 'SP',
      overall: p.ovr,
      pitches: p.pitches,
      overallTunnelGrade: avgTs + ((i * 3) % 12) - 3,
      bestPair: `${bestP.pitch1}→${bestP.pitch2}`,
      worstPair: `${worstP.pitch1}→${worstP.pitch2}`,
      matrix: pairs,
      avgTunnelScore: avgTs,
      notes: avgTs >= 65 ? 'Elite pitch tunneling. Pitch pairs appear nearly identical through the tunnel point.' :
             avgTs >= 50 ? 'Good tunneling. Several effective deceptive combinations.' :
             'Below-average tunneling. Pitch pairs are distinguishable early.',
    };
  });
}
