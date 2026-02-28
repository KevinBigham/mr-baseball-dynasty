/**
 * tradeChipRanking.ts – League-Wide Trade Chip Rankings
 *
 * Ranks all players by trade value across the entire league.
 * Factors include:
 *   - Surplus value (production above contract cost)
 *   - Contract desirability (years, AAV, team control)
 *   - Age factor (prime years vs decline)
 *   - Position scarcity (premium positions score higher)
 *   - Overall composite trade value score
 *
 * Returns the top 50 trade chips with detailed value breakdowns
 * and filtering by position, team, and contract status.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ContractStatus = 'pre-arb' | 'arb-eligible' | 'controlled' | 'expiring' | 'long-term';
export type TradeValueTier = 'elite' | 'premium' | 'high' | 'solid' | 'moderate' | 'low';

export interface ValueBreakdown {
  surplusValue: number;        // -20 to 40  — production above contract cost ($M)
  contractDesirability: number; // 0-100 — how attractive the contract is
  ageFactor: number;           // 0-100 — age-based value multiplier
  positionScarcity: number;    // 0-100 — position premium
  performanceScore: number;    // 0-100 — recent on-field production
}

export interface TradeChip {
  rank: number;
  id: string;
  name: string;
  team: string;
  teamFull: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  war: number;
  projectedWAR: number;
  salary: number;             // $M per year
  yearsControlled: number;
  contractStatus: ContractStatus;
  totalValue: number;         // 0-100 composite score
  tier: TradeValueTier;
  breakdown: ValueBreakdown;
  trending: 'up' | 'down' | 'stable';
  trendDelta: number;         // change in rank over last 2 weeks
  notes: string;
}

export interface TradeChipSummary {
  totalRanked: number;
  eliteCount: number;
  premiumCount: number;
  avgValue: number;
  topTeam: string;
  topPosition: string;
  preArbCount: number;
  expiringCount: number;
}

// ── Display constants ──────────────────────────────────────────────────────

export const TIER_DISPLAY: Record<TradeValueTier, { label: string; color: string; badge: string }> = {
  elite:    { label: 'Elite',    color: '#22c55e', badge: 'S' },
  premium:  { label: 'Premium',  color: '#3b82f6', badge: 'A' },
  high:     { label: 'High',     color: '#8b5cf6', badge: 'B+' },
  solid:    { label: 'Solid',    color: '#eab308', badge: 'B' },
  moderate: { label: 'Moderate', color: '#f97316', badge: 'C' },
  low:      { label: 'Low',      color: '#888',    badge: 'D' },
};

export const CONTRACT_DISPLAY: Record<ContractStatus, { label: string; color: string }> = {
  'pre-arb':      { label: 'Pre-Arb',       color: '#22c55e' },
  'arb-eligible': { label: 'Arb-Eligible',   color: '#4ade80' },
  'controlled':   { label: 'Club Controlled', color: '#3b82f6' },
  'expiring':     { label: 'Expiring',        color: '#f59e0b' },
  'long-term':    { label: 'Long-Term',       color: '#888' },
};

// ── Logic ──────────────────────────────────────────────────────────────────

function computeTier(totalValue: number): TradeValueTier {
  if (totalValue >= 85) return 'elite';
  if (totalValue >= 72) return 'premium';
  if (totalValue >= 58) return 'high';
  if (totalValue >= 44) return 'solid';
  if (totalValue >= 30) return 'moderate';
  return 'low';
}

export function getTradeChipSummary(chips: TradeChip[]): TradeChipSummary {
  const n = chips.length;
  const teamCounts: Record<string, number> = {};
  const posCounts: Record<string, number> = {};

  for (const c of chips) {
    teamCounts[c.team] = (teamCounts[c.team] ?? 0) + 1;
    posCounts[c.position] = (posCounts[c.position] ?? 0) + 1;
  }

  const topTeam = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const topPos = Object.entries(posCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  return {
    totalRanked: n,
    eliteCount: chips.filter(c => c.tier === 'elite').length,
    premiumCount: chips.filter(c => c.tier === 'premium').length,
    avgValue: Math.round(chips.reduce((s, c) => s + c.totalValue, 0) / n),
    topTeam,
    topPosition: topPos,
    preArbCount: chips.filter(c => c.contractStatus === 'pre-arb').length,
    expiringCount: chips.filter(c => c.contractStatus === 'expiring').length,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface ChipSeed {
  name: string;
  team: string;
  teamFull: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  war: number;
  projWAR: number;
  salary: number;
  yrsCtrl: number;
  contract: ContractStatus;
  notes: string;
}

const CHIP_SEEDS: ChipSeed[] = [
  { name: 'Juan Soto', team: 'NYM', teamFull: 'New York Mets', position: 'RF', age: 26, overall: 92, potential: 95, war: 7.2, projWAR: 7.5, salary: 46.0, yrsCtrl: 14, contract: 'long-term', notes: 'Generational bat. Massive deal but production justifies it. Most valuable trade asset in baseball if ever moved.' },
  { name: 'Bobby Witt Jr.', team: 'KC', teamFull: 'Kansas City Royals', position: 'SS', age: 24, overall: 90, potential: 94, war: 8.1, projWAR: 8.0, salary: 7.4, yrsCtrl: 10, contract: 'controlled', notes: 'Elite young SS locked up long-term. Surplus value is enormous. Untouchable franchise cornerstone.' },
  { name: 'Elly De La Cruz', team: 'CIN', teamFull: 'Cincinnati Reds', position: 'SS', age: 22, overall: 85, potential: 96, war: 5.2, projWAR: 6.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Pre-arb speed/power combo with elite ceiling. Highest surplus value in the game. Franchise would never trade him.' },
  { name: 'Corbin Carroll', team: 'ARI', teamFull: 'Arizona Diamondbacks', position: 'CF', age: 23, overall: 83, potential: 92, war: 4.5, projWAR: 5.5, salary: 2.5, yrsCtrl: 5, contract: 'pre-arb', notes: 'Speed + power + defense in CF. Pre-arb control makes him an incredibly valuable chip.' },
  { name: 'Gunnar Henderson', team: 'BAL', teamFull: 'Baltimore Orioles', position: '3B', age: 23, overall: 88, potential: 94, war: 6.8, projWAR: 7.0, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Pre-arb superstar at premium position. Would anchor any franchise for 5+ years. Off-limits.' },
  { name: 'Yoshinobu Yamamoto', team: 'LAD', teamFull: 'Los Angeles Dodgers', position: 'SP', age: 25, overall: 86, potential: 90, war: 4.8, projWAR: 5.2, salary: 20.0, yrsCtrl: 10, contract: 'long-term', notes: 'Elite young SP with longevity. Front-of-rotation arm on a fair deal given production.' },
  { name: 'Jackson Chourio', team: 'MIL', teamFull: 'Milwaukee Brewers', position: 'CF', age: 21, overall: 82, potential: 93, war: 3.8, projWAR: 5.0, salary: 2.0, yrsCtrl: 7, contract: 'controlled', notes: 'Youngest star in baseball. Raw tools are off the charts. Seven years of control is absurd value.' },
  { name: 'Marcell Ozuna', team: 'ATL', teamFull: 'Atlanta Braves', position: 'DH', age: 33, overall: 80, potential: 80, war: 3.5, projWAR: 2.5, salary: 16.0, yrsCtrl: 1, contract: 'expiring', notes: 'Big bat, DH-only. Rental value is solid for contenders. Age limits long-term interest.' },
  { name: 'Corbin Burnes', team: 'ARI', teamFull: 'Arizona Diamondbacks', position: 'SP', age: 30, overall: 86, potential: 86, war: 4.5, projWAR: 4.0, salary: 26.3, yrsCtrl: 5, contract: 'long-term', notes: 'Top-10 SP in baseball. Large contract but production matches. Workload concerns aging.' },
  { name: 'Paul Skenes', team: 'PIT', teamFull: 'Pittsburgh Pirates', position: 'SP', age: 22, overall: 85, potential: 97, war: 4.0, projWAR: 6.0, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Best pitching prospect in a generation. Pre-arb with elite ceiling. Untouchable trade chip.' },
  { name: 'Trea Turner', team: 'PHI', teamFull: 'Philadelphia Phillies', position: 'SS', age: 31, overall: 82, potential: 82, war: 3.5, projWAR: 3.0, salary: 30.0, yrsCtrl: 7, contract: 'long-term', notes: 'Still producing but aging contract. Negative surplus for most teams. Would need salary relief.' },
  { name: 'Julio Rodriguez', team: 'SEA', teamFull: 'Seattle Mariners', position: 'CF', age: 23, overall: 84, potential: 93, war: 3.2, projWAR: 5.5, salary: 14.0, yrsCtrl: 11, contract: 'controlled', notes: 'Tools are elite but 2024 was a step back. Enormous upside on a team-friendly deal.' },
  { name: 'Pete Alonso', team: 'NYM', teamFull: 'New York Mets', position: '1B', age: 29, overall: 79, potential: 80, war: 2.8, projWAR: 2.5, salary: 21.0, yrsCtrl: 3, contract: 'long-term', notes: 'Big power but limited defensive value at a weak position. Contract is slightly above market.' },
  { name: 'Jarren Duran', team: 'BOS', teamFull: 'Boston Red Sox', position: 'CF', age: 27, overall: 82, potential: 85, war: 5.5, projWAR: 4.5, salary: 1.5, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Breakout speed/power in CF on a cheap arb deal. Excellent surplus value for any contender.' },
  { name: 'Tarik Skubal', team: 'DET', teamFull: 'Detroit Tigers', position: 'SP', age: 27, overall: 88, potential: 90, war: 7.0, projWAR: 6.5, salary: 2.6, yrsCtrl: 2, contract: 'arb-eligible', notes: 'Cy Young-caliber arm at bargain arb price. 2 years of control = highest trade value among SP.' },
  { name: 'Vladimir Guerrero Jr.', team: 'TOR', teamFull: 'Toronto Blue Jays', position: '1B', age: 25, overall: 86, potential: 90, war: 4.5, projWAR: 5.0, salary: 19.9, yrsCtrl: 0, contract: 'expiring', notes: 'Premium bat with 1B limitations. Walk year adds urgency. Massive rental value for contenders.' },
  { name: 'Colton Cowser', team: 'BAL', teamFull: 'Baltimore Orioles', position: 'LF', age: 24, overall: 78, potential: 86, war: 2.8, projWAR: 3.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Young OF with strong plate discipline. Pre-arb control maximizes trade value.' },
  { name: 'Garrett Crochet', team: 'BOS', teamFull: 'Boston Red Sox', position: 'SP', age: 25, overall: 84, potential: 89, war: 4.2, projWAR: 4.5, salary: 4.5, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Electric stuff, recent conversion from bullpen. Arb years + upside = premier trade chip among SP.' },
  { name: 'CJ Abrams', team: 'WSH', teamFull: 'Washington Nationals', position: 'SS', age: 23, overall: 80, potential: 88, war: 3.2, projWAR: 4.0, salary: 0.74, yrsCtrl: 4, contract: 'pre-arb', notes: 'Pre-arb SS with speed + developing power. Rebuilding team may eventually cash in.' },
  { name: 'Vinnie Pasquantino', team: 'KC', teamFull: 'Kansas City Royals', position: '1B', age: 26, overall: 78, potential: 84, war: 2.5, projWAR: 3.0, salary: 0.74, yrsCtrl: 4, contract: 'pre-arb', notes: 'Sweet-swinging 1B on league minimum. Strong contact approach, solid average, limited by position.' },
  { name: 'Jordan Walker', team: 'STL', teamFull: 'St. Louis Cardinals', position: 'RF', age: 22, overall: 76, potential: 91, war: 1.5, projWAR: 3.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Raw toolset with immense upside. Struggling at ML level but prospect pedigree is top-tier.' },
  { name: 'Spencer Strider', team: 'ATL', teamFull: 'Atlanta Braves', position: 'SP', age: 25, overall: 84, potential: 92, war: 3.0, projWAR: 5.0, salary: 4.8, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Electric arm returning from injury. If healthy, one of the most valuable SPs in the game.' },
  { name: 'Kyle Tucker', team: 'HOU', teamFull: 'Houston Astros', position: 'LF', age: 27, overall: 87, potential: 88, war: 5.8, projWAR: 5.5, salary: 15.0, yrsCtrl: 0, contract: 'expiring', notes: 'Complete hitter + defender. Walk-year rental would command a massive haul of prospects.' },
  { name: 'Bryan Reynolds', team: 'PIT', teamFull: 'Pittsburgh Pirates', position: 'CF', age: 29, overall: 80, potential: 82, war: 3.2, projWAR: 3.0, salary: 7.5, yrsCtrl: 5, contract: 'controlled', notes: 'Consistent production at a surplus price. Good value but not elite ceiling.' },
  { name: 'Lucas Erceg', team: 'KC', teamFull: 'Kansas City Royals', position: 'RP', age: 29, overall: 76, potential: 78, war: 1.8, projWAR: 1.5, salary: 1.2, yrsCtrl: 2, contract: 'arb-eligible', notes: 'Dominant late-inning reliever on a cheap deal. Premium bullpen arms always in demand at the deadline.' },
  { name: 'Junior Caminero', team: 'TB', teamFull: 'Tampa Bay Rays', position: '3B', age: 21, overall: 72, potential: 90, war: 0.8, projWAR: 3.0, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Top-tier prospect with raw power. Developing bat makes him a high-upside trade target.' },
  { name: 'Zack Wheeler', team: 'PHI', teamFull: 'Philadelphia Phillies', position: 'SP', age: 34, overall: 89, potential: 89, war: 5.5, projWAR: 4.5, salary: 23.6, yrsCtrl: 0, contract: 'expiring', notes: 'Ace-caliber arm in a walk year. Premium rental SP could fetch a franchise-altering return.' },
  { name: 'Brice Turang', team: 'MIL', teamFull: 'Milwaukee Brewers', position: '2B', age: 24, overall: 77, potential: 83, war: 3.0, projWAR: 3.5, salary: 0.74, yrsCtrl: 4, contract: 'pre-arb', notes: 'Speed + defense at 2B on minimum salary. Growing bat could elevate his value further.' },
  { name: 'Andrés Muñoz', team: 'SEA', teamFull: 'Seattle Mariners', position: 'RP', age: 25, overall: 82, potential: 85, war: 2.2, projWAR: 2.0, salary: 2.3, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Triple-digit closer with elite stuff. Rare commodity in any trade market.' },
  { name: 'Royce Lewis', team: 'MIN', teamFull: 'Minnesota Twins', position: 'SS', age: 25, overall: 81, potential: 88, war: 3.0, projWAR: 4.0, salary: 0.74, yrsCtrl: 4, contract: 'pre-arb', notes: 'Explosive bat, injury prone. Health is the discount — when healthy, top-20 position player.' },
  { name: 'Adley Rutschman', team: 'BAL', teamFull: 'Baltimore Orioles', position: 'C', age: 26, overall: 84, potential: 90, war: 4.0, projWAR: 4.5, salary: 3.2, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Best catcher in baseball. Premium position + cheap contract = untouchable chip.' },
  { name: 'Will Smith', team: 'LAD', teamFull: 'Los Angeles Dodgers', position: 'C', age: 29, overall: 80, potential: 82, war: 3.0, projWAR: 2.8, salary: 10.0, yrsCtrl: 3, contract: 'controlled', notes: 'Above-average bat at catcher. Fair contract makes him a moveable asset.' },
  { name: 'Evan Carter', team: 'TEX', teamFull: 'Texas Rangers', position: 'LF', age: 22, overall: 77, potential: 89, war: 2.0, projWAR: 3.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Young outfielder with elite plate discipline and developing power. Long runway of control.' },
  { name: 'Emmanuel Clase', team: 'CLE', teamFull: 'Cleveland Guardians', position: 'RP', age: 26, overall: 84, potential: 86, war: 2.5, projWAR: 2.3, salary: 4.5, yrsCtrl: 2, contract: 'arb-eligible', notes: 'Dominant closer with cutter from hell. Relievers rarely rank this high — he is that good.' },
  { name: 'Masataka Yoshida', team: 'BOS', teamFull: 'Boston Red Sox', position: 'DH', age: 31, overall: 77, potential: 78, war: 2.0, projWAR: 1.8, salary: 18.0, yrsCtrl: 3, contract: 'long-term', notes: 'Pure hitter but DH-only. Overpaid relative to production. Limited trade interest.' },
  { name: 'Logan Gilbert', team: 'SEA', teamFull: 'Seattle Mariners', position: 'SP', age: 27, overall: 83, potential: 86, war: 3.8, projWAR: 4.0, salary: 3.8, yrsCtrl: 3, contract: 'arb-eligible', notes: 'Reliable mid-rotation arm on bargain arb deal. Strong innings eater with upside.' },
  { name: 'Anthony Volpe', team: 'NYY', teamFull: 'New York Yankees', position: 'SS', age: 23, overall: 78, potential: 86, war: 2.5, projWAR: 3.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Pre-arb SS for the Yankees. Good glove, developing bat. High-pedigree prospect pedigree.' },
  { name: 'Jordan Romano', team: 'TOR', teamFull: 'Toronto Blue Jays', position: 'RP', age: 31, overall: 78, potential: 79, war: 1.5, projWAR: 1.2, salary: 7.0, yrsCtrl: 1, contract: 'expiring', notes: 'Rental closer option. Coming off injury but track record is strong. Low-cost acquisition.' },
  { name: 'Tyler Glasnow', team: 'LAD', teamFull: 'Los Angeles Dodgers', position: 'SP', age: 30, overall: 86, potential: 87, war: 4.2, projWAR: 3.8, salary: 25.0, yrsCtrl: 4, contract: 'long-term', notes: 'When healthy, top-5 SP. Injury history creates discount. Large contract limits market.' },
  { name: 'Jackson Merrill', team: 'SD', teamFull: 'San Diego Padres', position: 'CF', age: 21, overall: 80, potential: 91, war: 3.5, projWAR: 4.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'One of the best young OFs in the game. Pre-arb CF with 5-tool potential. Untouchable.' },
  { name: 'Willy Adames', team: 'SF', teamFull: 'San Francisco Giants', position: 'SS', age: 28, overall: 82, potential: 83, war: 4.0, projWAR: 3.5, salary: 23.5, yrsCtrl: 6, contract: 'long-term', notes: 'Solid two-way SS on a big deal. Fair value now but aging curve could flip to negative.' },
  { name: 'Roki Sasaki', team: 'LAD', teamFull: 'Los Angeles Dodgers', position: 'SP', age: 23, overall: 83, potential: 95, war: 2.5, projWAR: 5.0, salary: 5.0, yrsCtrl: 5, contract: 'controlled', notes: 'Japanese phenom with electric stuff. If he reaches ceiling, best SP in baseball.' },
  { name: 'Wilyer Abreu', team: 'BOS', teamFull: 'Boston Red Sox', position: 'RF', age: 24, overall: 79, potential: 85, war: 3.0, projWAR: 3.5, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Complete toolset in RF. Pre-arb control + solid floor makes him an attractive trade piece.' },
  { name: 'Michael Busch', team: 'CHC', teamFull: 'Chicago Cubs', position: '1B', age: 26, overall: 78, potential: 84, war: 2.8, projWAR: 3.0, salary: 0.74, yrsCtrl: 4, contract: 'pre-arb', notes: 'Plus bat at 1B with patience. Position limits value but pre-arb control helps.' },
  { name: 'Alex Bregman', team: 'HOU', teamFull: 'Houston Astros', position: '3B', age: 30, overall: 82, potential: 83, war: 4.0, projWAR: 3.5, salary: 23.5, yrsCtrl: 5, contract: 'long-term', notes: 'Reliable 3B with playoff pedigree. Aging into a big contract. Moderate trade interest.' },
  { name: 'Jake Cronenworth', team: 'SD', teamFull: 'San Diego Padres', position: '2B', age: 30, overall: 77, potential: 78, war: 2.5, projWAR: 2.0, salary: 10.0, yrsCtrl: 2, contract: 'controlled', notes: 'Versatile infielder with solid bat. Fair contract. Good complementary piece in a deal.' },
  { name: 'Luis Castillo', team: 'SEA', teamFull: 'Seattle Mariners', position: 'SP', age: 31, overall: 83, potential: 84, war: 3.5, projWAR: 3.2, salary: 22.0, yrsCtrl: 3, contract: 'long-term', notes: 'Workhorse SP on a big deal. Production is steady but age + contract limits surplus.' },
  { name: 'Wyatt Langford', team: 'TEX', teamFull: 'Texas Rangers', position: 'RF', age: 23, overall: 76, potential: 87, war: 1.5, projWAR: 3.0, salary: 0.74, yrsCtrl: 5, contract: 'pre-arb', notes: 'Former top-5 pick with huge raw tools. Adjusting to MLB. Ceiling is very high.' },
  { name: 'Gleyber Torres', team: 'DET', teamFull: 'Detroit Tigers', position: '2B', age: 27, overall: 78, potential: 80, war: 2.8, projWAR: 2.5, salary: 15.0, yrsCtrl: 3, contract: 'long-term', notes: 'Solid middle infielder. Slightly overpaid. Modest trade interest from contenders.' },
  { name: 'Ryan Helsley', team: 'STL', teamFull: 'St. Louis Cardinals', position: 'RP', age: 30, overall: 82, potential: 83, war: 2.0, projWAR: 1.8, salary: 4.0, yrsCtrl: 1, contract: 'expiring', notes: 'Elite closer rental. Cardinals are rebuilding. High demand from contenders at the deadline.' },
];

// Position scarcity weightings for value calculation
const POSITION_WEIGHT: Record<string, number> = {
  'C':  85, 'SS': 80, 'CF': 75, 'SP': 90,
  '3B': 65, '2B': 60, 'LF': 50, 'RF': 55,
  '1B': 35, 'DH': 25, 'RP': 55,
};

function computeBreakdown(seed: ChipSeed): ValueBreakdown {
  // Surplus value: WAR * $8M/WAR minus salary
  const dollarPerWAR = 8.0;
  const prodValue = seed.war * dollarPerWAR;
  const surplus = Math.round((prodValue - seed.salary) * 10) / 10;
  const surplusClamped = Math.max(-20, Math.min(40, surplus));

  // Contract desirability
  let contractScore = 50;
  if (seed.contract === 'pre-arb') contractScore = 95;
  else if (seed.contract === 'arb-eligible') contractScore = 80;
  else if (seed.contract === 'controlled') contractScore = 70;
  else if (seed.contract === 'expiring') contractScore = 55;
  else contractScore = Math.max(10, 50 - (seed.salary - 15) * 2);
  contractScore = Math.max(0, Math.min(100, contractScore));

  // Age factor: peaks at 24-27
  let ageFactor: number;
  if (seed.age <= 22) ageFactor = 88;
  else if (seed.age <= 24) ageFactor = 95;
  else if (seed.age <= 27) ageFactor = 100;
  else if (seed.age <= 29) ageFactor = 82;
  else if (seed.age <= 31) ageFactor = 65;
  else if (seed.age <= 33) ageFactor = 45;
  else ageFactor = 30;

  // Position scarcity
  const posScar = POSITION_WEIGHT[seed.position] ?? 50;

  // Performance score: WAR-based
  const perfScore = Math.min(100, Math.max(0, Math.round(seed.war * 14)));

  return {
    surplusValue: surplusClamped,
    contractDesirability: contractScore,
    ageFactor,
    positionScarcity: posScar,
    performanceScore: perfScore,
  };
}

function computeTotalValue(bd: ValueBreakdown, potential: number, yrsCtrl: number): number {
  // Weighted composite
  const surplusNorm = Math.max(0, Math.min(100, (bd.surplusValue + 20) * (100 / 60)));
  const controlBonus = Math.min(15, yrsCtrl * 2.5);
  const potentialBonus = Math.max(0, (potential - 75) * 0.5);

  const raw = (
    bd.performanceScore * 0.30 +
    surplusNorm * 0.20 +
    bd.contractDesirability * 0.18 +
    bd.ageFactor * 0.12 +
    bd.positionScarcity * 0.10 +
    controlBonus * 1.0 +
    potentialBonus * 0.8
  );

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function generateDemoTradeChipRanking(): TradeChip[] {
  const chips: TradeChip[] = CHIP_SEEDS.map((seed, i) => {
    const breakdown = computeBreakdown(seed);
    const totalValue = computeTotalValue(breakdown, seed.potential, seed.yrsCtrl);
    const tier = computeTier(totalValue);

    // Deterministic trending
    const trendHash = (seed.name.length * 13 + i * 7) % 10;
    const trending: 'up' | 'down' | 'stable' = trendHash <= 3 ? 'up' : trendHash <= 6 ? 'stable' : 'down';
    const trendDelta = trending === 'up' ? -((trendHash % 4) + 1) :
                       trending === 'down' ? (trendHash % 5) + 1 : 0;

    return {
      rank: 0, // set after sort
      id: `tc-${i}`,
      name: seed.name,
      team: seed.team,
      teamFull: seed.teamFull,
      position: seed.position,
      age: seed.age,
      overall: seed.overall,
      potential: seed.potential,
      war: seed.war,
      projectedWAR: seed.projWAR,
      salary: seed.salary,
      yearsControlled: seed.yrsCtrl,
      contractStatus: seed.contract,
      totalValue,
      tier,
      breakdown,
      trending,
      trendDelta,
      notes: seed.notes,
    };
  });

  // Sort by totalValue descending
  chips.sort((a, b) => b.totalValue - a.totalValue);

  // Assign ranks
  for (let i = 0; i < chips.length; i++) {
    chips[i].rank = i + 1;
  }

  return chips;
}
