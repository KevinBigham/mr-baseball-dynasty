/**
 * Team Payroll History
 *
 * Historical payroll data across seasons showing spending trends,
 * luxury tax status, competitive balance tax obligations,
 * and current-season payroll category breakdowns.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PayrollSeason {
  season: number;
  opening: number;         // $M opening-day payroll
  midseason: number;       // $M midseason payroll
  final: number;           // $M end-of-season payroll
  luxuryTaxPayable: number; // $M luxury tax paid
  competitiveBalanceTax: boolean;
}

export interface PayrollCategory {
  label: string;
  amount: number;          // $M
  pctOfTotal: number;      // 0-100
}

export interface TeamPayrollRecord {
  teamId: number;
  teamName: string;
  abbr: string;
  seasons: PayrollSeason[];
  currentBreakdown: PayrollCategory[];
  leagueRank: number;      // 1-30
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPayrollTrend(record: TeamPayrollRecord): 'rising' | 'flat' | 'falling' {
  const ss = record.seasons;
  if (ss.length < 2) return 'flat';
  const recent = ss[0].final;
  const prior = ss[ss.length - 1].final;
  const delta = recent - prior;
  if (delta > 20) return 'rising';
  if (delta < -20) return 'falling';
  return 'flat';
}

export function getSparkline(record: TeamPayrollRecord): string {
  const chars = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];
  const vals = record.seasons.map(s => s.final);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return vals.map(v => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join('');
}

export const TREND_DISPLAY: Record<string, { label: string; color: string }> = {
  rising:  { label: 'RISING',  color: '#22c55e' },
  flat:    { label: 'FLAT',    color: '#f59e0b' },
  falling: { label: 'FALLING', color: '#ef4444' },
};

// ─── Demo data ──────────────────────────────────────────────────────────────

interface TeamSeed {
  name: string;
  abbr: string;
  rank: number;
  baseFinal: number;
  growth: number; // annual growth rate $M
  categories: Array<{ label: string; pct: number }>;
}

const TEAMS: TeamSeed[] = [
  {
    name: 'New York Mets', abbr: 'NYM', rank: 1, baseFinal: 318, growth: 14,
    categories: [
      { label: 'Starting Pitching', pct: 28 },
      { label: 'Position Players', pct: 38 },
      { label: 'Bullpen', pct: 12 },
      { label: 'Bench', pct: 8 },
      { label: 'DL / Retained', pct: 10 },
      { label: 'Buyouts / Dead Money', pct: 4 },
    ],
  },
  {
    name: 'Los Angeles Dodgers', abbr: 'LAD', rank: 2, baseFinal: 298, growth: 12,
    categories: [
      { label: 'Starting Pitching', pct: 30 },
      { label: 'Position Players', pct: 36 },
      { label: 'Bullpen', pct: 14 },
      { label: 'Bench', pct: 7 },
      { label: 'DL / Retained', pct: 8 },
      { label: 'Buyouts / Dead Money', pct: 5 },
    ],
  },
  {
    name: 'New York Yankees', abbr: 'NYY', rank: 3, baseFinal: 285, growth: 10,
    categories: [
      { label: 'Starting Pitching', pct: 26 },
      { label: 'Position Players', pct: 40 },
      { label: 'Bullpen', pct: 13 },
      { label: 'Bench', pct: 6 },
      { label: 'DL / Retained', pct: 9 },
      { label: 'Buyouts / Dead Money', pct: 6 },
    ],
  },
  {
    name: 'Philadelphia Phillies', abbr: 'PHI', rank: 4, baseFinal: 262, growth: 8,
    categories: [
      { label: 'Starting Pitching', pct: 24 },
      { label: 'Position Players', pct: 42 },
      { label: 'Bullpen', pct: 14 },
      { label: 'Bench', pct: 8 },
      { label: 'DL / Retained', pct: 7 },
      { label: 'Buyouts / Dead Money', pct: 5 },
    ],
  },
  {
    name: 'Atlanta Braves', abbr: 'ATL', rank: 6, baseFinal: 248, growth: 6,
    categories: [
      { label: 'Starting Pitching', pct: 22 },
      { label: 'Position Players', pct: 44 },
      { label: 'Bullpen', pct: 12 },
      { label: 'Bench', pct: 9 },
      { label: 'DL / Retained', pct: 8 },
      { label: 'Buyouts / Dead Money', pct: 5 },
    ],
  },
  {
    name: 'San Diego Padres', abbr: 'SD', rank: 7, baseFinal: 236, growth: 4,
    categories: [
      { label: 'Starting Pitching', pct: 26 },
      { label: 'Position Players', pct: 38 },
      { label: 'Bullpen', pct: 14 },
      { label: 'Bench', pct: 8 },
      { label: 'DL / Retained', pct: 10 },
      { label: 'Buyouts / Dead Money', pct: 4 },
    ],
  },
  {
    name: 'Houston Astros', abbr: 'HOU', rank: 8, baseFinal: 244, growth: 5,
    categories: [
      { label: 'Starting Pitching', pct: 25 },
      { label: 'Position Players', pct: 40 },
      { label: 'Bullpen', pct: 13 },
      { label: 'Bench', pct: 7 },
      { label: 'DL / Retained', pct: 9 },
      { label: 'Buyouts / Dead Money', pct: 6 },
    ],
  },
  {
    name: 'Oakland Athletics', abbr: 'OAK', rank: 30, baseFinal: 58, growth: -2,
    categories: [
      { label: 'Starting Pitching', pct: 20 },
      { label: 'Position Players', pct: 46 },
      { label: 'Bullpen', pct: 16 },
      { label: 'Bench', pct: 10 },
      { label: 'DL / Retained', pct: 6 },
      { label: 'Buyouts / Dead Money', pct: 2 },
    ],
  },
];

function makeSeason(baseFinal: number, growth: number, yearOffset: number): PayrollSeason {
  const season = 2026 - yearOffset;
  const finalPay = Math.round(baseFinal - growth * yearOffset);
  const opening = Math.round(finalPay * 0.92);
  const midseason = Math.round(finalPay * 0.97);
  const threshold = 237;
  const overThreshold = finalPay > threshold;
  const luxTax = overThreshold ? Math.round((finalPay - threshold) * 0.2 * 10) / 10 : 0;
  return {
    season,
    opening,
    midseason,
    final: finalPay,
    luxuryTaxPayable: luxTax,
    competitiveBalanceTax: overThreshold,
  };
}

export function generateDemoTeamPayrollHistory(): TeamPayrollRecord[] {
  return TEAMS.map((t, i) => {
    const seasons: PayrollSeason[] = [];
    for (let y = 0; y < 6; y++) {
      seasons.push(makeSeason(t.baseFinal, t.growth, y));
    }
    const currentFinal = seasons[0].final;
    const breakdown: PayrollCategory[] = t.categories.map(c => ({
      label: c.label,
      amount: Math.round(currentFinal * c.pct / 100 * 10) / 10,
      pctOfTotal: c.pct,
    }));
    return {
      teamId: i,
      teamName: t.name,
      abbr: t.abbr,
      seasons,
      currentBreakdown: breakdown,
      leagueRank: t.rank,
    };
  });
}
