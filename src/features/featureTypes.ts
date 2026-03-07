export type FeatureTier = 'core' | 'advanced' | 'experimental';
export type FeatureStatus = 'intake' | 'wired' | 'validated' | 'promoted' | 'shelved' | 'deprecated';
export type FeatureGroup = 'home' | 'team' | 'moves' | 'stats' | 'org' | 'history' | 'league' | 'game';
export type FeatureOwner = 'core' | 'claude' | 'codex';
export type IntakePack = 'pack-a' | 'pack-b' | 'pack-c' | 'pack-d' | 'pack-e' | 'pack-f';
export type SupportTier = 'official' | 'beta' | 'community';
export type UIMode = 'core' | 'all';

export const INTAKE_PACKS: readonly IntakePack[] = [
  'pack-a',
  'pack-b',
  'pack-c',
  'pack-d',
  'pack-e',
  'pack-f',
] as const;

export const SUPPORT_TIERS: readonly SupportTier[] = ['official', 'beta', 'community'] as const;

export type FeatureLoaderKey =
  | 'dashboard'
  | 'standings'
  | 'roster'
  | 'leaderboards'
  | 'player'
  | 'playoffs'
  | 'awards'
  | 'history'
  | 'news';

export interface FeatureManifestEntry {
  id: string;
  title: string;
  group: FeatureGroup;
  tier: FeatureTier;
  status: FeatureStatus;
  owner: FeatureOwner;
  loader: FeatureLoaderKey | null;
  deps: string[];
  sinceWave: number;
  navLabel: string;
  showInNav: boolean;
  corePriority: number;
  intakePack: IntakePack;
  riskScore: number;
  supportTier: SupportTier;
  telemetryKey: string;
}

export interface FeatureDependencyHealth {
  featureId: string;
  found: boolean;
  enabled: boolean;
  ready: boolean;
}

export interface FeatureIntakeRecord {
  featureId: string;
  wave: number;
  sourcePath: string;
  dataSourceVerified: boolean;
  emptyStateVerified: boolean;
  workerGuarded: boolean;
  promotedAt: number | null;
  notes: string;
}

export interface PromotionPolicy {
  minValidationChecks: number;
  maxRiskScoreForCore: number;
  requireWorkerGuard: boolean;
  requireEmptyState: boolean;
  requireDataSource: boolean;
}

export const DEFAULT_PROMOTION_POLICY: PromotionPolicy = {
  minValidationChecks: 4,
  maxRiskScoreForCore: 40,
  requireWorkerGuard: true,
  requireEmptyState: true,
  requireDataSource: true,
};
