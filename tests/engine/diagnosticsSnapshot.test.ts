import { describe, expect, it } from 'vitest';
import { buildAlphaGateResults } from '../../src/features/playableReadiness.ts';

describe('diagnostics/readiness contracts', () => {
  it('includes machine-readable evidence and recommendation on every gate', () => {
    const result = buildAlphaGateResults([
      {
        gateId: 'smoke',
        label: 'Smoke flow evidence',
        pass: true,
        blocker: true,
        evidence: 'steps=6; blockers=none',
        recommendation: 'Keep smoke flow contract in sync with tests.',
      },
      {
        gateId: 'load',
        label: 'Load path',
        pass: false,
        blocker: true,
        evidence: 'No save manifest available',
        recommendation: 'Create a save before readiness check.',
      },
    ]);

    expect(result.gates).toHaveLength(2);
    for (const gate of result.gates) {
      expect(gate.evidence.length).toBeGreaterThan(0);
      expect(gate.recommendation.length).toBeGreaterThan(0);
    }
    expect(result.ok).toBe(false);
    expect(result.blockers).toEqual(['load']);
  });
});
