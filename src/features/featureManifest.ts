import type { FeatureManifestEntry, UIMode } from './featureTypes.ts';

const FEATURE_MANIFEST_ENTRIES = [
  {
    id: 'dashboard',
    title: 'Dynasty Dashboard',
    group: 'home',
    tier: 'core',
    status: 'promoted',
    owner: 'core',
    loader: 'dashboard',
    deps: [],
    sinceWave: 0,
    navLabel: 'HOME',
    showInNav: true,
    corePriority: 1,
    intakePack: 'pack-a',
    riskScore: 5,
    supportTier: 'official',
    telemetryKey: 'feature.dashboard',
  },
  {
    id: 'standings',
    title: 'Standings',
    group: 'league',
    tier: 'core',
    status: 'promoted',
    owner: 'core',
    loader: 'standings',
    deps: ['dashboard'],
    sinceWave: 0,
    navLabel: 'STANDINGS',
    showInNav: true,
    corePriority: 2,
    intakePack: 'pack-a',
    riskScore: 8,
    supportTier: 'official',
    telemetryKey: 'feature.standings',
  },
  {
    id: 'roster',
    title: 'Roster Management',
    group: 'team',
    tier: 'core',
    status: 'promoted',
    owner: 'core',
    loader: 'roster',
    deps: ['dashboard'],
    sinceWave: 0,
    navLabel: 'ROSTER',
    showInNav: true,
    corePriority: 3,
    intakePack: 'pack-a',
    riskScore: 14,
    supportTier: 'official',
    telemetryKey: 'feature.roster',
  },
  {
    id: 'news',
    title: 'News Feed',
    group: 'league',
    tier: 'core',
    status: 'promoted',
    owner: 'core',
    loader: 'news',
    deps: ['dashboard'],
    sinceWave: 0,
    navLabel: 'NEWS',
    showInNav: true,
    corePriority: 5,
    intakePack: 'pack-a',
    riskScore: 12,
    supportTier: 'official',
    telemetryKey: 'feature.news',
  },
  {
    id: 'playoffs',
    title: 'Playoff Bracket',
    group: 'league',
    tier: 'core',
    status: 'promoted',
    owner: 'core',
    loader: 'playoffs',
    deps: ['standings'],
    sinceWave: 0,
    navLabel: 'PLAYOFFS',
    showInNav: true,
    corePriority: 4,
    intakePack: 'pack-a',
    riskScore: 10,
    supportTier: 'official',
    telemetryKey: 'feature.playoffs',
  },
  {
    id: 'leaderboards',
    title: 'Leaderboards',
    group: 'stats',
    tier: 'advanced',
    status: 'validated',
    owner: 'core',
    loader: 'leaderboards',
    deps: ['standings'],
    sinceWave: 0,
    navLabel: 'LEADERS',
    showInNav: true,
    corePriority: 20,
    intakePack: 'pack-b',
    riskScore: 25,
    supportTier: 'beta',
    telemetryKey: 'feature.leaderboards',
  },
  {
    id: 'awards',
    title: 'Season Awards',
    group: 'history',
    tier: 'advanced',
    status: 'validated',
    owner: 'core',
    loader: 'awards',
    deps: ['standings'],
    sinceWave: 0,
    navLabel: 'AWARDS',
    showInNav: true,
    corePriority: 22,
    intakePack: 'pack-b',
    riskScore: 20,
    supportTier: 'beta',
    telemetryKey: 'feature.awards',
  },
  {
    id: 'history',
    title: 'League History',
    group: 'history',
    tier: 'advanced',
    status: 'validated',
    owner: 'core',
    loader: 'history',
    deps: ['awards'],
    sinceWave: 0,
    navLabel: 'HISTORY',
    showInNav: true,
    corePriority: 24,
    intakePack: 'pack-c',
    riskScore: 25,
    supportTier: 'beta',
    telemetryKey: 'feature.history',
  },
  {
    id: 'player',
    title: 'Player Profile',
    group: 'stats',
    tier: 'advanced',
    status: 'wired',
    owner: 'core',
    loader: 'player',
    deps: ['roster'],
    sinceWave: 0,
    navLabel: 'PLAYER',
    showInNav: false,
    corePriority: 18,
    intakePack: 'pack-b',
    riskScore: 18,
    supportTier: 'beta',
    telemetryKey: 'feature.player',
  },
  {
    id: 'front-office-briefing',
    title: 'Front Office Briefing',
    group: 'home',
    tier: 'experimental',
    status: 'intake',
    owner: 'claude',
    loader: null,
    deps: ['dashboard'],
    sinceWave: 83,
    navLabel: 'BRIEFING',
    showInNav: false,
    corePriority: 60,
    intakePack: 'pack-c',
    riskScore: 28,
    supportTier: 'community',
    telemetryKey: 'feature.front-office-briefing',
  },
  {
    id: 'action-queue',
    title: 'Action Queue',
    group: 'home',
    tier: 'experimental',
    status: 'intake',
    owner: 'claude',
    loader: null,
    deps: ['dashboard'],
    sinceWave: 83,
    navLabel: 'ACTION QUEUE',
    showInNav: false,
    corePriority: 62,
    intakePack: 'pack-c',
    riskScore: 24,
    supportTier: 'community',
    telemetryKey: 'feature.action-queue',
  },
  {
    id: 'end-of-day-digest',
    title: 'End-of-Day Digest',
    group: 'home',
    tier: 'experimental',
    status: 'intake',
    owner: 'claude',
    loader: null,
    deps: ['dashboard', 'news'],
    sinceWave: 83,
    navLabel: 'DIGEST',
    showInNav: false,
    corePriority: 64,
    intakePack: 'pack-c',
    riskScore: 22,
    supportTier: 'community',
    telemetryKey: 'feature.end-of-day-digest',
  },
  {
    id: 'first-week-onboarding',
    title: 'First-Week Onboarding',
    group: 'home',
    tier: 'experimental',
    status: 'intake',
    owner: 'claude',
    loader: null,
    deps: ['dashboard'],
    sinceWave: 83,
    navLabel: 'ONBOARDING',
    showInNav: false,
    corePriority: 66,
    intakePack: 'pack-c',
    riskScore: 18,
    supportTier: 'community',
    telemetryKey: 'feature.first-week-onboarding',
  },
  {
    id: 'core-empty-states',
    title: 'Core Empty State System',
    group: 'home',
    tier: 'experimental',
    status: 'intake',
    owner: 'claude',
    loader: null,
    deps: ['dashboard'],
    sinceWave: 83,
    navLabel: 'EMPTY STATES',
    showInNav: false,
    corePriority: 68,
    intakePack: 'pack-c',
    riskScore: 12,
    supportTier: 'community',
    telemetryKey: 'feature.core-empty-states',
  },
] as const satisfies readonly FeatureManifestEntry[];

export type FeatureId = (typeof FEATURE_MANIFEST_ENTRIES)[number]['id'];
export type RegisteredFeatureManifestEntry = FeatureManifestEntry & { id: FeatureId };

export const FEATURE_MANIFEST: readonly RegisteredFeatureManifestEntry[] =
  FEATURE_MANIFEST_ENTRIES as readonly RegisteredFeatureManifestEntry[];

const manifestById = new Map<FeatureId, RegisteredFeatureManifestEntry>(
  FEATURE_MANIFEST.map((entry) => [entry.id, entry]),
);

export const FEATURE_ID_SET: ReadonlySet<string> = new Set(
  FEATURE_MANIFEST.map((entry) => entry.id),
);

export const DEFAULT_FEATURE_ID: FeatureId = 'dashboard';

export function isFeatureId(value: string): value is FeatureId {
  return FEATURE_ID_SET.has(value);
}

export function getFeatureManifestEntry(featureId: string): RegisteredFeatureManifestEntry | undefined {
  if (!isFeatureId(featureId)) return undefined;
  return manifestById.get(featureId);
}

export function getFeatureEntriesForMode(mode: UIMode): RegisteredFeatureManifestEntry[] {
  return FEATURE_MANIFEST
    .filter((entry) => {
      if (entry.status === 'shelved' || entry.status === 'deprecated') return false;
      if (mode === 'all') return true;
      return entry.tier === 'core' || entry.id === 'player';
    })
    .sort((a, b) => a.corePriority - b.corePriority || a.id.localeCompare(b.id));
}

export function getNavigableFeatures(mode: UIMode): RegisteredFeatureManifestEntry[] {
  return getFeatureEntriesForMode(mode).filter((entry) => entry.showInNav);
}

export function isFeatureVisibleInMode(featureId: string, mode: UIMode): boolean {
  const entry = getFeatureManifestEntry(featureId);
  if (!entry || entry.status === 'shelved' || entry.status === 'deprecated') return false;
  if (mode === 'all') return true;
  return entry.tier === 'core' || featureId === 'player';
}

export function getCoreFeatureIds(): FeatureId[] {
  return FEATURE_MANIFEST
    .filter((entry) => entry.tier === 'core' && entry.status !== 'shelved' && entry.status !== 'deprecated')
    .sort((a, b) => a.corePriority - b.corePriority || a.id.localeCompare(b.id))
    .map((entry) => entry.id);
}
