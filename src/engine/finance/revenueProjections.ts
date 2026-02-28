/**
 * Revenue Projections — Mr. Baseball Dynasty (Wave 54)
 *
 * Projects future team revenues based on performance, market size,
 * and attendance trends. Breaks down by revenue stream with growth
 * rates and confidence intervals.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type RevenueStream =
  | 'gate'
  | 'broadcast'
  | 'merchandise'
  | 'sponsorship'
  | 'concessions'
  | 'luxury_suites'
  | 'revenue_sharing';

export interface ProjectionYear {
  season: number;
  projected: number;   // millions
  actual?: number;     // millions (only for past seasons)
  delta?: number;      // actual - projected
}

export interface StreamProjection {
  stream: RevenueStream;
  current: number;     // millions
  projections: ProjectionYear[];
  growthRate: number;  // pct per year, can be negative
  confidence: number;  // 0-100 pct
}

export interface RevenueProjectionData {
  teamId: number;
  teamName: string;
  totalCurrent: number;
  totalProjected: number;  // sum of projected for next season
  streams: StreamProjection[];
  marketRank: number;      // 1-30
  attendanceAvg: number;   // avg per game
}

// ── Constants ────────────────────────────────────────────────────────────────

export const STREAM_LABELS: Record<RevenueStream, string> = {
  gate: 'Gate Revenue',
  broadcast: 'Broadcast / Media',
  merchandise: 'Merchandise',
  sponsorship: 'Sponsorships',
  concessions: 'Concessions',
  luxury_suites: 'Luxury Suites',
  revenue_sharing: 'Revenue Sharing',
};

export const STREAM_COLORS: Record<RevenueStream, string> = {
  gate: '#f59e0b',
  broadcast: '#3b82f6',
  merchandise: '#22c55e',
  sponsorship: '#a855f7',
  concessions: '#f97316',
  luxury_suites: '#06b6d4',
  revenue_sharing: '#94a3b8',
};

const STREAMS: RevenueStream[] = [
  'gate',
  'broadcast',
  'merchandise',
  'sponsorship',
  'concessions',
  'luxury_suites',
  'revenue_sharing',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function roundTo(val: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

// ── Demo data generation ─────────────────────────────────────────────────────

interface DemoTeam {
  id: number;
  name: string;
  market: number;     // 1.0 = avg market
  attendance: number; // avg per game
  winning: boolean;
}

const DEMO_TEAMS: DemoTeam[] = [
  { id: 1, name: 'New York Metros',     market: 1.45, attendance: 38200, winning: true },
  { id: 2, name: 'Los Angeles Stars',   market: 1.35, attendance: 41500, winning: true },
  { id: 3, name: 'Chicago Windies',     market: 1.20, attendance: 32800, winning: false },
  { id: 4, name: 'Tampa Bay Rays',      market: 0.70, attendance: 18500, winning: true },
  { id: 5, name: 'Kansas City Royals',  market: 0.65, attendance: 21200, winning: false },
];

function generateTeamProjections(team: DemoTeam): RevenueProjectionData {
  const currentSeason = 2026;
  const projectionYears = 5;

  // Base revenue ranges per stream (millions, for average market)
  const baseRanges: Record<RevenueStream, [number, number]> = {
    gate:            [50, 90],
    broadcast:       [60, 120],
    merchandise:     [15, 40],
    sponsorship:     [20, 50],
    concessions:     [18, 35],
    luxury_suites:   [10, 30],
    revenue_sharing: [5, 25],
  };

  // Revenue sharing is inverse — small markets get more
  const revShareMod = team.market < 1.0 ? (2.0 - team.market) : (0.5 / team.market);

  const streams: StreamProjection[] = STREAMS.map(stream => {
    const [lo, hi] = baseRanges[stream];
    const marketMod = stream === 'revenue_sharing' ? revShareMod : team.market;
    const winMod = team.winning ? 1.1 : 0.9;
    const current = roundTo(rand(lo, hi) * marketMod * winMod, 1);

    // Growth rate: broadcast growing fast, gate flat, etc.
    const baseGrowth: Record<RevenueStream, number> = {
      gate: 1.5,
      broadcast: 4.2,
      merchandise: 2.8,
      sponsorship: 3.5,
      concessions: 1.8,
      luxury_suites: 2.2,
      revenue_sharing: -0.5,
    };
    const growthRate = roundTo(
      baseGrowth[stream] + rand(-1.5, 1.5) + (team.winning ? 0.8 : -0.5),
      1,
    );

    // Confidence: broadcast deals locked in = high, gate = variable
    const baseConfidence: Record<RevenueStream, number> = {
      gate: 65,
      broadcast: 90,
      merchandise: 55,
      sponsorship: 75,
      concessions: 70,
      luxury_suites: 85,
      revenue_sharing: 80,
    };
    const confidence = Math.round(
      Math.max(30, Math.min(98, baseConfidence[stream] + rand(-10, 10))),
    );

    const projections: ProjectionYear[] = [];

    // Past season (has actual)
    const pastProjected = roundTo(current * (1 - growthRate / 100), 1);
    const pastActual = roundTo(pastProjected + rand(-3, 3), 1);
    projections.push({
      season: currentSeason - 1,
      projected: pastProjected,
      actual: pastActual,
      delta: roundTo(pastActual - pastProjected, 1),
    });

    // Current season
    projections.push({
      season: currentSeason,
      projected: current,
    });

    // Future seasons
    for (let y = 1; y <= projectionYears; y++) {
      const projected = roundTo(current * Math.pow(1 + growthRate / 100, y), 1);
      projections.push({ season: currentSeason + y, projected });
    }

    return { stream, current, projections, growthRate, confidence };
  });

  const totalCurrent = roundTo(streams.reduce((s, st) => s + st.current, 0), 1);
  const nextSeasonProjections = streams.map(st => {
    const next = st.projections.find(p => p.season === currentSeason + 1);
    return next ? next.projected : st.current;
  });
  const totalProjected = roundTo(nextSeasonProjections.reduce((s, v) => s + v, 0), 1);

  return {
    teamId: team.id,
    teamName: team.name,
    totalCurrent,
    totalProjected,
    streams,
    marketRank: Math.round(31 - team.market * 20),
    attendanceAvg: team.attendance,
  };
}

export function generateDemoRevenueProjections(): RevenueProjectionData[] {
  return DEMO_TEAMS.map(generateTeamProjections);
}
