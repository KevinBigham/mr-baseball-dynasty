import type { FeatureManifestEntry, FeatureStatus, FeatureTier } from './featureTypes.ts';

export interface AlphaGateInput {
  gateId: string;
  label: string;
  pass: boolean;
  blocker: boolean;
  evidence: string;
  recommendation: string;
}

export interface AlphaGateResult {
  gateId: string;
  label: string;
  pass: boolean;
  blocker: boolean;
  evidence: string;
  recommendation: string;
}

export interface ManifestHealthSummary {
  statusCounts: Record<FeatureStatus, number>;
  tierCounts: Record<FeatureTier, number>;
}

export interface GateRollup {
  ok: boolean;
  blockers: string[];
  failingGateCount: number;
  gates: AlphaGateResult[];
}

export function buildAlphaGateResults(gates: AlphaGateInput[]): GateRollup {
  const normalized = gates.map((gate) => ({
    gateId: gate.gateId,
    label: gate.label,
    pass: gate.pass,
    blocker: gate.blocker,
    evidence: gate.evidence,
    recommendation: gate.recommendation,
  }));

  const blockers = normalized.filter((gate) => gate.blocker && !gate.pass).map((gate) => gate.gateId);
  return {
    ok: blockers.length === 0,
    blockers,
    failingGateCount: normalized.filter((gate) => !gate.pass).length,
    gates: normalized,
  };
}

export function summarizeManifestHealth(entries: readonly FeatureManifestEntry[]): ManifestHealthSummary {
  const statusCounts: Record<FeatureStatus, number> = {
    intake: 0,
    wired: 0,
    validated: 0,
    promoted: 0,
    shelved: 0,
    deprecated: 0,
  };

  const tierCounts: Record<FeatureTier, number> = {
    core: 0,
    advanced: 0,
    experimental: 0,
  };

  for (const entry of entries) {
    statusCounts[entry.status] += 1;
    tierCounts[entry.tier] += 1;
  }

  return { statusCounts, tierCounts };
}
