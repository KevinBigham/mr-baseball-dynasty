/**
 * Team financial modeling.
 * Stub — Sprint 04 branch surgery.
 */

export type MarketSize = 'large' | 'medium' | 'small';

export interface MarketBudget {
  marketSize: MarketSize;
  payrollTarget: number;
  hardCap: number;
}

export function assignMarketSizes(teamIds: number[]): Map<number, MarketBudget> {
  const budgets = new Map<number, MarketBudget>();
  for (const id of teamIds) {
    budgets.set(id, {
      marketSize: 'medium',
      payrollTarget: 160_000_000,
      hardCap: 230_000_000,
    });
  }
  return budgets;
}
