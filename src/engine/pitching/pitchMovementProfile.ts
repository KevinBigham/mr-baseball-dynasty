// Pitch Movement Profile — analyzes movement characteristics vs league averages
// Mr. Baseball Dynasty

export interface MovementData {
  pitchType: string;
  avgVelo: number;
  maxVelo: number;
  horzBreak: number;       // inches
  vertBreak: number;       // inches
  leagueAvgHorz: number;   // inches
  leagueAvgVert: number;   // inches
  armAngle: number;         // degrees
  extension: number;        // feet
  relHeight: number;        // feet
}

export interface PitcherMovementProfile {
  pitcherId: number;
  name: string;
  throws: 'L' | 'R';
  pitches: MovementData[];
  uniqueIndex: number;      // 0-100 composite uniqueness score
}

// ── League-average baselines ──────────────────────────────────────────────

const LEAGUE_AVG: Record<string, { horz: number; vert: number; velo: number }> = {
  '4-Seam FB':  { horz: -7.5,  vert: 16.0, velo: 93.8 },
  'Sinker':     { horz: -14.0, vert: 8.5,  velo: 93.0 },
  'Slider':     { horz: 3.5,   vert: 1.5,  velo: 85.5 },
  'Curveball':  { horz: 6.0,   vert: -6.5, velo: 79.5 },
  'Changeup':   { horz: -13.5, vert: 3.5,  velo: 85.0 },
  'Cutter':     { horz: -1.5,  vert: 8.5,  velo: 88.5 },
  'Sweeper':    { horz: 12.0,  vert: -2.0, velo: 81.0 },
  'Splitter':   { horz: -10.5, vert: 1.0,  velo: 86.5 },
};

// ── Demo data ─────────────────────────────────────────────────────────────

const r = (base: number, range: number) => +(base + (Math.random() - 0.5) * range).toFixed(1);

export function generateDemoPitchMovement(): PitcherMovementProfile[] {
  const pitchers: { name: string; hand: 'L' | 'R'; arsenal: string[] }[] = [
    { name: 'Jake Morrison',    hand: 'R', arsenal: ['4-Seam FB', 'Slider', 'Curveball', 'Changeup'] },
    { name: 'Carlos Delgado',   hand: 'L', arsenal: ['4-Seam FB', 'Sinker', 'Changeup', 'Cutter'] },
    { name: 'Tyler Blackburn',  hand: 'R', arsenal: ['Sinker', 'Slider', 'Sweeper', 'Splitter'] },
    { name: 'Sam Whitfield',    hand: 'R', arsenal: ['4-Seam FB', 'Cutter', 'Curveball'] },
    { name: 'Daisuke Ito',      hand: 'L', arsenal: ['4-Seam FB', 'Splitter', 'Slider', 'Curveball', 'Changeup'] },
    { name: 'Marcus Young',     hand: 'R', arsenal: ['Sinker', 'Sweeper', 'Changeup'] },
  ];

  return pitchers.map((p, i) => {
    const pitches: MovementData[] = p.arsenal.map(pt => {
      const avg = LEAGUE_AVG[pt] ?? { horz: 0, vert: 0, velo: 88 };
      const horzBreak = r(avg.horz, 8);
      const vertBreak = r(avg.vert, 7);
      const avgVelo = r(avg.velo, 6);
      return {
        pitchType: pt,
        avgVelo,
        maxVelo: +(avgVelo + 1.5 + Math.random() * 2.5).toFixed(1),
        horzBreak,
        vertBreak,
        leagueAvgHorz: avg.horz,
        leagueAvgVert: avg.vert,
        armAngle: r(p.hand === 'L' ? 42 : 48, 20),
        extension: r(6.3, 1.0),
        relHeight: r(p.hand === 'L' ? 5.8 : 6.0, 0.8),
      };
    });

    // Uniqueness index: how far the pitcher's movement deviates from league norms
    const totalDeviation = pitches.reduce((sum, pt) => {
      const hDelta = Math.abs(pt.horzBreak - pt.leagueAvgHorz);
      const vDelta = Math.abs(pt.vertBreak - pt.leagueAvgVert);
      return sum + hDelta + vDelta;
    }, 0);
    const uniqueIndex = Math.min(99, Math.round(totalDeviation / pitches.length * 4));

    return {
      pitcherId: 500 + i,
      name: p.name,
      throws: p.hand,
      pitches,
      uniqueIndex,
    };
  });
}
