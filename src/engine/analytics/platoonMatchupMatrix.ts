// Platoon Matchup Matrix — deep platoon split analysis for lineup optimization
// Mr. Baseball Dynasty

export type HandSplit = 'vs_LHP' | 'vs_RHP';
export type SplitMetric = 'avg' | 'obp' | 'slg' | 'ops' | 'wRC_plus' | 'iso' | 'babip' | 'k_pct' | 'bb_pct';

export interface PlatoonSplit {
  hand: HandSplit;
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  wRC_plus: number;
  iso: number;
  babip: number;
  kPct: number;
  bbPct: number;
}

export interface PlatoonAdvantagePlayer {
  playerId: number;
  name: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  splits: PlatoonSplit[];
  platoonDelta: number; // OPS difference vs weak side
  recommendation: 'everyday' | 'platoon_strong' | 'platoon_weak' | 'bench';
  optimalRole: string;
}

export function generateDemoPlatoonMatrix(): PlatoonAdvantagePlayer[] {
  const names = [
    'Marcus Webb', 'Tyler Sanchez', 'DJ Fletcher', 'Corey Park',
    'Bryce Yamamoto', 'Austin Mills', 'Jake Herrera', 'Tommy Chen',
    'Devon Reyes', 'Ryan Kowalski', 'Chris Tanaka', 'Brandon Pham',
  ];
  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', '1B', 'OF', 'OF'];
  const batsOpts: Array<'L' | 'R' | 'S'> = ['L', 'R', 'S'];

  return names.map((name, i) => {
    const bats = batsOpts[i % 3];
    const baseAvg = 0.230 + Math.random() * 0.060;
    const splitDelta = (Math.random() - 0.3) * 0.080;

    const makeSplit = (hand: HandSplit, delta: number): PlatoonSplit => {
      const avg = Math.max(0.150, baseAvg + delta);
      const obp = avg + 0.060 + Math.random() * 0.040;
      const slg = avg + 0.120 + Math.random() * 0.100;
      return {
        hand,
        pa: 150 + Math.floor(Math.random() * 250),
        avg: +avg.toFixed(3),
        obp: +obp.toFixed(3),
        slg: +slg.toFixed(3),
        ops: +(obp + slg).toFixed(3),
        wRC_plus: 80 + Math.floor(Math.random() * 60),
        iso: +(slg - avg).toFixed(3),
        babip: +(0.270 + Math.random() * 0.060).toFixed(3),
        kPct: +(15 + Math.random() * 15).toFixed(1),
        bbPct: +(5 + Math.random() * 8).toFixed(1),
      };
    };

    const vsL = makeSplit('vs_LHP', bats === 'L' ? -splitDelta : splitDelta);
    const vsR = makeSplit('vs_RHP', bats === 'L' ? splitDelta : -splitDelta);
    const delta = Math.abs(vsL.ops - vsR.ops);

    let recommendation: PlatoonAdvantagePlayer['recommendation'] = 'everyday';
    if (delta > 0.120) recommendation = 'platoon_strong';
    else if (delta > 0.080) recommendation = 'platoon_weak';
    if (vsL.ops < 0.580 && vsR.ops < 0.580) recommendation = 'bench';

    return {
      playerId: 5000 + i,
      name,
      position: positions[i],
      bats,
      splits: [vsL, vsR],
      platoonDelta: +delta.toFixed(3),
      recommendation,
      optimalRole: recommendation === 'everyday' ? 'Full-time starter' :
        recommendation === 'platoon_strong' ? `Start vs ${vsL.ops > vsR.ops ? 'LHP' : 'RHP'}` :
        recommendation === 'platoon_weak' ? 'Matchup-dependent' : 'Bench bat',
    };
  });
}
