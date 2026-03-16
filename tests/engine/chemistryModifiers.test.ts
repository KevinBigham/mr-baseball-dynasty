import { describe, it, expect } from 'vitest';
import {
  cohesionCloseGameBonus,
  moraleContactBonus,
  moralePitchingBonus,
  buildHalfInningChemBonuses,
} from '../../src/engine/sim/chemistryModifiers';
import type { TeamChemistryState } from '../../src/types/chemistry';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeChemState(cohesion: number, morale: number): TeamChemistryState {
  return { teamId: 1, cohesion, morale, lastUpdatedSeason: 1 };
}

// ─── cohesionCloseGameBonus (RFC 6.1) ────────────────────────────────────────

describe('cohesionCloseGameBonus', () => {
  it('returns +0.02 for cohesion >= 80', () => {
    expect(cohesionCloseGameBonus(80)).toBe(0.02);
    expect(cohesionCloseGameBonus(100)).toBe(0.02);
    expect(cohesionCloseGameBonus(90)).toBe(0.02);
  });

  it('returns 0 for cohesion 60–79', () => {
    expect(cohesionCloseGameBonus(60)).toBe(0.0);
    expect(cohesionCloseGameBonus(79)).toBe(0.0);
    expect(cohesionCloseGameBonus(70)).toBe(0.0);
  });

  it('returns -0.01 for cohesion 40–59', () => {
    expect(cohesionCloseGameBonus(40)).toBe(-0.01);
    expect(cohesionCloseGameBonus(59)).toBe(-0.01);
    expect(cohesionCloseGameBonus(50)).toBe(-0.01);
  });

  it('returns -0.03 for cohesion < 40', () => {
    expect(cohesionCloseGameBonus(39)).toBe(-0.03);
    expect(cohesionCloseGameBonus(0)).toBe(-0.03);
    expect(cohesionCloseGameBonus(20)).toBe(-0.03);
  });

  it('output is bounded within [−0.03, +0.02]', () => {
    const inputs = [0, 10, 20, 30, 39, 40, 50, 59, 60, 70, 79, 80, 90, 100];
    for (const c of inputs) {
      const b = cohesionCloseGameBonus(c);
      expect(b).toBeGreaterThanOrEqual(-0.03);
      expect(b).toBeLessThanOrEqual(0.02);
    }
  });
});

// ─── moraleContactBonus (RFC 6.2 — batting) ──────────────────────────────────

describe('moraleContactBonus', () => {
  it('returns +0.005 for morale >= 80', () => {
    expect(moraleContactBonus(80)).toBe(0.005);
    expect(moraleContactBonus(100)).toBe(0.005);
  });

  it('returns -0.005 for morale < 30', () => {
    expect(moraleContactBonus(29)).toBe(-0.005);
    expect(moraleContactBonus(0)).toBe(-0.005);
  });

  it('returns 0 for morale 30–79', () => {
    expect(moraleContactBonus(30)).toBe(0);
    expect(moraleContactBonus(50)).toBe(0);
    expect(moraleContactBonus(79)).toBe(0);
  });

  it('output is bounded within [−0.005, +0.005]', () => {
    for (const m of [0, 29, 30, 50, 79, 80, 100]) {
      const b = moraleContactBonus(m);
      expect(b).toBeGreaterThanOrEqual(-0.005);
      expect(b).toBeLessThanOrEqual(0.005);
    }
  });
});

// ─── moralePitchingBonus (RFC 6.2 — pitching) ────────────────────────────────

describe('moralePitchingBonus', () => {
  it('returns +0.003 for morale >= 80', () => {
    expect(moralePitchingBonus(80)).toBe(0.003);
    expect(moralePitchingBonus(100)).toBe(0.003);
  });

  it('returns -0.003 for morale < 30', () => {
    expect(moralePitchingBonus(29)).toBe(-0.003);
    expect(moralePitchingBonus(0)).toBe(-0.003);
  });

  it('returns 0 for morale 30–79', () => {
    expect(moralePitchingBonus(30)).toBe(0);
    expect(moralePitchingBonus(50)).toBe(0);
    expect(moralePitchingBonus(79)).toBe(0);
  });

  it('output is bounded within [−0.003, +0.003]', () => {
    for (const m of [0, 29, 30, 50, 79, 80, 100]) {
      const b = moralePitchingBonus(m);
      expect(b).toBeGreaterThanOrEqual(-0.003);
      expect(b).toBeLessThanOrEqual(0.003);
    }
  });
});

// ─── buildHalfInningChemBonuses ──────────────────────────────────────────────

describe('buildHalfInningChemBonuses', () => {
  it('returns zeros when both states are undefined', () => {
    const result = buildHalfInningChemBonuses(undefined, undefined, true);
    expect(result.batterChemBonus).toBe(0);
    expect(result.pitcherChemBonus).toBe(0);
  });

  it('returns zeros when both states are undefined (not close game)', () => {
    const result = buildHalfInningChemBonuses(undefined, undefined, false);
    expect(result.batterChemBonus).toBe(0);
    expect(result.pitcherChemBonus).toBe(0);
  });

  it('applies morale contact bonus from batting team regardless of close game', () => {
    const battingChem = makeChemState(50, 90); // morale 90 → +0.005 contact
    const result = buildHalfInningChemBonuses(battingChem, undefined, false);
    expect(result.batterChemBonus).toBeCloseTo(0.005);
    expect(result.pitcherChemBonus).toBe(0);
  });

  it('applies pitching quality bonus from pitching team', () => {
    const pitchingChem = makeChemState(50, 85); // morale 85 → +0.003 pitching quality
    const result = buildHalfInningChemBonuses(undefined, pitchingChem, false);
    expect(result.batterChemBonus).toBe(0);
    expect(result.pitcherChemBonus).toBeCloseTo(0.003);
  });

  it('applies cohesion bonus only when isCloseGame is true', () => {
    const battingChem = makeChemState(90, 50); // cohesion 90 → +0.02 in close game, morale 50 → 0 contact
    const closeResult = buildHalfInningChemBonuses(battingChem, undefined, true);
    const nonCloseResult = buildHalfInningChemBonuses(battingChem, undefined, false);

    expect(closeResult.batterChemBonus).toBeCloseTo(0.02);
    expect(nonCloseResult.batterChemBonus).toBeCloseTo(0.0);
  });

  it('stacks morale contact and close-game cohesion bonuses', () => {
    // morale 90 → +0.005 contact, cohesion 90 → +0.02 close-game
    const battingChem = makeChemState(90, 90);
    const result = buildHalfInningChemBonuses(battingChem, undefined, true);
    expect(result.batterChemBonus).toBeCloseTo(0.025); // 0.005 + 0.02
  });

  it('handles low morale and low cohesion in close game (max penalty)', () => {
    // morale 10 → -0.005 contact, cohesion 10 → -0.03 close-game
    const battingChem = makeChemState(10, 10);
    const result = buildHalfInningChemBonuses(battingChem, undefined, true);
    expect(result.batterChemBonus).toBeCloseTo(-0.035); // -0.005 + -0.03
  });

  it('is deterministic — same inputs produce same outputs', () => {
    const batting = makeChemState(75, 85);
    const pitching = makeChemState(40, 25);

    const r1 = buildHalfInningChemBonuses(batting, pitching, true);
    const r2 = buildHalfInningChemBonuses(batting, pitching, true);

    expect(r1.batterChemBonus).toBe(r2.batterChemBonus);
    expect(r1.pitcherChemBonus).toBe(r2.pitcherChemBonus);
  });

  it('does not apply cohesion bonus when isCloseGame is false even with high cohesion', () => {
    const battingChem = makeChemState(100, 50); // max cohesion but NOT a close game
    const result = buildHalfInningChemBonuses(battingChem, undefined, false);
    // Only morale contact (morale=50 → 0), no cohesion bonus
    expect(result.batterChemBonus).toBe(0);
  });

  it('neutral morale (30–79) produces zero bonuses for both teams', () => {
    const batting = makeChemState(65, 65);   // cohesion 65 → 0, morale 65 → 0
    const pitching = makeChemState(65, 65);  // morale 65 → 0
    const result = buildHalfInningChemBonuses(batting, pitching, true);
    expect(result.batterChemBonus).toBe(0);
    expect(result.pitcherChemBonus).toBe(0);
  });
});

// ─── Cap checks ──────────────────────────────────────────────────────────────

describe('chemistry modifier cap checks', () => {
  it('batterChemBonus never exceeds +0.025 (max morale + max cohesion)', () => {
    const maxChem = makeChemState(100, 100);
    const result = buildHalfInningChemBonuses(maxChem, undefined, true);
    // Max: moraleContactBonus(100)=+0.005, cohesionCloseGameBonus(100)=+0.02 → 0.025
    expect(result.batterChemBonus).toBeLessThanOrEqual(0.025);
  });

  it('batterChemBonus never goes below -0.035 (min morale + min cohesion)', () => {
    const minChem = makeChemState(0, 0);
    const result = buildHalfInningChemBonuses(minChem, undefined, true);
    // Min: moraleContactBonus(0)=-0.005, cohesionCloseGameBonus(0)=-0.03 → -0.035
    expect(result.batterChemBonus).toBeGreaterThanOrEqual(-0.035);
  });

  it('pitcherChemBonus never exceeds +0.003', () => {
    const maxChem = makeChemState(100, 100);
    const result = buildHalfInningChemBonuses(undefined, maxChem, true);
    expect(result.pitcherChemBonus).toBeLessThanOrEqual(0.003);
  });

  it('pitcherChemBonus never goes below -0.003', () => {
    const minChem = makeChemState(0, 0);
    const result = buildHalfInningChemBonuses(undefined, minChem, true);
    expect(result.pitcherChemBonus).toBeGreaterThanOrEqual(-0.003);
  });
});

// ─── Reproducibility (same seed, same chemistry → same result) ───────────────

describe('modifier reproducibility', () => {
  it('cohesionCloseGameBonus is deterministic across repeated calls', () => {
    for (const cohesion of [0, 39, 40, 59, 60, 79, 80, 100]) {
      const a = cohesionCloseGameBonus(cohesion);
      const b = cohesionCloseGameBonus(cohesion);
      expect(a).toBe(b);
    }
  });

  it('moraleContactBonus is deterministic across repeated calls', () => {
    for (const morale of [0, 29, 30, 50, 79, 80, 100]) {
      const a = moraleContactBonus(morale);
      const b = moraleContactBonus(morale);
      expect(a).toBe(b);
    }
  });

  it('moralePitchingBonus is deterministic across repeated calls', () => {
    for (const morale of [0, 29, 30, 50, 79, 80, 100]) {
      const a = moralePitchingBonus(morale);
      const b = moralePitchingBonus(morale);
      expect(a).toBe(b);
    }
  });

  it('buildHalfInningChemBonuses produces identical results for identical inputs', () => {
    const batting = makeChemState(82, 85);
    const pitching = makeChemState(38, 27);

    for (const isClose of [true, false]) {
      const r1 = buildHalfInningChemBonuses(batting, pitching, isClose);
      const r2 = buildHalfInningChemBonuses(batting, pitching, isClose);
      expect(r1.batterChemBonus).toBe(r2.batterChemBonus);
      expect(r1.pitcherChemBonus).toBe(r2.pitcherChemBonus);
    }
  });
});
