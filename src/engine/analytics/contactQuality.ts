/**
 * contactQuality.ts – Contact quality & batted ball analysis
 *
 * Tracks exit velocity, launch angle, hard-hit rate, barrel rate,
 * expected stats (xBA, xSLG, xwOBA), and quality-of-contact tiers
 * for each hitter.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactGrade = 'elite' | 'plus' | 'average' | 'below' | 'poor';

export interface BattedBallBucket {
  type: string;         // 'Barrel', 'Solid', 'Flare/Burner', 'Poorly/Under', 'Poorly/Topped', 'Poorly/Weak'
  count: number;
  pct: number;
  avgEV: number;
  avgLA: number;
  xBA: number;
}

export interface ContactProfile {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  avgExitVelo: number;
  maxExitVelo: number;
  avgLaunchAngle: number;
  sweetSpotPct: number;       // 8-32 degree LA%
  hardHitPct: number;         // 95+ mph EV%
  barrelPct: number;
  barrelPerPA: number;
  xBA: number;
  xSLG: number;
  xwOBA: number;
  actualBA: number;
  actualSLG: number;
  actualwOBA: number;
  contactGrade: ContactGrade;
  buckets: BattedBallBucket[];
  notes: string;
}

export const CONTACT_DISPLAY: Record<ContactGrade, { label: string; color: string; emoji: string }> = {
  elite:   { label: 'Elite Contact', color: '#22c55e', emoji: '💥' },
  plus:    { label: 'Plus Contact',  color: '#4ade80', emoji: '🔥' },
  average: { label: 'Average',       color: '#f59e0b', emoji: '▬' },
  below:   { label: 'Below Avg',     color: '#f97316', emoji: '▼' },
  poor:    { label: 'Poor Contact',  color: '#ef4444', emoji: '⬇' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface ContactTeamSummary {
  teamAvgEV: number;
  teamHardHitPct: number;
  teamBarrelPct: number;
  teamXwOBA: number;
  eliteHitters: number;
  biggestOverperformer: string;
  biggestUnderperformer: string;
}

export function getContactTeamSummary(profiles: ContactProfile[]): ContactTeamSummary {
  const n = profiles.length;
  const avgEV = Math.round(profiles.reduce((s, p) => s + p.avgExitVelo, 0) / n * 10) / 10;
  const hardHit = Math.round(profiles.reduce((s, p) => s + p.hardHitPct, 0) / n * 10) / 10;
  const barrel = Math.round(profiles.reduce((s, p) => s + p.barrelPct, 0) / n * 10) / 10;
  const xwoba = Math.round(profiles.reduce((s, p) => s + p.xwOBA, 0) / n * 1000) / 1000;
  const elites = profiles.filter(p => p.contactGrade === 'elite').length;

  const diffs = profiles.map(p => ({
    name: p.name,
    diff: p.actualwOBA - p.xwOBA,
  }));
  diffs.sort((a, b) => b.diff - a.diff);

  return {
    teamAvgEV: avgEV,
    teamHardHitPct: hardHit,
    teamBarrelPct: barrel,
    teamXwOBA: xwoba,
    eliteHitters: elites,
    biggestOverperformer: diffs[0]?.name ?? '',
    biggestUnderperformer: diffs[diffs.length - 1]?.name ?? '',
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const HITTERS: Array<{ name: string; pos: string; team: string; ovr: number }> = [
  { name: 'Aaron Judge', pos: 'RF', team: 'NYY', ovr: 95 },
  { name: 'Shohei Ohtani', pos: 'DH', team: 'LAD', ovr: 97 },
  { name: 'Juan Soto', pos: 'LF', team: 'NYM', ovr: 93 },
  { name: 'Yordan Alvarez', pos: 'DH', team: 'HOU', ovr: 91 },
  { name: 'Ronald Acuña Jr.', pos: 'CF', team: 'ATL', ovr: 94 },
  { name: 'Mike Trout', pos: 'CF', team: 'LAA', ovr: 90 },
  { name: 'Kyle Schwarber', pos: 'LF', team: 'PHI', ovr: 84 },
  { name: 'Matt Olson', pos: '1B', team: 'ATL', ovr: 86 },
  { name: 'Pete Alonso', pos: '1B', team: 'NYM', ovr: 83 },
  { name: 'Mookie Betts', pos: 'SS', team: 'LAD', ovr: 92 },
  { name: 'Corey Seager', pos: 'SS', team: 'TEX', ovr: 88 },
  { name: 'Vladimir Guerrero Jr.', pos: '1B', team: 'TOR', ovr: 87 },
];

const BUCKET_TYPES = ['Barrel', 'Solid', 'Flare/Burner', 'Poorly/Under', 'Poorly/Topped', 'Poorly/Weak'];

function makeGrade(hardHit: number, barrel: number): ContactGrade {
  const score = hardHit * 0.6 + barrel * 2;
  if (score >= 40) return 'elite';
  if (score >= 32) return 'plus';
  if (score >= 22) return 'average';
  if (score >= 15) return 'below';
  return 'poor';
}

function makeBuckets(seed: number): BattedBallBucket[] {
  const barrelPct = 10 + ((seed * 7) % 12);
  const solidPct = 20 + ((seed * 3) % 10);
  const flarePct = 15 + ((seed * 11) % 8);
  const underPct = 15 + ((seed * 5) % 10);
  const toppedPct = 18 + ((seed * 9) % 8);
  const weakPct = 100 - barrelPct - solidPct - flarePct - underPct - toppedPct;
  const pcts = [barrelPct, solidPct, flarePct, underPct, toppedPct, weakPct];
  const evs = [103 + ((seed * 2) % 6), 95 + ((seed * 4) % 5), 82 + ((seed * 6) % 8), 88 + ((seed * 3) % 5), 78 + ((seed * 8) % 6), 72 + ((seed * 5) % 5)];
  const las = [26 + ((seed * 3) % 8), 18 + ((seed * 5) % 10), 8 + ((seed * 7) % 12), 42 + ((seed * 2) % 10), -12 + ((seed * 4) % 8), 15 + ((seed * 6) % 10)];
  const xbas = [0.700 + ((seed * 3) % 5) * 0.01, 0.450 + ((seed * 7) % 10) * 0.01, 0.280 + ((seed * 2) % 8) * 0.01, 0.100 + ((seed * 5) % 5) * 0.01, 0.150 + ((seed * 4) % 6) * 0.01, 0.050 + ((seed * 6) % 5) * 0.01];

  return BUCKET_TYPES.map((type, i) => ({
    type,
    count: 20 + ((seed + i * 7) % 40),
    pct: pcts[i],
    avgEV: evs[i],
    avgLA: las[i],
    xBA: Math.round(xbas[i] * 1000) / 1000,
  }));
}

export function generateDemoContactQuality(): ContactProfile[] {
  return HITTERS.map((h, i) => {
    const ev = 93.5 - i * 0.8 + ((i * 5) % 4) * 0.3;
    const maxEv = ev + 8 + ((i * 3) % 5);
    const la = 12 + ((i * 7) % 8) - ((i * 3) % 4);
    const sweet = 32 + ((i * 5) % 12) - (i > 6 ? 8 : 0);
    const hard = 52 - i * 2.5 + ((i * 3) % 8);
    const barrel = 16 - i * 1 + ((i * 7) % 5);
    const bppa = Math.round(barrel * 0.6 * 10) / 10;
    const xba = 0.280 - i * 0.008 + ((i * 3) % 5) * 0.005;
    const xslg = 0.560 - i * 0.018 + ((i * 7) % 6) * 0.01;
    const xwoba = 0.380 - i * 0.012 + ((i * 5) % 4) * 0.006;
    const luck = ((i * 7) % 10 - 5) * 0.008;
    return {
      id: `cq-${i}`,
      name: h.name,
      pos: h.pos,
      team: h.team,
      overall: h.ovr,
      avgExitVelo: Math.round(ev * 10) / 10,
      maxExitVelo: Math.round(maxEv * 10) / 10,
      avgLaunchAngle: Math.round(la * 10) / 10,
      sweetSpotPct: Math.round(sweet * 10) / 10,
      hardHitPct: Math.round(hard * 10) / 10,
      barrelPct: Math.round(barrel * 10) / 10,
      barrelPerPA: bppa,
      xBA: Math.round(xba * 1000) / 1000,
      xSLG: Math.round(xslg * 1000) / 1000,
      xwOBA: Math.round(xwoba * 1000) / 1000,
      actualBA: Math.round((xba + luck) * 1000) / 1000,
      actualSLG: Math.round((xslg + luck * 1.5) * 1000) / 1000,
      actualwOBA: Math.round((xwoba + luck) * 1000) / 1000,
      contactGrade: makeGrade(hard, barrel),
      buckets: makeBuckets(i),
      notes: hard >= 48 ? 'Elite exit velocities generate consistent damage. Top-tier quality of contact.' :
             hard >= 40 ? 'Plus hard-hit rates. Generates barrels at above-average clip.' :
             hard >= 35 ? 'Average contact quality. Solid but not spectacular batted ball data.' :
             'Below-average exit velocities. Relies on placement and speed rather than power.',
    };
  });
}
