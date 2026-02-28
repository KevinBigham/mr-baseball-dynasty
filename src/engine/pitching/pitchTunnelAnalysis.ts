// Pitch Tunnel Analysis — measures how well pitches share a common tunnel point
// Mr. Baseball Dynasty

export interface TunnelPair {
  pitch1: string;
  pitch2: string;
  tunnelDistance: number; // inches at tunnel point (lower = better deception)
  plateSeparation: number; // inches at plate (higher = better)
  tunnelScore: number; // 0-100 composite
  deceptionGrade: 'elite' | 'plus' | 'average' | 'below_avg' | 'poor';
  whiffRateOnSequence: number;
  usage: number;
}

export interface PitcherTunnelProfile {
  pitcherId: number;
  name: string;
  throws: 'L' | 'R';
  pairs: TunnelPair[];
  overallTunnelScore: number;
  bestPair: string;
  worstPair: string;
  avgTunnelDist: number;
}

export function generateDemoPitchTunnel(): PitcherTunnelProfile[] {
  const pitchers = [
    { name: 'Jake Morrison', hand: 'R' as const, types: ['4-Seam', 'Slider', 'Changeup', 'Cutter'] },
    { name: 'Carlos Delgado', hand: 'L' as const, types: ['4-Seam', 'Curveball', 'Changeup'] },
    { name: 'Tyler Blackburn', hand: 'R' as const, types: ['Sinker', 'Slider', 'Changeup', 'Cutter'] },
    { name: 'Sam Whitfield', hand: 'R' as const, types: ['4-Seam', 'Slider', 'Curveball'] },
    { name: 'Daisuke Ito', hand: 'L' as const, types: ['4-Seam', 'Splitter', 'Slider'] },
  ];

  const grades: TunnelPair['deceptionGrade'][] = ['elite', 'plus', 'average', 'below_avg', 'poor'];

  return pitchers.map((p, pi) => {
    const pairs: TunnelPair[] = [];
    for (let i = 0; i < p.types.length; i++) {
      for (let j = i + 1; j < p.types.length; j++) {
        const tunnelDist = +(2 + Math.random() * 8).toFixed(1);
        const plateSep = +(8 + Math.random() * 16).toFixed(1);
        const score = Math.floor(Math.max(0, 100 - tunnelDist * 8 + plateSep * 1.5));
        const gradeIdx = score > 80 ? 0 : score > 65 ? 1 : score > 50 ? 2 : score > 35 ? 3 : 4;
        pairs.push({
          pitch1: p.types[i],
          pitch2: p.types[j],
          tunnelDistance: tunnelDist,
          plateSeparation: plateSep,
          tunnelScore: score,
          deceptionGrade: grades[gradeIdx],
          whiffRateOnSequence: +(15 + Math.random() * 25).toFixed(1),
          usage: +(5 + Math.random() * 20).toFixed(1),
        });
      }
    }

    const sorted = [...pairs].sort((a, b) => b.tunnelScore - a.tunnelScore);
    const avgDist = +(pairs.reduce((s, p) => s + p.tunnelDistance, 0) / pairs.length).toFixed(1);
    const overall = Math.floor(pairs.reduce((s, p) => s + p.tunnelScore, 0) / pairs.length);

    return {
      pitcherId: 10000 + pi,
      name: p.name,
      throws: p.hand,
      pairs,
      overallTunnelScore: overall,
      bestPair: `${sorted[0].pitch1}/${sorted[0].pitch2}`,
      worstPair: `${sorted[sorted.length - 1].pitch1}/${sorted[sorted.length - 1].pitch2}`,
      avgTunnelDist: avgDist,
    };
  });
}
