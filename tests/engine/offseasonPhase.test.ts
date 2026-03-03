import { describe, it, expect } from 'vitest';
import {
  OFFSEASON_PHASE_ORDER,
  OFFSEASON_PHASE_LABELS,
  type OffseasonPhase,
} from '../../src/types/offseason';

describe('Offseason Phase Types', () => {
  it('defines exactly 7 phases in order', () => {
    expect(OFFSEASON_PHASE_ORDER).toHaveLength(7);
    expect(OFFSEASON_PHASE_ORDER).toEqual([
      'arbitration', 'waivers', 'annual_draft',
      'rule5', 'free_agency', 'trading', 'summary',
    ]);
  });

  it('starts with arbitration and ends with summary', () => {
    expect(OFFSEASON_PHASE_ORDER[0]).toBe('arbitration');
    expect(OFFSEASON_PHASE_ORDER[OFFSEASON_PHASE_ORDER.length - 1]).toBe('summary');
  });

  it('has a label for every phase', () => {
    for (const phase of OFFSEASON_PHASE_ORDER) {
      expect(OFFSEASON_PHASE_LABELS[phase]).toBeTruthy();
      expect(typeof OFFSEASON_PHASE_LABELS[phase]).toBe('string');
    }
  });

  it('has no duplicate phases', () => {
    const unique = new Set(OFFSEASON_PHASE_ORDER);
    expect(unique.size).toBe(OFFSEASON_PHASE_ORDER.length);
  });

  it('all label values are human-readable', () => {
    const labels = Object.values(OFFSEASON_PHASE_LABELS);
    for (const label of labels) {
      expect(label.length).toBeGreaterThan(3);
      // First letter should be capitalized
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });

  it('arbitration happens before free agency', () => {
    const arbIdx = OFFSEASON_PHASE_ORDER.indexOf('arbitration');
    const faIdx = OFFSEASON_PHASE_ORDER.indexOf('free_agency');
    expect(arbIdx).toBeLessThan(faIdx);
  });

  it('annual draft happens before rule5', () => {
    const draftIdx = OFFSEASON_PHASE_ORDER.indexOf('annual_draft');
    const rule5Idx = OFFSEASON_PHASE_ORDER.indexOf('rule5');
    expect(draftIdx).toBeLessThan(rule5Idx);
  });

  it('type OffseasonPhase accepts all phase values', () => {
    const phases: OffseasonPhase[] = [
      'arbitration', 'waivers', 'annual_draft',
      'rule5', 'free_agency', 'trading', 'summary',
    ];
    expect(phases).toHaveLength(7);
  });
});
