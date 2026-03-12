/**
 * Team financial modeling.
 * Assigns market sizes based on team ID for budget differentiation.
 * Large markets get more payroll, small markets compete on development.
 */

export type MarketSize = 'large' | 'medium' | 'small';

export interface MarketBudget {
  marketSize: MarketSize;
  payrollTarget: number;
  hardCap: number;
}

// Large market teams (roughly: big cities, historical big spenders)
const LARGE_MARKET_IDS = new Set([1, 2, 5, 6, 9, 14, 17, 21, 25, 27]);
// Small market teams (roughly: smaller cities)
const SMALL_MARKET_IDS = new Set([4, 8, 11, 13, 16, 19, 22, 24, 28, 30]);

const MARKET_CONFIGS: Record<MarketSize, { payrollTarget: number; hardCap: number }> = {
  large:  { payrollTarget: 220_000_000, hardCap: 300_000_000 },
  medium: { payrollTarget: 160_000_000, hardCap: 240_000_000 },
  small:  { payrollTarget: 110_000_000, hardCap: 180_000_000 },
};

export function assignMarketSizes(teamIds: number[]): Map<number, MarketBudget> {
  const budgets = new Map<number, MarketBudget>();
  for (const id of teamIds) {
    let marketSize: MarketSize = 'medium';
    if (LARGE_MARKET_IDS.has(id)) marketSize = 'large';
    else if (SMALL_MARKET_IDS.has(id)) marketSize = 'small';

    const config = MARKET_CONFIGS[marketSize];
    budgets.set(id, {
      marketSize,
      payrollTarget: config.payrollTarget,
      hardCap: config.hardCap,
    });
  }
  return budgets;
}
