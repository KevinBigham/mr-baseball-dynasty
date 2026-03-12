import { describe, expect, it } from 'vitest';
import { assessFeatureReadiness } from '../../src/features/featureReadiness.ts';
import { getCoreFeatureIds } from '../../src/features/catalog.ts';

describe('feature readiness assessment', () => {
  it('marks a promoted core feature ready when enabled', () => {
    const enabled = getCoreFeatureIds();
    const result = assessFeatureReadiness('dashboard', enabled);

    expect(result.found).toBe(true);
    expect(result.ready).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('marks intake-only Claude surfaces not ready before intake merge', () => {
    const enabled = getCoreFeatureIds();
    const result = assessFeatureReadiness('front-office-briefing', enabled);

    expect(result.found).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.reasons).toContain('Feature is still in intake.');
    expect(result.reasons).toContain('Feature is not enabled for active play mode.');
    expect(result.reasons).toContain('Feature has no loader mapping yet.');
  });

  it('marks unknown features as missing', () => {
    const result = assessFeatureReadiness('unknown-feature', []);

    expect(result.found).toBe(false);
    expect(result.ready).toBe(false);
    expect(result.dependencies).toEqual([]);
  });
});
