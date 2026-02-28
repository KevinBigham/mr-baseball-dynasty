/**
 * Trade Market Value Estimator
 *
 * Calculates live market value for players based on WAR,
 * contract, age, surplus value, position scarcity, and
 * market demand. Essential for fair trade evaluation.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ValueTier = 'franchise' | 'star' | 'solid' | 'role' | 'replacement' | 'negative';

export const VALUE_DISPLAY: Record<ValueTier, { label: string; color: string; emoji: string }> = {
  franchise:    { label: 'Franchise',    color: '#22c55e', emoji: '💎' },
  star:         { label: 'Star',         color: '#3b82f6', emoji: '⭐' },
  solid:        { label: 'Solid',        color: '#eab308', emoji: '✅' },
  role:         { label: 'Role Player',  color: '#f97316', emoji: '🔧' },
  replacement:  { label: 'Replacement',  color: '#888',    emoji: '📋' },
  negative:     { label: 'Negative',     color: '#ef4444', emoji: '📉' },
};

export interface MarketComparable {
  playerName: string;
  tradeDate: string;
  returnSummary: string;
  warAtTime: number;
}

export interface PlayerMarketValue {
  id: number;
  name: string;
  pos: string;
  team: string;
  age: number;
  overall: number;
  currentWAR: number;
  projectedWAR: number;
  salary: number;           // $M per year
  yearsLeft: number;
  surplusValue: number;     // $M above contract
  valueTier: ValueTier;
  marketScore: number;      // 0-100 overall tradability
  positionScarcity: number; // 0-100 how scarce the position is
  demandLevel: number;      // 0-100 how many teams want this player
  comparables: MarketComparable[];
  tradeNotes: string;
}

export interface MarketSummary {
  totalPlayers: number;
  franchiseCount: number;
  negativeCount: number;
  avgSurplus: number;
  avgMarketScore: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getValueTier(surplusValue: number, war: number): ValueTier {
  if (war >= 5 && surplusValue >= 30) return 'franchise';
  if (war >= 3 && surplusValue >= 15) return 'star';
  if (war >= 2 && surplusValue >= 5) return 'solid';
  if (war >= 1 && surplusValue >= 0) return 'role';
  if (surplusValue >= 0) return 'replacement';
  return 'negative';
}

export function getMarketSummary(players: PlayerMarketValue[]): MarketSummary {
  const n = players.length;
  return {
    totalPlayers: n,
    franchiseCount: players.filter(p => p.valueTier === 'franchise').length,
    negativeCount: players.filter(p => p.valueTier === 'negative').length,
    avgSurplus: Math.round(players.reduce((s, p) => s + p.surplusValue, 0) / n * 10) / 10,
    avgMarketScore: Math.round(players.reduce((s, p) => s + p.marketScore, 0) / n),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoMarketValues(): PlayerMarketValue[] {
  return [
    {
      id: 0, name: 'Juan Soto', pos: 'RF', team: 'NYY', age: 25, overall: 90,
      currentWAR: 6.5, projectedWAR: 7.0, salary: 31, yearsLeft: 0, surplusValue: 45,
      valueTier: 'franchise', marketScore: 95, positionScarcity: 55, demandLevel: 98,
      comparables: [
        { playerName: 'Mookie Betts', tradeDate: '2020', returnSummary: '3 top prospects (Alex Verdugo, Jeter Downs, Connor Wong)', warAtTime: 6.8 },
      ],
      tradeNotes: 'Generational talent. Free agent after season — rental premium but massive return expected.',
    },
    {
      id: 1, name: 'Corbin Burnes', pos: 'SP', team: 'BAL', age: 29, overall: 86,
      currentWAR: 4.2, projectedWAR: 4.5, salary: 15.6, yearsLeft: 0, surplusValue: 25,
      valueTier: 'star', marketScore: 85, positionScarcity: 80, demandLevel: 90,
      comparables: [
        { playerName: 'Luis Castillo', tradeDate: '2022', returnSummary: '4 prospects including Noelvi Marte', warAtTime: 3.8 },
      ],
      tradeNotes: 'Elite SP in walk year. Frontline starter arms always at premium. Multiple suitors.',
    },
    {
      id: 2, name: 'Trea Turner', pos: 'SS', team: 'PHI', age: 31, overall: 82,
      currentWAR: 3.5, projectedWAR: 3.0, salary: 30, yearsLeft: 8, surplusValue: -15,
      valueTier: 'negative', marketScore: 15, positionScarcity: 70, demandLevel: 10,
      comparables: [],
      tradeNotes: 'Negative trade value due to long-term deal. Would need to eat salary to move.',
    },
    {
      id: 3, name: 'Luis Robert Jr.', pos: 'CF', team: 'CWS', age: 26, overall: 82,
      currentWAR: 3.8, projectedWAR: 4.5, salary: 12.5, yearsLeft: 2, surplusValue: 30,
      valueTier: 'star', marketScore: 78, positionScarcity: 85, demandLevel: 82,
      comparables: [
        { playerName: 'Byron Buxton', tradeDate: 'N/A', returnSummary: 'Comparable value — similar tools, injury risk', warAtTime: 4.0 },
      ],
      tradeNotes: 'Premium talent with injury risk discount. Controlled for 2 years — excellent value if healthy.',
    },
    {
      id: 4, name: 'Andrew Chafin', pos: 'RP', team: 'ARI', age: 34, overall: 72,
      currentWAR: 1.2, projectedWAR: 1.0, salary: 5.5, yearsLeft: 0, surplusValue: 3,
      valueTier: 'role', marketScore: 55, positionScarcity: 40, demandLevel: 65,
      comparables: [
        { playerName: 'David Robertson', tradeDate: '2022', returnSummary: '1 low-level prospect', warAtTime: 1.0 },
      ],
      tradeNotes: 'Solid rental lefty reliever. Low cost to acquire. Multiple contenders interested.',
    },
    {
      id: 5, name: 'Nick Castellanos', pos: 'RF', team: 'PHI', age: 32, overall: 74,
      currentWAR: 1.8, projectedWAR: 1.5, salary: 20, yearsLeft: 3, surplusValue: -18,
      valueTier: 'negative', marketScore: 8, positionScarcity: 30, demandLevel: 5,
      comparables: [],
      tradeNotes: 'Significantly overpaid. Would need to include $30M+ in salary relief to trade.',
    },
    {
      id: 6, name: 'Mookie Betts', pos: '2B', team: 'LAD', age: 31, overall: 88,
      currentWAR: 5.5, projectedWAR: 5.0, salary: 30.4, yearsLeft: 8, surplusValue: 20,
      valueTier: 'star', marketScore: 40, positionScarcity: 60, demandLevel: 50,
      comparables: [],
      tradeNotes: 'Still elite but long-term deal limits tradability. Franchise cornerstone — unlikely to move.',
    },
  ];
}
