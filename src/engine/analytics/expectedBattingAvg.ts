/**
 * expectedBattingAvg.ts – Expected Batting Average (xBA) Engine
 *
 * Bloomberg-terminal-style expected batting average analysis based on
 * exit velocity, launch angle, and sprint speed. Compares actual BA
 * to expected BA to identify over/underperformers. All demo data.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type LuckLevel = 'very_lucky' | 'lucky' | 'neutral' | 'unlucky' | 'very_unlucky';

export interface BattedBallBucket {
  exitVeloRange: string;     // e.g. "95-100 mph"
  launchAngleRange: string;  // e.g. "10-25°"
  count: number;
  actualBA: number;
  expectedBA: number;
  delta: number;             // actual - expected
}

export interface XBAProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  actualBA: number;
  expectedBA: number;
  delta: number;             // actual - expected (positive = lucky)
  luckLevel: LuckLevel;
  avgExitVelo: number;
  avgLaunchAngle: number;
  hardHitPct: number;        // % at 95+ mph
  barrelPct: number;         // % barreled
  sprintSpeed: number;       // ft/s
  buckets: BattedBallBucket[];
  notes: string;
}

// ── Display Map ────────────────────────────────────────────────────────────

export const LUCK_DISPLAY: Record<LuckLevel, { label: string; color: string }> = {
  very_lucky:   { label: 'Very Lucky',   color: '#22c55e' },
  lucky:        { label: 'Lucky',        color: '#4ade80' },
  neutral:      { label: 'Neutral',      color: '#f59e0b' },
  unlucky:      { label: 'Unlucky',      color: '#f97316' },
  very_unlucky: { label: 'Very Unlucky', color: '#ef4444' },
};

function luckFromDelta(delta: number): LuckLevel {
  if (delta >= 0.030) return 'very_lucky';
  if (delta >= 0.010) return 'lucky';
  if (delta > -0.010) return 'neutral';
  if (delta > -0.030) return 'unlucky';
  return 'very_unlucky';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface XBASummary {
  totalPlayers: number;
  luckiestPlayer: string;
  unluckiestPlayer: string;
  avgDelta: string;
  bestHardHit: string;
  bestBarrel: string;
}

export function getXBASummary(profiles: XBAProfile[]): XBASummary {
  const sorted = [...profiles].sort((a, b) => b.delta - a.delta);
  const luckiest = sorted[0];
  const unluckiest = sorted[sorted.length - 1];
  const avgDelta = profiles.reduce((s, p) => s + p.delta, 0) / profiles.length;
  const bestHardHit = [...profiles].sort((a, b) => b.hardHitPct - a.hardHitPct)[0];
  const bestBarrel = [...profiles].sort((a, b) => b.barrelPct - a.barrelPct)[0];

  return {
    totalPlayers: profiles.length,
    luckiestPlayer: `${luckiest.name} (+${(luckiest.delta * 1000).toFixed(0)})`,
    unluckiestPlayer: `${unluckiest.name} (${(unluckiest.delta * 1000).toFixed(0)})`,
    avgDelta: (avgDelta >= 0 ? '+' : '') + (avgDelta * 1000).toFixed(1),
    bestHardHit: `${bestHardHit.name} (${bestHardHit.hardHitPct}%)`,
    bestBarrel: `${bestBarrel.name} (${bestBarrel.barrelPct}%)`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const HITTERS = [
  { name: 'Aaron Judge',     team: 'NYY', pos: 'CF',  ba: .267, ev: 95.8, la: 14.2, hh: 58.4, brl: 22.8, spd: 27.0 },
  { name: 'Shohei Ohtani',  team: 'LAD', pos: 'DH',  ba: .304, ev: 93.6, la: 12.8, hh: 52.1, brl: 18.5, spd: 28.2 },
  { name: 'Ronald Acuna Jr', team: 'ATL', pos: 'RF',  ba: .337, ev: 91.2, la: 11.5, hh: 45.8, brl: 14.2, spd: 30.1 },
  { name: 'Mookie Betts',   team: 'LAD', pos: '2B',  ba: .307, ev: 90.8, la: 13.6, hh: 42.4, brl: 12.6, spd: 27.8 },
  { name: 'Juan Soto',      team: 'NYY', pos: 'RF',  ba: .288, ev: 92.4, la: 13.0, hh: 48.6, brl: 16.4, spd: 26.2 },
  { name: 'Bobby Witt Jr',  team: 'KC',  pos: 'SS',  ba: .332, ev: 90.2, la: 10.8, hh: 40.2, brl: 10.8, spd: 30.4 },
  { name: 'Freddie Freeman', team: 'LAD', pos: '1B', ba: .331, ev: 91.6, la: 14.8, hh: 44.2, brl: 13.8, spd: 26.8 },
  { name: 'Corey Seager',   team: 'TEX', pos: 'SS',  ba: .327, ev: 93.2, la: 15.2, hh: 50.4, brl: 17.2, spd: 26.0 },
  { name: 'Yordan Alvarez', team: 'HOU', pos: 'DH',  ba: .293, ev: 94.8, la: 16.4, hh: 55.2, brl: 20.6, spd: 25.4 },
  { name: 'Marcus Semien',  team: 'TEX', pos: '2B',  ba: .268, ev: 89.4, la: 12.2, hh: 38.6, brl: 9.8,  spd: 27.6 },
];

function makeBuckets(seed: number, avgEV: number): BattedBallBucket[] {
  const ranges: [string, string][] = [
    ['<85 mph', '<0°'],
    ['85-90 mph', '0-10°'],
    ['90-95 mph', '10-20°'],
    ['95-100 mph', '20-30°'],
    ['100+ mph', '25-35°'],
  ];

  return ranges.map(([ev, la], i) => {
    const count = 30 + ((seed * 7 + i * 13) % 40);
    const base = 0.180 + i * 0.060 + (avgEV > 92 ? 0.020 : 0);
    const expectedBA = Math.round(base * 1000) / 1000;
    const noise = ((seed * 3 + i * 17) % 60 - 30) / 1000;
    const actualBA = Math.round((expectedBA + noise) * 1000) / 1000;
    return {
      exitVeloRange: ev,
      launchAngleRange: la,
      count,
      actualBA: Math.max(0, actualBA),
      expectedBA,
      delta: Math.round((actualBA - expectedBA) * 1000) / 1000,
    };
  });
}

export function generateDemoXBA(): XBAProfile[] {
  return HITTERS.map((h, i) => {
    const xba = h.ba + ((i * 7 + 3) % 5 - 2) * 0.015 - 0.005;
    const expectedBA = Math.round(xba * 1000) / 1000;
    const delta = Math.round((h.ba - expectedBA) * 1000) / 1000;
    const buckets = makeBuckets(i * 11 + 5, h.ev);

    return {
      id: `xba-${i}`,
      name: h.name,
      team: h.team,
      position: h.pos,
      actualBA: h.ba,
      expectedBA,
      delta,
      luckLevel: luckFromDelta(delta),
      avgExitVelo: h.ev,
      avgLaunchAngle: h.la,
      hardHitPct: h.hh,
      barrelPct: h.brl,
      sprintSpeed: h.spd,
      buckets,
      notes: delta >= 0.020
        ? `${h.name} is significantly outperforming expected BA. BABIP regression likely.`
        : delta <= -0.020
        ? `${h.name} is underperforming expected BA. Bounce-back candidate based on quality of contact.`
        : `${h.name} is performing close to expected levels. Sustainable production.`,
    };
  });
}
