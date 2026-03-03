import { describe, it, expect } from 'vitest';

/**
 * Tests for contract extension payroll check logic.
 * Since the payroll check is embedded in the worker (which requires Comlink),
 * we test the pure logic of the payroll guard here.
 */

describe('Contract Extension Payroll Guard (logic)', () => {
  const BUDGET = 150; // $150M in millions

  function wouldExceedBudget(
    currentPayroll: number,
    currentSalary: number,
    newSalary: number,
    budget: number,
  ): boolean {
    const newPayroll = currentPayroll + (newSalary - currentSalary);
    return newPayroll > budget * 1_000_000 * 1.15;
  }

  it('blocks extensions that push payroll over 115% of budget', () => {
    // Team at $170M payroll, budget $150M. Offer $30M extension for a $5M player.
    const over = wouldExceedBudget(170_000_000, 5_000_000, 30_000_000, BUDGET);
    // 170M + (30M - 5M) = 195M > 150M * 1.15 = 172.5M
    expect(over).toBe(true);
  });

  it('allows extensions within the 115% budget buffer', () => {
    // Team at $140M payroll, budget $150M. Offer $15M extension for a $10M player.
    const over = wouldExceedBudget(140_000_000, 10_000_000, 15_000_000, BUDGET);
    // 140M + (15M - 10M) = 145M < 172.5M
    expect(over).toBe(false);
  });

  it('handles edge case where new salary equals current salary', () => {
    // No change in payroll
    const over = wouldExceedBudget(170_000_000, 10_000_000, 10_000_000, BUDGET);
    // 170M + 0 = 170M < 172.5M
    expect(over).toBe(false);
  });
});
