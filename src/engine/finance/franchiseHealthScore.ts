/**
 * Franchise Financial Health Score — Mr. Baseball Dynasty
 *
 * Composite financial health metric (0-100) for every franchise, built from:
 *   - Revenue growth trajectory
 *   - Payroll efficiency (wins per dollar spent)
 *   - Luxury tax buffer (how close / over the threshold)
 *   - Farm system value (pipeline depth and quality)
 *   - Market size factor (revenue potential)
 *
 * Also tracks historical trend, league ranking, and cross-team comparison.
 * Inspired by real franchise valuation models (Forbes, Spotrac).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type HealthGrade = 'elite' | 'strong' | 'healthy' | 'concerning' | 'critical';

export interface HealthComponent {
  name: string;
  key: string;
  score: number;      // 0-100
  weight: number;     // % contribution to composite
  description: string;
  trend: number;       // -1 to +1 (change from last season)
}

export interface HistoricalHealthPoint {
  season: number;
  healthScore: number;
  leagueRank: number;
  wins: number;
  payroll: number;     // $M
  revenue: number;     // $M
}

export interface FranchiseHealthData {
  teamId: number;
  teamName: string;
  abbreviation: string;
  healthScore: number;       // 0-100 composite
  healthGrade: HealthGrade;
  leagueRank: number;        // 1-30
  divisionRank: number;      // 1-5
  components: HealthComponent[];
  history: HistoricalHealthPoint[];
  // Summary stats
  totalRevenue: number;      // $M
  totalPayroll: number;      // $M
  luxuryTaxBuffer: number;   // $M (positive = under, negative = over)
  farmSystemValue: number;   // $M estimated
  marketSizeFactor: number;  // 0.7-1.5
  wins: number;
  franchiseValue: number;    // $M Forbes-style estimate
  outlook: string;
}

export const HEALTH_GRADE_DISPLAY: Record<HealthGrade, { label: string; color: string }> = {
  elite:      { label: 'ELITE',       color: '#22c55e' },
  strong:     { label: 'STRONG',      color: '#3b82f6' },
  healthy:    { label: 'HEALTHY',     color: '#f59e0b' },
  concerning: { label: 'CONCERNING',  color: '#f97316' },
  critical:   { label: 'CRITICAL',    color: '#ef4444' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGrade(score: number): HealthGrade {
  if (score >= 82) return 'elite';
  if (score >= 68) return 'strong';
  if (score >= 50) return 'healthy';
  if (score >= 32) return 'concerning';
  return 'critical';
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

interface TeamSeed {
  id: number;
  name: string;
  abbr: string;
  div: number;
  market: number;
  wins: number;
  payroll: number;
  revenue: number;
  farmVal: number;
  luxBuf: number;
  franchiseVal: number;
}

const TEAM_SEEDS: TeamSeed[] = [
  { id: 1,  name: 'New York Yankees',       abbr: 'NYY', div: 1, market: 1.45, wins: 95,  payroll: 275, revenue: 680, farmVal: 185, luxBuf: -38,  franchiseVal: 7500 },
  { id: 2,  name: 'Los Angeles Dodgers',     abbr: 'LAD', div: 2, market: 1.50, wins: 98,  payroll: 285, revenue: 650, farmVal: 210, luxBuf: -48,  franchiseVal: 5300 },
  { id: 3,  name: 'New York Mets',           abbr: 'NYM', div: 1, market: 1.40, wins: 85,  payroll: 310, revenue: 480, farmVal: 95,  luxBuf: -73,  franchiseVal: 2900 },
  { id: 4,  name: 'Atlanta Braves',          abbr: 'ATL', div: 3, market: 1.10, wins: 92,  payroll: 205, revenue: 440, farmVal: 175, luxBuf: 32,   franchiseVal: 2700 },
  { id: 5,  name: 'Houston Astros',          abbr: 'HOU', div: 4, market: 1.15, wins: 90,  payroll: 230, revenue: 420, farmVal: 130, luxBuf: 7,    franchiseVal: 2600 },
  { id: 6,  name: 'Philadelphia Phillies',   abbr: 'PHI', div: 3, market: 1.20, wins: 93,  payroll: 255, revenue: 460, farmVal: 110, luxBuf: -18,  franchiseVal: 2800 },
  { id: 7,  name: 'San Diego Padres',        abbr: 'SD',  div: 2, market: 0.95, wins: 82,  payroll: 240, revenue: 340, farmVal: 145, luxBuf: -3,   franchiseVal: 1800 },
  { id: 8,  name: 'Texas Rangers',           abbr: 'TEX', div: 4, market: 1.05, wins: 88,  payroll: 225, revenue: 380, farmVal: 120, luxBuf: 12,   franchiseVal: 2300 },
  { id: 9,  name: 'Seattle Mariners',        abbr: 'SEA', div: 5, market: 0.95, wins: 86,  payroll: 190, revenue: 350, farmVal: 195, luxBuf: 47,   franchiseVal: 2000 },
  { id: 10, name: 'Baltimore Orioles',       abbr: 'BAL', div: 1, market: 0.85, wins: 91,  payroll: 135, revenue: 310, farmVal: 280, luxBuf: 102,  franchiseVal: 1700 },
  { id: 11, name: 'Minnesota Twins',         abbr: 'MIN', div: 6, market: 0.90, wins: 84,  payroll: 175, revenue: 310, farmVal: 160, luxBuf: 62,   franchiseVal: 1650 },
  { id: 12, name: 'Cleveland Guardians',     abbr: 'CLE', div: 6, market: 0.80, wins: 87,  payroll: 120, revenue: 280, farmVal: 200, luxBuf: 117,  franchiseVal: 1400 },
  { id: 13, name: 'Tampa Bay Rays',          abbr: 'TB',  div: 1, market: 0.70, wins: 89,  payroll: 95,  revenue: 260, farmVal: 250, luxBuf: 142,  franchiseVal: 1250 },
  { id: 14, name: 'Milwaukee Brewers',       abbr: 'MIL', div: 6, market: 0.75, wins: 85,  payroll: 140, revenue: 275, farmVal: 190, luxBuf: 97,   franchiseVal: 1350 },
  { id: 15, name: 'St. Louis Cardinals',     abbr: 'STL', div: 6, market: 1.00, wins: 78,  payroll: 180, revenue: 360, farmVal: 140, luxBuf: 57,   franchiseVal: 2400 },
  { id: 16, name: 'San Francisco Giants',    abbr: 'SF',  div: 2, market: 1.10, wins: 76,  payroll: 195, revenue: 380, farmVal: 125, luxBuf: 42,   franchiseVal: 2500 },
  { id: 17, name: 'Boston Red Sox',          abbr: 'BOS', div: 1, market: 1.30, wins: 80,  payroll: 230, revenue: 520, farmVal: 150, luxBuf: 7,    franchiseVal: 4100 },
  { id: 18, name: 'Chicago Cubs',            abbr: 'CHC', div: 6, market: 1.25, wins: 79,  payroll: 215, revenue: 490, farmVal: 135, luxBuf: 22,   franchiseVal: 4000 },
  { id: 19, name: 'Toronto Blue Jays',       abbr: 'TOR', div: 1, market: 1.00, wins: 83,  payroll: 210, revenue: 350, farmVal: 120, luxBuf: 27,   franchiseVal: 2100 },
  { id: 20, name: 'Arizona Diamondbacks',    abbr: 'ARI', div: 2, market: 0.85, wins: 84,  payroll: 155, revenue: 290, farmVal: 175, luxBuf: 82,   franchiseVal: 1550 },
  { id: 21, name: 'Detroit Tigers',          abbr: 'DET', div: 6, market: 0.90, wins: 75,  payroll: 125, revenue: 300, farmVal: 195, luxBuf: 112,  franchiseVal: 1500 },
  { id: 22, name: 'Kansas City Royals',      abbr: 'KC',  div: 4, market: 0.75, wins: 72,  payroll: 110, revenue: 260, farmVal: 170, luxBuf: 127,  franchiseVal: 1200 },
  { id: 23, name: 'Pittsburgh Pirates',      abbr: 'PIT', div: 6, market: 0.70, wins: 68,  payroll: 85,  revenue: 240, farmVal: 210, luxBuf: 152,  franchiseVal: 1150 },
  { id: 24, name: 'Cincinnati Reds',         abbr: 'CIN', div: 6, market: 0.80, wins: 74,  payroll: 115, revenue: 270, farmVal: 185, luxBuf: 122,  franchiseVal: 1300 },
  { id: 25, name: 'Los Angeles Angels',      abbr: 'LAA', div: 5, market: 1.15, wins: 73,  payroll: 200, revenue: 390, farmVal: 80,  luxBuf: 37,   franchiseVal: 2700 },
  { id: 26, name: 'Chicago White Sox',       abbr: 'CWS', div: 6, market: 1.00, wins: 65,  payroll: 100, revenue: 290, farmVal: 155, luxBuf: 137,  franchiseVal: 1900 },
  { id: 27, name: 'Washington Nationals',    abbr: 'WSH', div: 3, market: 1.05, wins: 70,  payroll: 130, revenue: 310, farmVal: 200, luxBuf: 107,  franchiseVal: 2100 },
  { id: 28, name: 'Colorado Rockies',        abbr: 'COL', div: 2, market: 0.85, wins: 62,  payroll: 115, revenue: 280, farmVal: 100, luxBuf: 122,  franchiseVal: 1400 },
  { id: 29, name: 'Miami Marlins',           abbr: 'MIA', div: 3, market: 0.80, wins: 60,  payroll: 70,  revenue: 230, farmVal: 165, luxBuf: 167,  franchiseVal: 1100 },
  { id: 30, name: 'Oakland Athletics',       abbr: 'OAK', div: 5, market: 0.70, wins: 58,  payroll: 60,  revenue: 200, farmVal: 140, luxBuf: 177,  franchiseVal: 1500 },
];

const OUTLOOKS: Record<HealthGrade, string[]> = {
  elite:      ['Franchise is in peak financial shape. Positioned to sustain a championship window for years.', 'Top-tier financial health enables aggressive moves. Should capitalize on contention window.'],
  strong:     ['Solid financial footing with room to make impact moves at the deadline or in free agency.', 'Well-managed finances create flexibility. Minor optimizations could push into elite territory.'],
  healthy:    ['Stable but not exceptional. Budget constraints may limit one or two big moves per offseason.', 'Middle-of-the-pack finances. Smart, targeted spending is essential.'],
  concerning: ['Financial pressures mounting. May need to shed payroll or trade veterans for prospects.', 'Warning signs in financial metrics. Course correction needed within 1-2 seasons.'],
  critical:   ['Franchise in financial distress. Rebuild required with focus on cost-controlled talent.', 'Severe financial challenges. Owner may need to approve increased spending or accept tanking.'],
};

function computeComponents(seed: TeamSeed): HealthComponent[] {
  // Revenue growth (simulated as market * recent wins influence)
  const revGrowthRaw = clamp((seed.revenue / 350 - 0.5) * 100 + seed.wins * 0.3, 0, 100);
  const revGrowth = Math.round(revGrowthRaw);

  // Payroll efficiency: wins / payroll ratio, normalized
  const winsPerM = seed.wins / Math.max(seed.payroll, 60);
  const efficiencyRaw = clamp(winsPerM * 180 - 10, 0, 100);
  const efficiency = Math.round(efficiencyRaw);

  // Luxury tax buffer: more buffer = healthier
  const luxRaw = clamp(50 + seed.luxBuf * 0.4, 0, 100);
  const luxScore = Math.round(luxRaw);

  // Farm value: higher = healthier
  const farmRaw = clamp((seed.farmVal / 280) * 100, 0, 100);
  const farmScore = Math.round(farmRaw);

  // Market size: bigger market = more upside
  const marketRaw = clamp((seed.market / 1.5) * 100, 0, 100);
  const marketScore = Math.round(marketRaw);

  return [
    {
      name: 'Revenue Growth', key: 'revenue',
      score: revGrowth, weight: 25,
      description: `$${seed.revenue}M total revenue. ${revGrowth >= 70 ? 'Strong media and gate revenue.' : revGrowth >= 40 ? 'Moderate revenue streams.' : 'Revenue underperforming market potential.'}`,
      trend: revGrowth >= 70 ? 0.3 : revGrowth >= 50 ? 0.1 : -0.2,
    },
    {
      name: 'Payroll Efficiency', key: 'efficiency',
      score: efficiency, weight: 25,
      description: `${seed.wins}W on $${seed.payroll}M payroll. ${efficiency >= 70 ? 'Elite bang-for-buck.' : efficiency >= 45 ? 'Reasonable efficiency.' : 'Overpaying for current production.'}`,
      trend: efficiency >= 65 ? 0.2 : efficiency >= 40 ? 0 : -0.3,
    },
    {
      name: 'Luxury Tax Buffer', key: 'luxury',
      score: luxScore, weight: 20,
      description: `${seed.luxBuf >= 0 ? `$${seed.luxBuf}M under threshold` : `$${Math.abs(seed.luxBuf)}M over threshold`}. ${luxScore >= 60 ? 'Comfortable room to add.' : luxScore >= 35 ? 'Tight but manageable.' : 'Deep in tax territory.'}`,
      trend: seed.luxBuf >= 20 ? 0.1 : seed.luxBuf >= 0 ? 0 : -0.4,
    },
    {
      name: 'Farm System Value', key: 'farm',
      score: farmScore, weight: 20,
      description: `Pipeline valued at ~$${seed.farmVal}M. ${farmScore >= 70 ? 'Deep, high-upside system.' : farmScore >= 45 ? 'Solid middle-tier system.' : 'Depleted pipeline needs restocking.'}`,
      trend: farmScore >= 60 ? 0.2 : farmScore >= 35 ? 0 : -0.1,
    },
    {
      name: 'Market Size Factor', key: 'market',
      score: marketScore, weight: 10,
      description: `${seed.market >= 1.2 ? 'Large' : seed.market >= 0.9 ? 'Mid-size' : 'Small'} market (${seed.market.toFixed(2)}x). ${marketScore >= 70 ? 'Revenue ceiling is high.' : 'Limited upside from market alone.'}`,
      trend: 0,
    },
  ];
}

function computeComposite(components: HealthComponent[]): number {
  const weighted = components.reduce((sum, c) => sum + c.score * (c.weight / 100), 0);
  return Math.round(weighted);
}

function generateHistory(seed: TeamSeed, currentScore: number): HistoricalHealthPoint[] {
  const points: HistoricalHealthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const season = 2026 - i;
    const drift = (Math.sin(seed.id * 3 + i * 1.7) * 8) + (i - 2.5) * (currentScore > 60 ? 1.5 : -1.5);
    const score = clamp(Math.round(currentScore - drift), 10, 98);
    const rank = clamp(Math.round(30 - (score / 100) * 29 + Math.sin(i + seed.id) * 3), 1, 30);
    const wDrift = Math.round(Math.sin(i * 2 + seed.id) * 5);
    const pDrift = Math.round(Math.sin(i * 1.3 + seed.id * 0.7) * 15);
    const rDrift = Math.round(Math.sin(i * 0.8 + seed.id * 1.2) * 20);
    points.push({
      season,
      healthScore: score,
      leagueRank: rank,
      wins: seed.wins + wDrift,
      payroll: seed.payroll + pDrift,
      revenue: seed.revenue + rDrift,
    });
  }
  return points;
}

export function generateDemoFranchiseHealth(): FranchiseHealthData[] {
  const results: FranchiseHealthData[] = [];

  for (const seed of TEAM_SEEDS) {
    const components = computeComponents(seed);
    const healthScore = computeComposite(components);
    const grade = getGrade(healthScore);
    const history = generateHistory(seed, healthScore);
    const outlooks = OUTLOOKS[grade];
    const outlook = outlooks[seed.id % outlooks.length];

    results.push({
      teamId: seed.id,
      teamName: seed.name,
      abbreviation: seed.abbr,
      healthScore,
      healthGrade: grade,
      leagueRank: 0, // computed after sort
      divisionRank: 0,
      components,
      history,
      totalRevenue: seed.revenue,
      totalPayroll: seed.payroll,
      luxuryTaxBuffer: seed.luxBuf,
      farmSystemValue: seed.farmVal,
      marketSizeFactor: seed.market,
      wins: seed.wins,
      franchiseValue: seed.franchiseVal,
      outlook,
    });
  }

  // Sort by health score, assign league ranks
  results.sort((a, b) => b.healthScore - a.healthScore);
  results.forEach((t, i) => { t.leagueRank = i + 1; });

  // Assign division ranks
  const divGroups: Record<number, FranchiseHealthData[]> = {};
  for (const t of results) {
    const divId = TEAM_SEEDS.find(s => s.id === t.teamId)!.div;
    (divGroups[divId] ??= []).push(t);
  }
  for (const group of Object.values(divGroups)) {
    group.sort((a, b) => b.healthScore - a.healthScore);
    group.forEach((t, i) => { t.divisionRank = i + 1; });
  }

  return results;
}
