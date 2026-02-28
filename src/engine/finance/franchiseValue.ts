/**
 * franchiseValue.ts – Franchise Value Tracker
 *
 * Tracks franchise valuations, revenue, expenses, and year-over-year growth
 * for multiple teams. Breaks down revenue streams and operating income to
 * provide a financial health snapshot across the league.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface RevenueStream {
  source: string;
  amount: number;       // $M
  pctOfTotal: number;   // %
  yoyChange: number;    // % change year-over-year
}

export interface FranchiseFinancials {
  id: string;
  teamName: string;
  abbr: string;
  valuation: number;          // $M
  yoyGrowth: number;          // %
  revenue: number;            // $M
  expenses: number;           // $M
  operatingIncome: number;    // $M
  revenueStreams: RevenueStream[];
  marketRank: number;
  notes: string;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface FranchiseValueSummary {
  totalValuation: number;
  avgValuation: number;
  highestValued: { name: string; valuation: number };
  lowestValued: { name: string; valuation: number };
  avgGrowth: number;
}

export function getFranchiseValueSummary(teams: FranchiseFinancials[]): FranchiseValueSummary {
  const n = teams.length;
  const totalVal = Math.round(teams.reduce((s, t) => s + t.valuation, 0));
  const avgVal = Math.round(totalVal / n);
  const sorted = [...teams].sort((a, b) => b.valuation - a.valuation);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const avgGrowth = Math.round(teams.reduce((s, t) => s + t.yoyGrowth, 0) / n * 10) / 10;

  return {
    totalValuation: totalVal,
    avgValuation: avgVal,
    highestValued: { name: highest.teamName, valuation: highest.valuation },
    lowestValued: { name: lowest.teamName, valuation: lowest.valuation },
    avgGrowth,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function buildRevenueStreams(seed: number, totalRevenue: number): RevenueStream[] {
  // Allocate revenue across common MLB revenue sources
  const basePcts = [
    { source: 'Broadcasting', pct: 28 + (seed % 8) },
    { source: 'Gate Revenue', pct: 22 + (seed % 6) },
    { source: 'Sponsorship', pct: 14 + (seed % 5) },
    { source: 'Merchandise', pct: 10 + (seed % 4) },
    { source: 'Revenue Sharing', pct: 8 + (seed % 3) },
    { source: 'Concessions', pct: 6 + (seed % 3) },
  ];

  // Normalize so percents sum to ~100
  const totalPct = basePcts.reduce((s, p) => s + p.pct, 0);
  const otherPct = 100 - basePcts.reduce((s, p) => s + Math.round(p.pct / totalPct * 100), 0);

  const streams: RevenueStream[] = basePcts.map((p, i) => {
    const pctOfTotal = Math.round(p.pct / totalPct * 100);
    const amount = Math.round(totalRevenue * pctOfTotal / 100 * 10) / 10;
    const yoyChange = Math.round((-3 + (seed * 3 + i * 7) % 15) * 10) / 10;
    return { source: p.source, amount, pctOfTotal, yoyChange };
  });

  // Add "Other" to cover remainder
  if (otherPct > 0) {
    const otherAmt = Math.round(totalRevenue * otherPct / 100 * 10) / 10;
    streams.push({ source: 'Other', amount: otherAmt, pctOfTotal: otherPct, yoyChange: Math.round(((seed * 2) % 8 - 2) * 10) / 10 });
  }

  return streams;
}

const TEAM_DATA = [
  { name: 'New York Yankees', abbr: 'NYY', valuation: 7100, growth: 6.2, revenue: 683, expenses: 598, rank: 1 },
  { name: 'Los Angeles Dodgers', abbr: 'LAD', valuation: 5200, growth: 8.1, revenue: 612, expenses: 520, rank: 2 },
  { name: 'Boston Red Sox', abbr: 'BOS', valuation: 4800, growth: 4.5, revenue: 545, expenses: 488, rank: 3 },
  { name: 'Chicago Cubs', abbr: 'CHC', valuation: 4300, growth: 3.8, revenue: 498, expenses: 425, rank: 5 },
  { name: 'San Francisco Giants', abbr: 'SF', valuation: 4100, growth: 5.2, revenue: 478, expenses: 410, rank: 4 },
  { name: 'New York Mets', abbr: 'NYM', valuation: 3900, growth: 7.5, revenue: 520, expenses: 505, rank: 6 },
  { name: 'Tampa Bay Rays', abbr: 'TB', valuation: 1350, growth: 2.1, revenue: 268, expenses: 178, rank: 28 },
  { name: 'Oakland Athletics', abbr: 'OAK', valuation: 1200, growth: -1.4, revenue: 215, expenses: 155, rank: 30 },
];

export function generateDemoFranchiseValue(): FranchiseFinancials[] {
  return TEAM_DATA.map((t, i) => {
    const operatingIncome = Math.round((t.revenue - t.expenses) * 10) / 10;
    const revenueStreams = buildRevenueStreams(i * 5 + 17, t.revenue);

    let notes: string;
    if (t.growth >= 7) {
      notes = `${t.abbr} franchise value surging at ${t.growth}% YoY. Strong market position and media deals driving growth. Premium asset.`;
    } else if (t.growth >= 4) {
      notes = `${t.abbr} showing healthy growth at ${t.growth}%. Solid revenue diversification and stable expenses. Well-managed franchise.`;
    } else if (t.growth >= 0) {
      notes = `${t.abbr} growing modestly at ${t.growth}%. Operating income of $${operatingIncome}M is ${operatingIncome > 50 ? 'strong' : 'adequate'} but upside limited.`;
    } else {
      notes = `${t.abbr} valuation declining at ${t.growth}%. Market challenges, stadium uncertainty, and low attendance dragging value down.`;
    }

    return {
      id: `fv-${i}`,
      teamName: t.name,
      abbr: t.abbr,
      valuation: t.valuation,
      yoyGrowth: t.growth,
      revenue: t.revenue,
      expenses: t.expenses,
      operatingIncome,
      revenueStreams,
      marketRank: t.rank,
      notes,
    };
  });
}
