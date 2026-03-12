import { describe, it, expect } from 'vitest';
import { bonusesFromCoaching } from '../../src/engine/staffEffects';
import { generateAllCoachingStaffs } from '../../src/engine/ai/coachingStaff';
import { createPRNG } from '../../src/engine/math/prng';

describe('bonusesFromCoaching — bridge from simple quality to StaffBonuses', () => {
  it('average coaching (0.5/0.5) returns neutral bonuses', () => {
    const b = bonusesFromCoaching({ hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 });
    expect(b.hitterDevMultiplier).toBe(1.0);
    expect(b.pitcherDevMultiplier).toBe(1.0);
    expect(b.injuryRateMultiplier).toBe(1.0);
    expect(b.moraleBonus).toBe(0);
  });

  it('above-average coaching produces positive bonuses', () => {
    const b = bonusesFromCoaching({ hittingCoachQuality: 0.7, pitchingCoachQuality: 0.7 });
    expect(b.hitterDevMultiplier).toBeGreaterThan(1.0);
    expect(b.pitcherDevMultiplier).toBeGreaterThan(1.0);
    expect(b.injuryRateMultiplier).toBeLessThan(1.0);
    expect(b.moraleBonus).toBeGreaterThan(0);
  });

  it('below-average coaching produces penalties', () => {
    const b = bonusesFromCoaching({ hittingCoachQuality: 0.3, pitchingCoachQuality: 0.3 });
    expect(b.hitterDevMultiplier).toBeLessThan(1.0);
    expect(b.pitcherDevMultiplier).toBeLessThan(1.0);
    expect(b.injuryRateMultiplier).toBeGreaterThan(1.0);
  });

  it('asymmetric coaching affects hitter/pitcher dev independently', () => {
    const b = bonusesFromCoaching({ hittingCoachQuality: 0.7, pitchingCoachQuality: 0.3 });
    expect(b.hitterDevMultiplier).toBeGreaterThan(b.pitcherDevMultiplier);
  });

  it('all values within documented bounds across all tier combos', () => {
    for (const hq of [0.3, 0.5, 0.7]) {
      for (const pq of [0.3, 0.5, 0.7]) {
        const b = bonusesFromCoaching({ hittingCoachQuality: hq, pitchingCoachQuality: pq });
        expect(b.scoutingAccuracy).toBeGreaterThanOrEqual(0.5);
        expect(b.scoutingAccuracy).toBeLessThanOrEqual(1.5);
        expect(b.hitterDevMultiplier).toBeGreaterThanOrEqual(0.7);
        expect(b.hitterDevMultiplier).toBeLessThanOrEqual(1.3);
        expect(b.pitcherDevMultiplier).toBeGreaterThanOrEqual(0.7);
        expect(b.pitcherDevMultiplier).toBeLessThanOrEqual(1.3);
        expect(b.injuryRateMultiplier).toBeGreaterThanOrEqual(0.7);
        expect(b.injuryRateMultiplier).toBeLessThanOrEqual(1.3);
        expect(b.moraleBonus).toBeGreaterThanOrEqual(0);
        expect(b.moraleBonus).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('generateAllCoachingStaffs', () => {
  it('generates coaching for all teams', () => {
    const ids = Array.from({ length: 30 }, (_, i) => i + 1);
    const [staffs] = generateAllCoachingStaffs(ids, createPRNG(42));
    expect(staffs.size).toBe(30);
  });

  it('produces varied quality across teams', () => {
    const ids = Array.from({ length: 30 }, (_, i) => i + 1);
    const [staffs] = generateAllCoachingStaffs(ids, createPRNG(42));
    const qualities = new Set(Array.from(staffs.values()).map(s => s.hittingCoachQuality));
    expect(qualities.size).toBeGreaterThan(1);
  });

  it('is deterministic', () => {
    const ids = [1, 2, 3, 4, 5];
    const [s1] = generateAllCoachingStaffs(ids, createPRNG(99));
    const [s2] = generateAllCoachingStaffs(ids, createPRNG(99));
    for (const id of ids) {
      expect(s1.get(id)!.hittingCoachQuality).toBe(s2.get(id)!.hittingCoachQuality);
      expect(s1.get(id)!.pitchingCoachQuality).toBe(s2.get(id)!.pitchingCoachQuality);
    }
  });
});
