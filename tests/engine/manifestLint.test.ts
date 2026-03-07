import { describe, expect, it } from 'vitest';
import type { FeatureManifestEntry } from '../../src/features/catalog.ts';
import { lintFeatureManifest } from '../../src/features/manifestLint.ts';

function baseManifest(): FeatureManifestEntry[] {
  return [
    {
      id: 'a',
      title: 'A',
      group: 'home',
      tier: 'core',
      status: 'promoted',
      owner: 'core',
      loader: 'dashboard',
      deps: [],
      sinceWave: 1,
      navLabel: 'A',
      showInNav: true,
      corePriority: 1,
      intakePack: 'pack-a',
      riskScore: 10,
      supportTier: 'official',
      telemetryKey: 'feature.a',
    },
    {
      id: 'b',
      title: 'B',
      group: 'team',
      tier: 'advanced',
      status: 'validated',
      owner: 'codex',
      loader: 'roster',
      deps: ['a'],
      sinceWave: 2,
      navLabel: 'B',
      showInNav: true,
      corePriority: 2,
      intakePack: 'pack-b',
      riskScore: 20,
      supportTier: 'beta',
      telemetryKey: 'feature.b',
    },
  ];
}

describe('manifest lint', () => {
  it('passes valid minimal manifest', () => {
    const result = lintFeatureManifest(baseManifest());
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('allows intake entries to omit loader mappings without duplicate-loader warnings', () => {
    const manifest = baseManifest();
    manifest.push({
      ...manifest[1],
      id: 'c',
      title: 'C',
      loader: null,
      status: 'intake',
      tier: 'experimental',
      telemetryKey: 'feature.c',
    });
    manifest.push({
      ...manifest[1],
      id: 'd',
      title: 'D',
      loader: null,
      status: 'intake',
      tier: 'experimental',
      telemetryKey: 'feature.d',
    });

    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'duplicate-loader-key')).toBe(false);
  });

  it('detects circular dependency', () => {
    const manifest = baseManifest();
    manifest[0].deps = ['b'];
    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'circular-dependency')).toBe(true);
  });

  it('detects invalid dependency ids', () => {
    const manifest = baseManifest();
    manifest[1].deps = ['missing'];
    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-dependency-id')).toBe(true);
  });

  it('detects invalid telemetry keys', () => {
    const manifest = baseManifest();
    manifest[1].telemetryKey = 'BAD_KEY';
    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-telemetry-key')).toBe(true);
  });

  it('detects invalid intake pack values', () => {
    const manifest = baseManifest();
    manifest[1].intakePack = 'pack-z' as unknown as FeatureManifestEntry['intakePack'];
    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-intake-pack')).toBe(true);
  });

  it('detects invalid support tier values', () => {
    const manifest = baseManifest();
    manifest[1].supportTier = 'enterprise' as unknown as FeatureManifestEntry['supportTier'];
    const result = lintFeatureManifest(manifest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'invalid-support-tier')).toBe(true);
  });
});
