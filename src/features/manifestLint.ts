import type { FeatureManifestEntry, FeatureLoaderKey } from './featureTypes.ts';
import { INTAKE_PACKS, SUPPORT_TIERS } from './featureTypes.ts';
import { FEATURE_MANIFEST } from './featureManifest.ts';

export type ManifestIssueSeverity = 'error' | 'warn';

export interface ManifestLintIssue {
  code:
    | 'duplicate-feature-id'
    | 'duplicate-loader-key'
    | 'duplicate-telemetry-key'
    | 'invalid-dependency-id'
    | 'self-dependency'
    | 'circular-dependency'
    | 'invalid-risk-score'
    | 'invalid-core-priority'
    | 'invalid-telemetry-key'
    | 'invalid-intake-pack'
    | 'invalid-support-tier'
    | 'status-tier-mismatch';
  severity: ManifestIssueSeverity;
  featureId: string;
  message: string;
}

export interface ManifestLintResult {
  ok: boolean;
  issues: ManifestLintIssue[];
}

function detectCycle(
  startId: string,
  graph: Map<string, string[]>,
): string[] | null {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const parent = new Map<string, string | null>();

  function dfs(node: string): string[] | null {
    visited.add(node);
    stack.add(node);

    for (const next of graph.get(node) ?? []) {
      if (!visited.has(next)) {
        parent.set(next, node);
        const found = dfs(next);
        if (found) return found;
      } else if (stack.has(next)) {
        const path: string[] = [next];
        let cursor: string | null = node;
        while (cursor && cursor !== next) {
          path.push(cursor);
          cursor = parent.get(cursor) ?? null;
        }
        path.push(next);
        path.reverse();
        return path;
      }
    }

    stack.delete(node);
    return null;
  }

  parent.set(startId, null);
  return dfs(startId);
}

export function lintFeatureManifest(
  manifest: readonly FeatureManifestEntry[] = FEATURE_MANIFEST,
): ManifestLintResult {
  const issues: ManifestLintIssue[] = [];

  const idSet = new Set<string>();
  const loaderSet = new Set<FeatureLoaderKey>();
  const telemetrySet = new Set<string>();
  const validIntakePacks = new Set<string>(INTAKE_PACKS);
  const validSupportTiers = new Set<string>(SUPPORT_TIERS);

  for (const entry of manifest) {
    if (idSet.has(entry.id)) {
      issues.push({
        code: 'duplicate-feature-id',
        severity: 'error',
        featureId: entry.id,
        message: `Duplicate feature id: ${entry.id}`,
      });
    }
    idSet.add(entry.id);

    if (entry.loader) {
      if (loaderSet.has(entry.loader)) {
        issues.push({
          code: 'duplicate-loader-key',
          severity: 'warn',
          featureId: entry.id,
          message: `Loader key reused by multiple features: ${entry.loader}`,
        });
      }
      loaderSet.add(entry.loader);
    }

    if (telemetrySet.has(entry.telemetryKey)) {
      issues.push({
        code: 'duplicate-telemetry-key',
        severity: 'warn',
        featureId: entry.id,
        message: `Telemetry key reused by multiple features: ${entry.telemetryKey}`,
      });
    }
    telemetrySet.add(entry.telemetryKey);

    if (!Number.isFinite(entry.riskScore) || entry.riskScore < 0 || entry.riskScore > 100) {
      issues.push({
        code: 'invalid-risk-score',
        severity: 'error',
        featureId: entry.id,
        message: `riskScore must be between 0 and 100 (got ${entry.riskScore})`,
      });
    }

    if (!Number.isInteger(entry.corePriority) || entry.corePriority < 0) {
      issues.push({
        code: 'invalid-core-priority',
        severity: 'error',
        featureId: entry.id,
        message: `corePriority must be a non-negative integer (got ${entry.corePriority})`,
      });
    }

    if (!/^feature\.[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(entry.telemetryKey)) {
      issues.push({
        code: 'invalid-telemetry-key',
        severity: 'error',
        featureId: entry.id,
        message: `telemetryKey must start with "feature." and use lowercase tokens (got ${entry.telemetryKey})`,
      });
    }

    if (!validIntakePacks.has(entry.intakePack)) {
      issues.push({
        code: 'invalid-intake-pack',
        severity: 'error',
        featureId: entry.id,
        message: `intakePack must be one of ${INTAKE_PACKS.join(', ')} (got ${entry.intakePack})`,
      });
    }

    if (!validSupportTiers.has(entry.supportTier)) {
      issues.push({
        code: 'invalid-support-tier',
        severity: 'error',
        featureId: entry.id,
        message: `supportTier must be one of ${SUPPORT_TIERS.join(', ')} (got ${entry.supportTier})`,
      });
    }

    if (entry.tier === 'core' && entry.status === 'intake') {
      issues.push({
        code: 'status-tier-mismatch',
        severity: 'warn',
        featureId: entry.id,
        message: 'Core feature should not remain in intake status.',
      });
    }

    for (const dep of entry.deps) {
      if (dep === entry.id) {
        issues.push({
          code: 'self-dependency',
          severity: 'error',
          featureId: entry.id,
          message: `Feature ${entry.id} cannot depend on itself.`,
        });
      }
      if (!manifest.some((candidate) => candidate.id === dep)) {
        issues.push({
          code: 'invalid-dependency-id',
          severity: 'error',
          featureId: entry.id,
          message: `Dependency ${dep} is not present in manifest.`,
        });
      }
    }
  }

  const graph = new Map<string, string[]>();
  for (const entry of manifest) {
    graph.set(entry.id, [...entry.deps]);
  }

  for (const entry of manifest) {
    const cycle = detectCycle(entry.id, graph);
    if (cycle && cycle.length > 1) {
      issues.push({
        code: 'circular-dependency',
        severity: 'error',
        featureId: entry.id,
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
      });
      break;
    }
  }

  const ok = !issues.some((issue) => issue.severity === 'error');
  return { ok, issues };
}

export function hasBlockingManifestIssues(
  manifest: readonly FeatureManifestEntry[] = FEATURE_MANIFEST,
): boolean {
  return !lintFeatureManifest(manifest).ok;
}
