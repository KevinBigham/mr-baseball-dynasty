import { describe, it, expect } from 'vitest';
import {
  derivePersonality,
  derivePersonalities,
  normalizeTrait,
  toPositionGroup,
} from '../../src/engine/personalityModel';
import {
  CHEMISTRY_VERSION,
  ARCHETYPES,
  POSITION_GROUP_MAP,
  REASON_CODES,
} from '../../src/engine/chemistryContracts';
import type { PersonalityInput } from '../../src/types/chemistry';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a PersonalityInput with sensible defaults. */
function makeInput(overrides: Partial<PersonalityInput> = {}): PersonalityInput {
  return {
    workEthic: 50,
    mentalToughness: 50,
    age: 28,
    overall: 350,
    position: 'SS',
    ...overrides,
  };
}

// ─── Contract / constant sanity ──────────────────────────────────────────────

describe('chemistryContracts — constants', () => {
  it('CHEMISTRY_VERSION is 1', () => {
    expect(CHEMISTRY_VERSION).toBe(1);
  });

  it('ARCHETYPES includes all expected archetypes', () => {
    expect(ARCHETYPES).toContain('veteran_leader');
    expect(ARCHETYPES).toContain('clubhouse_cancer');
    expect(ARCHETYPES).toContain('quiet_professional');
    expect(ARCHETYPES).toContain('hot_head');
    expect(ARCHETYPES).toContain('young_star');
    expect(ARCHETYPES).toContain('neutral');
    expect(ARCHETYPES.length).toBe(6);
  });

  it('every archetype has a REASON_CODE', () => {
    for (const a of ARCHETYPES) {
      expect(REASON_CODES[a]).toBeDefined();
      expect(typeof REASON_CODES[a]).toBe('string');
    }
  });

  it('POSITION_GROUP_MAP covers all 12 positions', () => {
    const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
    for (const p of positions) {
      expect(POSITION_GROUP_MAP[p]).toBeDefined();
    }
  });
});

// ─── Trait normalization ─────────────────────────────────────────────────────

describe('normalizeTrait', () => {
  it('clamps below 0 to 0', () => {
    expect(normalizeTrait(-5)).toBe(0);
  });

  it('clamps above 100 to 100', () => {
    expect(normalizeTrait(120)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(normalizeTrait(72.6)).toBe(73);
    expect(normalizeTrait(72.4)).toBe(72);
  });

  it('passes through valid integers unchanged', () => {
    expect(normalizeTrait(50)).toBe(50);
    expect(normalizeTrait(0)).toBe(0);
    expect(normalizeTrait(100)).toBe(100);
  });
});

// ─── Position group mapping ──────────────────────────────────────────────────

describe('toPositionGroup', () => {
  it('maps infield positions to IF', () => {
    expect(toPositionGroup('1B')).toBe('IF');
    expect(toPositionGroup('2B')).toBe('IF');
    expect(toPositionGroup('3B')).toBe('IF');
    expect(toPositionGroup('SS')).toBe('IF');
  });

  it('maps outfield positions to OF', () => {
    expect(toPositionGroup('LF')).toBe('OF');
    expect(toPositionGroup('CF')).toBe('OF');
    expect(toPositionGroup('RF')).toBe('OF');
  });

  it('maps CL to RP group', () => {
    expect(toPositionGroup('CL')).toBe('RP');
  });

  it('defaults unknown positions to DH', () => {
    expect(toPositionGroup('UNKNOWN')).toBe('DH');
  });
});

// ─── Deterministic archetype derivation ──────────────────────────────────────

describe('derivePersonality — archetype classification', () => {
  it('classifies Veteran Leader: old, high ethic, high toughness', () => {
    const result = derivePersonality(makeInput({
      age: 34,
      workEthic: 85,
      mentalToughness: 80,
      overall: 420,
    }));
    expect(result.archetype).toBe('veteran_leader');
    expect(result.reasonCode).toBe(REASON_CODES.veteran_leader);
  });

  it('classifies Clubhouse Cancer: low ethic, low toughness', () => {
    const result = derivePersonality(makeInput({
      workEthic: 20,
      mentalToughness: 25,
      age: 29,
      overall: 380,
    }));
    expect(result.archetype).toBe('clubhouse_cancer');
  });

  it('classifies Hot Head: very low mental toughness (but not cancer)', () => {
    const result = derivePersonality(makeInput({
      workEthic: 60,
      mentalToughness: 20,
      age: 27,
      overall: 350,
    }));
    expect(result.archetype).toBe('hot_head');
  });

  it('classifies Young Star: young, high overall, decent ethic', () => {
    const result = derivePersonality(makeInput({
      age: 23,
      overall: 450,
      workEthic: 65,
      mentalToughness: 55,
    }));
    expect(result.archetype).toBe('young_star');
  });

  it('classifies Quiet Professional: solid ethic and toughness', () => {
    const result = derivePersonality(makeInput({
      workEthic: 70,
      mentalToughness: 65,
      age: 28,
      overall: 350,
    }));
    expect(result.archetype).toBe('quiet_professional');
  });

  it('classifies Neutral when no archetype criteria are met', () => {
    const result = derivePersonality(makeInput({
      workEthic: 45,
      mentalToughness: 45,
      age: 28,
      overall: 300,
    }));
    expect(result.archetype).toBe('neutral');
  });
});

// ─── Priority / edge cases ───────────────────────────────────────────────────

describe('derivePersonality — priority and edge cases', () => {
  it('Clubhouse Cancer wins over Hot Head when both could match', () => {
    // workEthic 25 (<=30) AND mentalToughness 25 (<=40 AND <=30)
    const result = derivePersonality(makeInput({
      workEthic: 25,
      mentalToughness: 25,
    }));
    expect(result.archetype).toBe('clubhouse_cancer');
  });

  it('Veteran Leader wins over Quiet Professional for age 30+ high-trait player', () => {
    const result = derivePersonality(makeInput({
      age: 32,
      workEthic: 80,
      mentalToughness: 80,
    }));
    expect(result.archetype).toBe('veteran_leader');
  });

  it('old veteran with high workEthic and high toughness → veteran_leader', () => {
    const result = derivePersonality(makeInput({
      age: 38,
      workEthic: 90,
      mentalToughness: 95,
      overall: 300,
      position: 'SP',
    }));
    expect(result.archetype).toBe('veteran_leader');
    expect(result.positionGroup).toBe('SP');
  });

  it('low workEthic, low toughness → clubhouse_cancer regardless of age/overall', () => {
    const result = derivePersonality(makeInput({
      age: 22,
      workEthic: 10,
      mentalToughness: 15,
      overall: 500,
    }));
    expect(result.archetype).toBe('clubhouse_cancer');
  });

  it('young high-overall player with mediocre ethic → not young_star (ethic < 50)', () => {
    const result = derivePersonality(makeInput({
      age: 22,
      overall: 480,
      workEthic: 40,
      mentalToughness: 50,
    }));
    expect(result.archetype).not.toBe('young_star');
  });

  it('middling neutral player — no strong signals', () => {
    const result = derivePersonality(makeInput({
      workEthic: 50,
      mentalToughness: 50,
      age: 27,
      overall: 320,
      position: 'RF',
    }));
    expect(result.archetype).toBe('neutral');
    expect(result.positionGroup).toBe('OF');
  });

  it('boundary: workEthic exactly at cancer threshold (30) still triggers cancer if toughness low', () => {
    const result = derivePersonality(makeInput({
      workEthic: 30,
      mentalToughness: 40,
    }));
    expect(result.archetype).toBe('clubhouse_cancer');
  });

  it('boundary: mentalToughness exactly at hot_head threshold (30) triggers hot_head', () => {
    const result = derivePersonality(makeInput({
      workEthic: 50,
      mentalToughness: 30,
    }));
    expect(result.archetype).toBe('hot_head');
  });

  it('boundary: age exactly 25, overall 400, ethic 50 → young_star', () => {
    const result = derivePersonality(makeInput({
      age: 25,
      overall: 400,
      workEthic: 50,
      mentalToughness: 50,
    }));
    expect(result.archetype).toBe('young_star');
  });
});

// ─── Output shape ────────────────────────────────────────────────────────────

describe('derivePersonality — output structure', () => {
  it('always includes version equal to CHEMISTRY_VERSION', () => {
    const result = derivePersonality(makeInput());
    expect(result.version).toBe(CHEMISTRY_VERSION);
  });

  it('always includes a valid archetype from ARCHETYPES', () => {
    const result = derivePersonality(makeInput());
    expect((ARCHETYPES as readonly string[]).includes(result.archetype)).toBe(true);
  });

  it('always includes a reasonCode string', () => {
    const result = derivePersonality(makeInput());
    expect(typeof result.reasonCode).toBe('string');
    expect(result.reasonCode.length).toBeGreaterThan(0);
  });

  it('always includes a valid positionGroup', () => {
    const result = derivePersonality(makeInput());
    expect(['IF', 'OF', 'SP', 'RP', 'C', 'DH']).toContain(result.positionGroup);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('derivePersonality — determinism', () => {
  it('same input produces identical output on repeated calls', () => {
    const input = makeInput({ age: 31, workEthic: 75, mentalToughness: 80, overall: 410 });
    const a = derivePersonality(input);
    const b = derivePersonality(input);
    expect(a).toEqual(b);
  });

  it('same input produces identical output across 100 iterations', () => {
    const input = makeInput({ age: 24, workEthic: 55, mentalToughness: 45, overall: 420 });
    const first = derivePersonality(input);
    for (let i = 0; i < 100; i++) {
      expect(derivePersonality(input)).toEqual(first);
    }
  });
});

// ─── Batch helper ────────────────────────────────────────────────────────────

describe('derivePersonalities — batch', () => {
  it('returns one profile per input', () => {
    const inputs = [
      makeInput({ age: 35, workEthic: 80, mentalToughness: 80 }),
      makeInput({ workEthic: 10, mentalToughness: 10 }),
      makeInput(),
    ];
    const results = derivePersonalities(inputs);
    expect(results.length).toBe(3);
    expect(results[0].archetype).toBe('veteran_leader');
    expect(results[1].archetype).toBe('clubhouse_cancer');
  });

  it('returns empty array for empty input', () => {
    expect(derivePersonalities([])).toEqual([]);
  });
});

// ─── Trait normalization in derivation context ───────────────────────────────

describe('derivePersonality — trait normalization during derivation', () => {
  it('handles out-of-range workEthic (negative) gracefully', () => {
    const result = derivePersonality(makeInput({ workEthic: -10, mentalToughness: -5 }));
    // Both clamped to 0, which is <= cancer thresholds
    expect(result.archetype).toBe('clubhouse_cancer');
  });

  it('handles out-of-range traits (above 100) gracefully', () => {
    const result = derivePersonality(makeInput({
      workEthic: 150,
      mentalToughness: 120,
      age: 32,
    }));
    // Clamped to 100, which qualifies for veteran_leader
    expect(result.archetype).toBe('veteran_leader');
  });
});
