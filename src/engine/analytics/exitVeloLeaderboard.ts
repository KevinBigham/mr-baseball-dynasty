/**
 * exitVeloLeaderboard.ts – Exit Velocity Leaderboard Engine
 *
 * Tracks batted ball exit velocity leaders and hard-hit metrics.
 * Ranks hitters by average exit velo, barrel%, hard-hit%, and
 * provides hit-quality distribution breakdowns with expected slugging.
 * All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type EVBucket = 'soft' | 'medium' | 'hard' | 'barrel';

export interface HitDistribution {
  bucket: EVBucket;
  count: number;
  pct: number;
  avgEV: number;
}

export interface EVLeader {
  playerId: string;
  name: string;
  position: string;
  avgExitVelo: number;
  maxExitVelo: number;
  barrelPct: number;
  hardHitPct: number;
  sweetSpotPct: number;
  distribution: HitDistribution[];
  xSLG: number;
  rank: number;
}

// ── Display Maps ───────────────────────────────────────────────────────────

export const BUCKET_DISPLAY: Record<EVBucket, { label: string; color: string }> = {
  soft:   { label: 'Soft',   color: '#94a3b8' },
  medium: { label: 'Medium', color: '#f59e0b' },
  hard:   { label: 'Hard',   color: '#f97316' },
  barrel: { label: 'Barrel', color: '#22c55e' },
};

export function getEVTier(avgEV: number): { label: string; color: string } {
  if (avgEV >= 93) return { label: 'Elite', color: '#22c55e' };
  if (avgEV >= 90) return { label: 'Plus', color: '#4ade80' };
  if (avgEV >= 88) return { label: 'Average', color: '#f59e0b' };
  if (avgEV >= 85) return { label: 'Below Avg', color: '#f97316' };
  return { label: 'Poor', color: '#ef4444' };
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface EVLeaderboardSummary {
  avgTeamEV: number;
  avgBarrelPct: number;
  avgHardHitPct: number;
  avgXSLG: number;
  topHitter: string;
  eliteCount: number;
}

export function getEVLeaderboardSummary(leaders: EVLeader[]): EVLeaderboardSummary {
  const n = leaders.length;
  const avgEV = Math.round(leaders.reduce((s, l) => s + l.avgExitVelo, 0) / n * 10) / 10;
  const avgBarrel = Math.round(leaders.reduce((s, l) => s + l.barrelPct, 0) / n * 10) / 10;
  const avgHH = Math.round(leaders.reduce((s, l) => s + l.hardHitPct, 0) / n * 10) / 10;
  const avgXslg = Math.round(leaders.reduce((s, l) => s + l.xSLG, 0) / n * 1000) / 1000;
  const elites = leaders.filter(l => l.avgExitVelo >= 93).length;
  return {
    avgTeamEV: avgEV,
    avgBarrelPct: avgBarrel,
    avgHardHitPct: avgHH,
    avgXSLG: avgXslg,
    topHitter: leaders[0]?.name ?? '',
    eliteCount: elites,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const HITTERS: Array<{ name: string; pos: string }> = [
  { name: 'Aaron Judge',             pos: 'RF' },
  { name: 'Giancarlo Stanton',      pos: 'DH' },
  { name: 'Shohei Ohtani',          pos: 'DH' },
  { name: 'Yordan Alvarez',         pos: 'LF' },
  { name: 'Pete Alonso',            pos: '1B' },
  { name: 'Kyle Schwarber',         pos: 'LF' },
  { name: 'Ronald Acuna Jr.',       pos: 'CF' },
  { name: 'Matt Olson',             pos: '1B' },
  { name: 'Juan Soto',              pos: 'LF' },
  { name: 'Vladimir Guerrero Jr.',  pos: '1B' },
  { name: 'Corey Seager',           pos: 'SS' },
  { name: 'Mookie Betts',           pos: 'SS' },
  { name: 'Mike Trout',             pos: 'CF' },
  { name: 'Marcell Ozuna',          pos: 'DH' },
  { name: 'Bryce Harper',           pos: '1B' },
];

function makeDistribution(seed: number): HitDistribution[] {
  const barrelPct = 12 + ((seed * 7) % 10);
  const hardPct = 28 + ((seed * 3) % 12);
  const medPct = 30 + ((seed * 5) % 8);
  const softPct = 100 - barrelPct - hardPct - medPct;

  const pcts = [softPct, medPct, hardPct, barrelPct];
  const evs = [
    72 + ((seed * 4) % 8),
    86 + ((seed * 6) % 5),
    97 + ((seed * 2) % 5),
    105 + ((seed * 3) % 6),
  ];
  const buckets: EVBucket[] = ['soft', 'medium', 'hard', 'barrel'];

  return buckets.map((bucket, i) => ({
    bucket,
    count: Math.round(pcts[i] * 3.5 + ((seed + i) % 15)),
    pct: pcts[i],
    avgEV: evs[i],
  }));
}

export function generateDemoExitVeloLeaders(): EVLeader[] {
  return HITTERS.map((h, i) => {
    const avgEV = 95.2 - i * 0.6 + ((i * 3) % 4) * 0.2;
    const maxEV = avgEV + 14 + ((i * 7) % 5) - 2;
    const barrelPct = 18.5 - i * 0.9 + ((i * 5) % 4) * 0.3;
    const hardHitPct = 55 - i * 2.2 + ((i * 3) % 6);
    const sweetSpotPct = 34 + ((i * 7) % 10) - (i > 8 ? 5 : 0);
    const xSLG = 0.580 - i * 0.02 + ((i * 5) % 5) * 0.008;

    return {
      playerId: `ev-${i}`,
      name: h.name,
      position: h.pos,
      avgExitVelo: Math.round(avgEV * 10) / 10,
      maxExitVelo: Math.round(maxEV * 10) / 10,
      barrelPct: Math.round(barrelPct * 10) / 10,
      hardHitPct: Math.round(hardHitPct * 10) / 10,
      sweetSpotPct: Math.round(sweetSpotPct * 10) / 10,
      distribution: makeDistribution(i),
      xSLG: Math.round(xSLG * 1000) / 1000,
      rank: i + 1,
    };
  });
}
