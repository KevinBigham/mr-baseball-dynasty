import type {
  FeatureDependencyHealth,
  FeatureManifestEntry,
  FeatureStatus,
  FeatureTier,
} from './featureTypes.ts';
import {
  getFeatureManifestEntry,
  isFeatureId,
  type FeatureId,
} from './featureManifest.ts';

export interface FeatureReadinessAssessment {
  featureId: string;
  found: boolean;
  ready: boolean;
  tier?: FeatureTier;
  status?: FeatureStatus;
  reasons: string[];
  dependencies: FeatureDependencyHealth[];
}

export function buildFeatureDependencyHealth(
  feature: FeatureManifestEntry,
  enabledFeatures: readonly string[],
): FeatureDependencyHealth[] {
  return feature.deps.map((depId) => {
    const found = isFeatureId(depId) && Boolean(getFeatureManifestEntry(depId as FeatureId));
    const enabled = found ? enabledFeatures.includes(depId) : false;
    return {
      featureId: depId,
      found,
      enabled,
      ready: found && enabled,
    };
  });
}

export function assessFeatureReadiness(
  featureId: string,
  enabledFeatures: readonly string[],
): FeatureReadinessAssessment {
  if (!isFeatureId(featureId)) {
    return {
      featureId,
      found: false,
      ready: false,
      reasons: ['Feature ID is not registered in manifest.'],
      dependencies: [],
    };
  }

  const feature = getFeatureManifestEntry(featureId);
  if (!feature) {
    return {
      featureId,
      found: false,
      ready: false,
      reasons: ['Feature manifest entry missing.'],
      dependencies: [],
    };
  }

  const dependencies = buildFeatureDependencyHealth(feature, enabledFeatures);
  const reasons: string[] = [];

  if (feature.status === 'shelved') reasons.push('Feature is shelved.');
  if (feature.status === 'intake') reasons.push('Feature is still in intake.');
  if (!enabledFeatures.includes(featureId)) reasons.push('Feature is not enabled for active play mode.');
  if (feature.loader === null) reasons.push('Feature has no loader mapping yet.');
  if (dependencies.some((dep) => !dep.found)) reasons.push('One or more dependencies are missing from manifest.');
  if (dependencies.some((dep) => dep.found && !dep.enabled)) reasons.push('One or more dependencies are disabled.');

  return {
    featureId,
    found: true,
    ready: reasons.length === 0,
    tier: feature.tier,
    status: feature.status,
    reasons,
    dependencies,
  };
}
