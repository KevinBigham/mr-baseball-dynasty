/**
 * Round 7: War Room — Tests
 */
import { describe, it, expect } from 'vitest';
import { generateLeagueTrades, generateTransactionTicker, isDeadlineMode } from '../../src/engine/warRoom';

describe('War Room — Deadline Mode', () => {
  it('segments 1 and 2 are deadline mode', () => {
    expect(isDeadlineMode(1)).toBe(true);
    expect(isDeadlineMode(2)).toBe(true);
  });
  it('other segments are not deadline mode', () => {
    expect(isDeadlineMode(0)).toBe(false);
    expect(isDeadlineMode(3)).toBe(false);
    expect(isDeadlineMode(4)).toBe(false);
  });
});

describe('War Room — League Trades', () => {
  it('generates requested number of trades', () => {
    const trades = generateLeagueTrades(2026, 2, 5);
    expect(trades.length).toBeGreaterThanOrEqual(4); // some may skip if buyer===seller
    expect(trades.length).toBeLessThanOrEqual(5);
  });
  it('each trade has required fields', () => {
    const trades = generateLeagueTrades(2026, 1, 3);
    for (const t of trades) {
      expect(t.buyerAbbr).toBeTruthy();
      expect(t.sellerAbbr).toBeTruthy();
      expect(t.playerMoved).toBeTruthy();
      expect(t.headline).toBeTruthy();
      expect(t.prospectsSent).toBeGreaterThanOrEqual(1);
    }
  });
  it('buyer and seller are different teams', () => {
    const trades = generateLeagueTrades(2026, 2, 10);
    for (const t of trades) {
      expect(t.buyerAbbr).not.toBe(t.sellerAbbr);
    }
  });
  it('is deterministic', () => {
    const a = generateLeagueTrades(2026, 2, 5);
    const b = generateLeagueTrades(2026, 2, 5);
    expect(a).toEqual(b);
  });
});

describe('War Room — Transaction Ticker', () => {
  it('deadline phase produces more ticks', () => {
    const deadline = generateTransactionTicker(2026, 2, 'deadline');
    const regular = generateTransactionTicker(2026, 0, 'season');
    expect(deadline.length).toBeGreaterThan(regular.length);
  });
  it('each tick has required fields', () => {
    const ticks = generateTransactionTicker(2026, 1, 'deadline');
    for (const t of ticks) {
      expect(t.headline).toBeTruthy();
      expect(t.type).toBeTruthy();
      expect(t.teamAbbrs.length).toBeGreaterThan(0);
    }
  });
  it('offseason ticks include signings', () => {
    const ticks = generateTransactionTicker(2026, 0, 'offseason');
    expect(ticks.some(t => t.type === 'signing')).toBe(true);
  });
});
