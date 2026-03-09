import { describe, expect, it } from 'vitest';
import { FEATURE_MANIFEST } from '../../src/features/featureManifest.ts';
import { buildAlphaGateResults, summarizeManifestHealth } from '../../src/features/playableReadiness.ts';

describe('playable readiness helpers', () => {
  it('marks blocker failures as not ready and preserves recommendations', () => {
    const result = buildAlphaGateResults([
      {
        gateId: 'league_seeded',
        label: 'League seeded',
        pass: false,
        blocker: true,
        evidence: 'teams=0, players=0',
        recommendation: 'Run new game first.',
      },
      {
        gateId: 'latency',
        label: 'Latency',
        pass: false,
        blocker: false,
        evidence: 'p95 over threshold',
        recommendation: 'Profile endpoints.',
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.blockers).toEqual(['league_seeded']);
    expect(result.failingGateCount).toBe(2);
    expect(result.gates[0].recommendation).toContain('new game');
  });

  it('summarizes manifest counts by status and tier', () => {
    const summary = summarizeManifestHealth(FEATURE_MANIFEST);

    const totalByStatus = Object.values(summary.statusCounts).reduce((sum, count) => sum + count, 0);
    const totalByTier = Object.values(summary.tierCounts).reduce((sum, count) => sum + count, 0);

    expect(totalByStatus).toBe(FEATURE_MANIFEST.length);
    expect(totalByTier).toBe(FEATURE_MANIFEST.length);
    expect(summary.statusCounts.promoted).toBeGreaterThan(0);
    expect(summary.tierCounts.core).toBeGreaterThan(0);
  });
});
