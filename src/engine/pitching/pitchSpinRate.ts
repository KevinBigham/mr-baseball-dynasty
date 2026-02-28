// Pitch Spin Rate Analysis — detailed spin metrics for each pitch type
// Mr. Baseball Dynasty

export type SpinDirection = 'gyro' | 'backspin' | 'topspin' | 'sidespin' | 'mixed';

export interface SpinMetrics {
  pitchType: string;
  avgRPM: number;
  maxRPM: number;
  minRPM: number;
  spinAxis: number; // degrees 0-360
  spinDirection: SpinDirection;
  spinEfficiency: number; // 0-100%
  activeSpinPct: number;
  inducedVertBreak: number; // inches
  horizontalBreak: number; // inches
  whiffPerSwing: number;
  usage: number;
}

export interface SpinTrend {
  month: string;
  avgRPM: number;
  whiffRate: number;
}

export interface PitcherSpinProfile {
  pitcherId: number;
  name: string;
  throws: 'L' | 'R';
  pitches: SpinMetrics[];
  trends: SpinTrend[];
  spinAboveAvg: boolean;
  eliteSpinner: boolean;
}

export function generateDemoSpinRate(): PitcherSpinProfile[] {
  const pitchers = [
    { name: 'Jake Morrison', hand: 'R' as const },
    { name: 'Carlos Delgado', hand: 'L' as const },
    { name: 'Tyler Blackburn', hand: 'R' as const },
    { name: 'Sam Whitfield', hand: 'R' as const },
    { name: 'Daisuke Ito', hand: 'L' as const },
    { name: 'Marcus Young', hand: 'R' as const },
  ];

  const pitchTypes = ['4-Seam FB', 'Slider', 'Curveball', 'Changeup', 'Cutter'];
  const months = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];
  const dirs: SpinDirection[] = ['backspin', 'sidespin', 'topspin', 'mixed', 'gyro'];

  return pitchers.map((p, i) => {
    const pitches: SpinMetrics[] = pitchTypes.slice(0, 3 + Math.floor(Math.random() * 2)).map((pt, j) => {
      const baseRPM = pt.includes('FB') ? 2200 + Math.floor(Math.random() * 400)
        : pt === 'Curveball' ? 2400 + Math.floor(Math.random() * 400)
        : 1800 + Math.floor(Math.random() * 500);
      return {
        pitchType: pt,
        avgRPM: baseRPM,
        maxRPM: baseRPM + Math.floor(Math.random() * 200),
        minRPM: baseRPM - Math.floor(Math.random() * 200),
        spinAxis: Math.floor(Math.random() * 360),
        spinDirection: dirs[j % dirs.length],
        spinEfficiency: 55 + Math.floor(Math.random() * 40),
        activeSpinPct: 60 + Math.floor(Math.random() * 35),
        inducedVertBreak: +(5 + Math.random() * 15).toFixed(1),
        horizontalBreak: +(-10 + Math.random() * 20).toFixed(1),
        whiffPerSwing: +(15 + Math.random() * 25).toFixed(1),
        usage: +(10 + Math.random() * 40).toFixed(1),
      };
    });

    const trends: SpinTrend[] = months.map(m => ({
      month: m,
      avgRPM: 2100 + Math.floor(Math.random() * 300),
      whiffRate: +(20 + Math.random() * 15).toFixed(1),
    }));

    const avgSpin = pitches.reduce((s, p) => s + p.avgRPM, 0) / pitches.length;

    return {
      pitcherId: 7000 + i,
      name: p.name,
      throws: p.hand,
      pitches,
      trends,
      spinAboveAvg: avgSpin > 2300,
      eliteSpinner: avgSpin > 2500,
    };
  });
}
