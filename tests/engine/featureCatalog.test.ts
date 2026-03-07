import { describe, expect, it } from 'vitest';
import {
  FEATURE_MANIFEST,
  INTAKE_PACKS,
  getFeatureManifestEntry,
  getCoreFeatureIds,
  getNavigableFeatures,
  isFeatureId,
} from '../../src/features/catalog.ts';
import { lintFeatureManifest } from '../../src/features/manifestLint.ts';

describe('feature catalog', () => {
  it('has unique feature IDs', () => {
    const ids = FEATURE_MANIFEST.map((entry) => entry.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('core mode hides non-core navigable features', () => {
    const coreIds = getNavigableFeatures('core').map((entry) => entry.id);
    expect(coreIds.includes('dashboard')).toBe(true);
    expect(coreIds.includes('leaderboards')).toBe(false);
  });

  it('all mode includes advanced navigable features', () => {
    const allIds = getNavigableFeatures('all').map((entry) => entry.id);
    expect(allIds.includes('leaderboards')).toBe(true);
  });

  it('core feature list is registered and valid', () => {
    for (const id of getCoreFeatureIds()) {
      expect(isFeatureId(id)).toBe(true);
    }
  });

  it('manifest lint passes without blocking errors', () => {
    const result = lintFeatureManifest(FEATURE_MANIFEST);
    expect(result.ok).toBe(true);
  });

  it('all features declare telemetry and support tiers', () => {
    for (const feature of FEATURE_MANIFEST) {
      expect(feature.telemetryKey.startsWith('feature.')).toBe(true);
      expect(['official', 'beta', 'community']).toContain(feature.supportTier);
    }
  });

  it('intake pack list includes pack-f for forward intake compatibility', () => {
    expect(INTAKE_PACKS.includes('pack-f')).toBe(true);
  });

  it('records Claude Sprint 01 surfaces as intake-only manifest entries', () => {
    const briefing = getFeatureManifestEntry('front-office-briefing');
    expect(briefing).toBeDefined();
    expect(briefing?.status).toBe('intake');
    expect(briefing?.loader).toBeNull();
  });
});
