/**
 * Round 3 — The Pulse: Game loop pacing tests.
 * Tests decision engine, pacing controls, and monthly recap alerts.
 */
import { describe, it, expect } from 'vitest';
import { generateSpotlightDecisions } from '../../src/engine/decisionEngine';

// ─── Decision Engine ────────────────────────────────────────────────────────

describe('generateSpotlightDecisions', () => {
  const baseCtx = {
    userTeamId: 1,
    injuries: 0,
    rosterSpace40Man: 35,
    winsAboveFive: 0,
    pendingEvent: null as any,
    currentSegment: 0,
    interrupts: [] as any[],
  };

  it('returns empty array when no decisions needed', () => {
    const decisions = generateSpotlightDecisions(baseCtx);
    expect(decisions).toEqual([]);
  });

  it('surfaces injury decision when 2+ players on IL', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, injuries: 3 });
    expect(decisions.length).toBeGreaterThanOrEqual(1);
    const injury = decisions.find(d => d.type === 'injury');
    expect(injury).toBeDefined();
    expect(injury!.headline).toContain('3 PLAYERS ON INJURED LIST');
  });

  it('surfaces roster crunch when 40-man is at 39+', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, rosterSpace40Man: 39 });
    const crunch = decisions.find(d => d.type === 'callup');
    expect(crunch).toBeDefined();
    expect(crunch!.headline).toContain('39/40');
  });

  it('surfaces roster crunch with urgent text at 40/40', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, rosterSpace40Man: 40 });
    const crunch = decisions.find(d => d.type === 'callup');
    expect(crunch).toBeDefined();
    expect(crunch!.context).toContain('FULL');
  });

  it('surfaces trade deadline decision at segment 2', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, currentSegment: 2, winsAboveFive: 10 });
    const deadline = decisions.find(d => d.type === 'deadline');
    expect(deadline).toBeDefined();
    expect(deadline!.headline).toContain('TRADE DEADLINE');
  });

  it('surfaces buyer vs seller decisions based on record', () => {
    // Buyer (winning team)
    const buyer = generateSpotlightDecisions({ ...baseCtx, currentSegment: 2, winsAboveFive: 15 });
    const buyDecision = buyer.find(d => d.type === 'deadline');
    expect(buyDecision!.options[0].label).toContain('impact');

    // Seller (losing team)
    const seller = generateSpotlightDecisions({ ...baseCtx, currentSegment: 2, winsAboveFive: -10 });
    const sellDecision = seller.find(d => d.type === 'deadline');
    expect(sellDecision!.options[0].label).toContain('Sell');
  });

  it('surfaces September callup decision', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, pendingEvent: 'callups' });
    const callups = decisions.find(d => d.type === 'callup');
    expect(callups).toBeDefined();
    expect(callups!.headline).toContain('SEPTEMBER');
  });

  it('surfaces cold streak rotation decision', () => {
    const decisions = generateSpotlightDecisions({
      ...baseCtx,
      interrupts: [{ type: 'cold_streak', headline: 'Team Slumping', detail: '3-12 over last 15' }],
    });
    const streak = decisions.find(d => d.type === 'rotation');
    expect(streak).toBeDefined();
    expect(streak!.headline).toContain('SLUMP');
  });

  it('returns at most 3 decisions', () => {
    // Trigger everything
    const decisions = generateSpotlightDecisions({
      ...baseCtx,
      injuries: 5,
      rosterSpace40Man: 40,
      pendingEvent: 'deadline',
      currentSegment: 2,
      interrupts: [{ type: 'cold_streak', headline: 'Slump', detail: '2-8' }],
    });
    expect(decisions.length).toBeLessThanOrEqual(3);
  });

  it('each decision has required fields', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, injuries: 3, currentSegment: 2 });
    for (const d of decisions) {
      expect(d.id).toBeTruthy();
      expect(d.type).toBeTruthy();
      expect(d.headline).toBeTruthy();
      expect(d.context).toBeTruthy();
      expect(d.options.length).toBeGreaterThanOrEqual(1);
      for (const opt of d.options) {
        expect(opt.label).toBeTruthy();
        expect(opt.description).toBeTruthy();
      }
    }
  });

  it('deadline pending event also triggers deadline decision', () => {
    const decisions = generateSpotlightDecisions({ ...baseCtx, pendingEvent: 'deadline', winsAboveFive: 5 });
    const deadline = decisions.find(d => d.type === 'deadline');
    expect(deadline).toBeDefined();
  });
});
