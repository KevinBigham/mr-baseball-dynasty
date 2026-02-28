/**
 * revenueSharing.ts – Revenue sharing model
 *
 * Tracks team revenues, revenue sharing pool contributions and
 * distributions, market size impact, and net financial position.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MarketSize = 'large' | 'medium' | 'small';

export interface TeamRevenue {
  id: string;
  teamName: string;
  abbr: string;
  marketSize: MarketSize;
  localRevenue: number;       // $M
  nationalRevenue: number;    // $M (evenly split)
  totalRevenue: number;
  revenueShareContrib: number; // $M contributed to pool
  revenueShareReceived: number; // $M received from pool
  netRevSharing: number;       // received - contributed
  operatingIncome: number;     // $M
  payroll: number;
  payrollPct: number;          // payroll as % of revenue
  attendance: number;          // in thousands
  tvDealValue: number;         // $M/year
  notes: string;
}

export const MARKET_DISPLAY: Record<MarketSize, { label: string; color: string }> = {
  large:  { label: 'Large Market',  color: '#22c55e' },
  medium: { label: 'Mid Market',    color: '#f59e0b' },
  small:  { label: 'Small Market',  color: '#ef4444' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface RevenueSummary {
  totalPool: number;
  avgRevenue: number;
  biggestPayer: string;
  biggestReceiver: string;
  largestRevenue: string;
  smallestRevenue: string;
}

export function getRevenueSummary(teams: TeamRevenue[]): RevenueSummary {
  const pool = Math.round(teams.reduce((s, t) => s + t.revenueShareContrib, 0) * 10) / 10;
  const avgRev = Math.round(teams.reduce((s, t) => s + t.totalRevenue, 0) / teams.length);
  const sorted = [...teams].sort((a, b) => a.netRevSharing - b.netRevSharing);
  const byRev = [...teams].sort((a, b) => b.totalRevenue - a.totalRevenue);
  return {
    totalPool: pool,
    avgRevenue: avgRev,
    biggestPayer: sorted[0].teamName,
    biggestReceiver: sorted[sorted.length - 1].teamName,
    largestRevenue: byRev[0].teamName,
    smallestRevenue: byRev[byRev.length - 1].teamName,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const TEAMS = [
  { name: 'New York Yankees', abbr: 'NYY', market: 'large' as const, local: 420, tv: 110, att: 3200, payroll: 280 },
  { name: 'Los Angeles Dodgers', abbr: 'LAD', market: 'large' as const, local: 440, tv: 120, att: 3500, payroll: 295 },
  { name: 'New York Mets', abbr: 'NYM', market: 'large' as const, local: 380, tv: 95, att: 2800, payroll: 310 },
  { name: 'Boston Red Sox', abbr: 'BOS', market: 'large' as const, local: 360, tv: 90, att: 2900, payroll: 245 },
  { name: 'Chicago Cubs', abbr: 'CHC', market: 'large' as const, local: 340, tv: 80, att: 2700, payroll: 230 },
  { name: 'San Francisco Giants', abbr: 'SF', market: 'medium' as const, local: 280, tv: 65, att: 2400, payroll: 210 },
  { name: 'St. Louis Cardinals', abbr: 'STL', market: 'medium' as const, local: 260, tv: 55, att: 2600, payroll: 195 },
  { name: 'Houston Astros', abbr: 'HOU', market: 'medium' as const, local: 300, tv: 70, att: 2500, payroll: 242 },
  { name: 'Milwaukee Brewers', abbr: 'MIL', market: 'small' as const, local: 180, tv: 35, att: 2100, payroll: 140 },
  { name: 'Kansas City Royals', abbr: 'KC', market: 'small' as const, local: 160, tv: 30, att: 1900, payroll: 120 },
  { name: 'Pittsburgh Pirates', abbr: 'PIT', market: 'small' as const, local: 150, tv: 28, att: 1700, payroll: 105 },
  { name: 'Oakland Athletics', abbr: 'OAK', market: 'small' as const, local: 120, tv: 22, att: 900, payroll: 65 },
];

export function generateDemoRevenueSharing(): TeamRevenue[] {
  const national = 80; // each team gets $80M in national revenue
  const avgLocal = TEAMS.reduce((s, t) => s + t.local, 0) / TEAMS.length;

  return TEAMS.map((t, i) => {
    const totalRev = t.local + national;
    const contrib = Math.round(t.local * 0.48 * 0.10); // simplified: 48% of local goes to pool at ~10%
    const poolPerTeam = Math.round(TEAMS.reduce((s, tm) => s + tm.local * 0.48 * 0.10, 0) / TEAMS.length);
    const received = poolPerTeam;
    const net = received - contrib;
    const opIncome = totalRev - t.payroll - 40 - ((i * 5) % 20); // subtract ops costs
    const payrollPct = Math.round((t.payroll / totalRev) * 100);

    return {
      id: `rs-${i}`,
      teamName: t.name,
      abbr: t.abbr,
      marketSize: t.market,
      localRevenue: t.local,
      nationalRevenue: national,
      totalRevenue: totalRev,
      revenueShareContrib: contrib,
      revenueShareReceived: received,
      netRevSharing: net,
      operatingIncome: opIncome,
      payroll: t.payroll,
      payrollPct,
      attendance: t.att,
      tvDealValue: t.tv,
      notes: net > 0 ? `Net receiver of revenue sharing (+$${net}M). ${t.market === 'small' ? 'Essential for competitive viability.' : 'Supplemental revenue.'}` :
             `Net contributor to revenue sharing ($${Math.abs(net)}M). ${t.local > avgLocal ? 'Large market generates significant pool funding.' : 'Above-average contributor.'}`,
    };
  });
}
