// Arsenal Comparison — compare pitch arsenals between pitchers side-by-side
// Mr. Baseball Dynasty

export interface PitchProfile {
  pitchType: string;
  velo: number;
  usage: number;
  whiffRate: number;
  putaway: number;
  xwOBA: number;
  spin: number;
  vertBreak: number;
  horzBreak: number;
}

export interface ArsenalPlayer {
  pitcherId: number;
  name: string;
  throws: 'L' | 'R';
  role: 'SP' | 'RP';
  arsenal: PitchProfile[];
  arsenalScore: number; // 0-100
  bestPitch: string;
  avgVelo: number;
}

export function generateDemoArsenalComparison(): ArsenalPlayer[] {
  const pitchers = [
    { name: 'Jake Morrison', hand: 'R' as const, role: 'SP' as const },
    { name: 'Carlos Delgado', hand: 'L' as const, role: 'SP' as const },
    { name: 'Tyler Blackburn', hand: 'R' as const, role: 'SP' as const },
    { name: 'Sam Whitfield', hand: 'R' as const, role: 'RP' as const },
    { name: 'Daisuke Ito', hand: 'L' as const, role: 'RP' as const },
    { name: 'Marcus Young', hand: 'R' as const, role: 'SP' as const },
  ];

  const pitchTypes = ['4-Seam FB', 'Slider', 'Changeup', 'Curveball', 'Cutter', 'Sinker', 'Splitter'];

  return pitchers.map((p, i) => {
    const numPitches = p.role === 'SP' ? 4 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
    const selected = [...pitchTypes].sort(() => Math.random() - 0.5).slice(0, numPitches);
    if (!selected.some(t => t.includes('FB') || t === 'Sinker')) selected[0] = '4-Seam FB';

    let remaining = 100;
    const arsenal: PitchProfile[] = selected.map((pt, j) => {
      const usage = j === selected.length - 1 ? remaining : Math.floor(remaining * (0.2 + Math.random() * 0.4));
      remaining -= usage;
      const velo = pt.includes('FB') || pt === 'Sinker' ? 91 + Math.floor(Math.random() * 8) :
        pt === 'Slider' || pt === 'Cutter' ? 83 + Math.floor(Math.random() * 7) :
        78 + Math.floor(Math.random() * 8);

      return {
        pitchType: pt,
        velo,
        usage: Math.max(5, usage),
        whiffRate: +(15 + Math.random() * 25).toFixed(1),
        putaway: +(10 + Math.random() * 25).toFixed(1),
        xwOBA: +(0.250 + Math.random() * 0.150).toFixed(3),
        spin: 1800 + Math.floor(Math.random() * 800),
        vertBreak: +(3 + Math.random() * 15).toFixed(1),
        horzBreak: +(-10 + Math.random() * 20).toFixed(1),
      };
    });

    const bestPitch = [...arsenal].sort((a, b) => a.xwOBA - b.xwOBA)[0].pitchType;
    const avgVelo = +(arsenal.reduce((s, a) => s + a.velo * a.usage, 0) / arsenal.reduce((s, a) => s + a.usage, 0)).toFixed(1);
    const arsenalScore = Math.floor(60 + Math.random() * 35);

    return { pitcherId: 12000 + i, name: p.name, throws: p.hand, role: p.role, arsenal, arsenalScore, bestPitch, avgVelo };
  });
}
