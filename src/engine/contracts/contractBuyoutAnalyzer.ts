/**
 * contractBuyoutAnalyzer.ts – Contract Buyout Analyzer
 *
 * Evaluates whether to buy out, keep, or restructure player contracts.
 * Computes savings over term, dead money impact, and generates
 * actionable recommendations for each contract option.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type BuyoutRecommendation = 'buy_out' | 'keep' | 'restructure';

export interface BuyoutOption {
  id: string;
  playerName: string;
  position: string;
  age: number;
  currentAAV: number;         // $M per year
  yearsRemaining: number;
  buyoutCost: number;         // $M one-time
  deadMoney: number;          // $M that counts against cap/luxury
  savingsOverTerm: number;    // $M saved if bought out vs keeping
  recommendation: BuyoutRecommendation;
  projectedWAR: number;
  marketValue: number;        // estimated replacement cost $M AAV
  notes: string;
}

export interface BuyoutAnalysis {
  teamName: string;
  totalCommitted: number;     // $M total remaining commitment
  options: BuyoutOption[];
  totalPotentialSavings: number; // $M if all recommended buyouts executed
  buyoutCandidates: number;
  keepCandidates: number;
  restructureCandidates: number;
}

export const REC_LABELS: Record<BuyoutRecommendation, { label: string; color: string }> = {
  buy_out: { label: 'BUY OUT', color: '#ef4444' },
  keep: { label: 'KEEP', color: '#22c55e' },
  restructure: { label: 'RESTRUCTURE', color: '#eab308' },
};

// ── Logic ──────────────────────────────────────────────────────────────────

export function computeSavings(aav: number, yearsLeft: number, buyoutCost: number): number {
  return Math.round((aav * yearsLeft - buyoutCost) * 10) / 10;
}

export function computeDeadMoney(aav: number, yearsLeft: number, buyoutCost: number): number {
  // Dead money is typically the buyout cost + prorated signing bonus remaining
  return Math.round(buyoutCost * 10) / 10;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface BuyoutSeed {
  name: string;
  pos: string;
  age: number;
  aav: number;
  yrs: number;
  buyout: number;
  dead: number;
  war: number;
  market: number;
  rec: BuyoutRecommendation;
  notes: string;
}

const BUYOUT_SEEDS: BuyoutSeed[] = [
  {
    name: 'Victor Castellanos', pos: 'SP', age: 34, aav: 24, yrs: 3, buyout: 6, dead: 6,
    war: 1.2, market: 10, rec: 'buy_out',
    notes: 'Declining fastball velocity and rising ERA. $24M AAV for ~1 WAR is extreme overpay. Buyout saves $66M over 3 years.',
  },
  {
    name: 'Andre Mitchell', pos: 'OF', age: 32, aav: 18, yrs: 2, buyout: 4, dead: 4,
    war: 2.5, market: 14, rec: 'keep',
    notes: 'Still productive at $18M for 2.5 WAR. Market replacement would cost $14M for similar production. Keep and ride the value.',
  },
  {
    name: 'Russell Thornton', pos: '3B', age: 35, aav: 20, yrs: 2, buyout: 5, dead: 5,
    war: 0.8, market: 6, rec: 'buy_out',
    notes: 'Power numbers cratered last season. $20M/yr for sub-1 WAR is untenable. Buyout at $5M and find a replacement at $6M AAV.',
  },
  {
    name: 'James Whitaker', pos: 'RP', age: 33, aav: 14, yrs: 1, buyout: 2, dead: 2,
    war: 1.8, market: 12, rec: 'keep',
    notes: 'Elite setup man still posting strong peripherals. $14M for final year is reasonable. Let the contract expire naturally.',
  },
  {
    name: 'Diego Santana', pos: 'SS', age: 31, aav: 28, yrs: 4, buyout: 10, dead: 10,
    war: 3.5, market: 22, rec: 'restructure',
    notes: 'Star player but AAV is above market. Restructure to lower AAV with incentives. Could save $8M/yr while keeping him happy.',
  },
  {
    name: 'Patrick O\'Brien', pos: 'C', age: 34, aav: 12, yrs: 2, buyout: 3, dead: 3,
    war: 0.5, market: 4, rec: 'buy_out',
    notes: 'Defensive skills have eroded significantly. Framing metrics in steep decline. $12M for backup-level production warrants buyout.',
  },
  {
    name: 'Marcus Langford', pos: 'SP', age: 30, aav: 22, yrs: 3, buyout: 8, dead: 8,
    war: 3.2, market: 20, rec: 'keep',
    notes: 'Mid-rotation workhorse with consistent 3+ WAR seasons. $22M AAV is at market rate. No reason to disrupt.',
  },
  {
    name: 'Troy Benson', pos: 'OF', age: 33, aav: 16, yrs: 2, buyout: 4, dead: 4,
    war: 1.0, market: 7, rec: 'restructure',
    notes: 'Still has defensive value but bat has declined. Restructure to $10M base with playing time bonuses to align pay with performance.',
  },
];

export function generateDemoBuyoutAnalysis(): BuyoutAnalysis {
  const options: BuyoutOption[] = BUYOUT_SEEDS.map((seed, i) => {
    const savings = computeSavings(seed.aav, seed.yrs, seed.buyout);
    return {
      id: `ba-${i}`,
      playerName: seed.name,
      position: seed.pos,
      age: seed.age,
      currentAAV: seed.aav,
      yearsRemaining: seed.yrs,
      buyoutCost: seed.buyout,
      deadMoney: seed.dead,
      savingsOverTerm: savings,
      recommendation: seed.rec,
      projectedWAR: seed.war,
      marketValue: seed.market,
      notes: seed.notes,
    };
  });

  const totalCommitted = options.reduce((s, o) => s + o.currentAAV * o.yearsRemaining, 0);
  const buyouts = options.filter(o => o.recommendation === 'buy_out');
  const keeps = options.filter(o => o.recommendation === 'keep');
  const restructures = options.filter(o => o.recommendation === 'restructure');
  const totalSavings = buyouts.reduce((s, o) => s + o.savingsOverTerm, 0);

  return {
    teamName: 'Philadelphia Phillies',
    totalCommitted: Math.round(totalCommitted),
    options,
    totalPotentialSavings: Math.round(totalSavings * 10) / 10,
    buyoutCandidates: buyouts.length,
    keepCandidates: keeps.length,
    restructureCandidates: restructures.length,
  };
}
