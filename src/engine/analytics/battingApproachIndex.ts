/**
 * battingApproachIndex.ts – Batting Approach Index
 *
 * Measures a hitter's selectivity, aggressiveness, and approach quality.
 * Combines chase rate, zone contact, first-pitch swing tendencies, and
 * two-strike adjustments into a single approach index score.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ApproachGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export const APPROACH_DISPLAY: Record<ApproachGrade, { label: string; color: string }> = {
  elite:     { label: 'ELITE',     color: '#22c55e' },
  above_avg: { label: 'ABOVE AVG', color: '#3b82f6' },
  average:   { label: 'AVERAGE',   color: '#eab308' },
  below_avg: { label: 'BELOW AVG', color: '#f97316' },
  poor:      { label: 'POOR',      color: '#ef4444' },
};

export interface ApproachMetric {
  label: string;
  value: number;
  leagueAvg: number;
  percentile: number;
  description: string;
}

export interface BatterApproach {
  playerId: number;
  name: string;
  bats: 'L' | 'R' | 'S';
  approachIndex: number;
  grade: ApproachGrade;
  chaseRate: number;
  zoneContact: number;
  firstPitchSwingPct: number;
  twoStrikeApproach: number;
  metrics: ApproachMetric[];
  strength: string;
  weakness: string;
}

// ── Logic ──────────────────────────────────────────────────────────────────

export function getApproachGrade(index: number): ApproachGrade {
  if (index >= 80) return 'elite';
  if (index >= 65) return 'above_avg';
  if (index >= 45) return 'average';
  if (index >= 30) return 'below_avg';
  return 'poor';
}

export function getApproachSummary(batters: BatterApproach[]) {
  const n = batters.length;
  return {
    avgIndex: Math.round(batters.reduce((s, b) => s + b.approachIndex, 0) / n * 10) / 10,
    eliteCount: batters.filter(b => b.grade === 'elite').length,
    poorCount: batters.filter(b => b.grade === 'poor').length,
    avgChaseRate: Math.round(batters.reduce((s, b) => s + b.chaseRate, 0) / n * 10) / 10,
    avgZoneContact: Math.round(batters.reduce((s, b) => s + b.zoneContact, 0) / n * 10) / 10,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoBattingApproach(): BatterApproach[] {
  const raw = [
    {
      name: 'Juan Soto',          bats: 'L' as const, idx: 92, chase: 18.2, zone: 91.5, fps: 22.1, tsa: 88,
      str: 'Elite pitch recognition and walk rate', wk: 'Occasionally passive on hittable fastballs',
    },
    {
      name: 'Steven Kwan',        bats: 'L' as const, idx: 88, chase: 15.8, zone: 94.2, fps: 19.5, tsa: 85,
      str: 'Best zone contact rate in baseball', wk: 'Limited power output from passive approach',
    },
    {
      name: 'Shohei Ohtani',      bats: 'L' as const, idx: 74, chase: 24.1, zone: 88.3, fps: 32.4, tsa: 72,
      str: 'Aggressive on pitches in the zone', wk: 'Elevated chase rate on low breaking balls',
    },
    {
      name: 'Aaron Judge',        bats: 'R' as const, idx: 82, chase: 20.5, zone: 89.7, fps: 26.8, tsa: 80,
      str: 'Excellent zone awareness and discipline', wk: 'Susceptible to high fastballs out of zone',
    },
    {
      name: 'Freddie Freeman',    bats: 'L' as const, idx: 78, chase: 22.0, zone: 90.1, fps: 28.3, tsa: 76,
      str: 'Consistent approach across all counts', wk: 'Slightly elevated chase rate vs LHP',
    },
    {
      name: 'Bobby Witt Jr.',     bats: 'R' as const, idx: 55, chase: 30.5, zone: 85.2, fps: 38.2, tsa: 58,
      str: 'Makes hard contact on aggressive swings', wk: 'Very high chase rate on sliders away',
    },
    {
      name: 'Ronald Acuna Jr.',   bats: 'R' as const, idx: 68, chase: 26.3, zone: 87.1, fps: 34.0, tsa: 65,
      str: 'Dynamic approach with power/speed combo', wk: 'Swing decisions inconsistent after 0-2',
    },
    {
      name: 'Javy Baez',          bats: 'R' as const, idx: 22, chase: 40.2, zone: 78.5, fps: 44.1, tsa: 32,
      str: 'Can punish mistake pitches with authority', wk: 'League-worst chase rate and K tendency',
    },
    {
      name: 'Marcus Semien',      bats: 'R' as const, idx: 60, chase: 27.8, zone: 86.0, fps: 31.5, tsa: 62,
      str: 'Balanced approach in even counts', wk: 'Tends to expand zone when behind in count',
    },
    {
      name: 'Mookie Betts',       bats: 'R' as const, idx: 85, chase: 19.3, zone: 91.0, fps: 24.7, tsa: 83,
      str: 'Elite selectivity and count management', wk: 'Rarely tries to do damage on first pitch',
    },
    {
      name: 'Corey Seager',       bats: 'L' as const, idx: 70, chase: 25.0, zone: 88.0, fps: 30.0, tsa: 68,
      str: 'Excellent hitter-friendly count production', wk: 'Chase rate spikes in two-strike counts',
    },
    {
      name: 'Salvador Perez',     bats: 'R' as const, idx: 28, chase: 38.5, zone: 80.2, fps: 42.0, tsa: 35,
      str: 'Power on contact despite approach issues', wk: 'Swings at almost everything, low walks',
    },
  ];

  const leagueAvgs = { chase: 27.5, zone: 86.5, fps: 30.0, tsa: 60.0 };

  return raw.map((r, i) => {
    const grade = getApproachGrade(r.idx);
    const chasePct = Math.round((1 - r.chase / 50) * 100);
    const zonePct = Math.round((r.zone / 100) * 100);
    const fpsPct = Math.round((1 - r.fps / 55) * 100);
    const tsaPct = Math.round((r.tsa / 100) * 100);

    const metrics: ApproachMetric[] = [
      {
        label: 'Chase Rate',
        value: r.chase,
        leagueAvg: leagueAvgs.chase,
        percentile: chasePct,
        description: 'Swing % at pitches outside the zone (lower is better)',
      },
      {
        label: 'Zone Contact',
        value: r.zone,
        leagueAvg: leagueAvgs.zone,
        percentile: zonePct,
        description: 'Contact % on pitches inside the zone (higher is better)',
      },
      {
        label: '1st Pitch Swing%',
        value: r.fps,
        leagueAvg: leagueAvgs.fps,
        percentile: fpsPct,
        description: 'Percentage of first pitches swung at',
      },
      {
        label: '2-Strike Approach',
        value: r.tsa,
        leagueAvg: leagueAvgs.tsa,
        percentile: tsaPct,
        description: 'Approach quality score in two-strike counts (0-100)',
      },
    ];

    return {
      playerId: i,
      name: r.name,
      bats: r.bats,
      approachIndex: r.idx,
      grade,
      chaseRate: r.chase,
      zoneContact: r.zone,
      firstPitchSwingPct: r.fps,
      twoStrikeApproach: r.tsa,
      metrics,
      strength: r.str,
      weakness: r.wk,
    };
  });
}
