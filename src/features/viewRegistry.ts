import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { FeatureLoaderKey } from './featureTypes.ts';

type FeatureLoader = () => Promise<{ default: ComponentType }>;

const FEATURE_LOADERS: Record<FeatureLoaderKey, FeatureLoader> = {
  dashboard: () => import('../components/dashboard/Dashboard.tsx').then((mod) => ({ default: (mod as any).Dashboard ?? mod.default })),
  standings: () => import('../components/dashboard/StandingsTable.tsx').then((mod) => ({ default: (mod as any).StandingsTable ?? mod.default })),
  roster: () => import('../components/roster/RosterView.tsx').then((mod) => ({ default: (mod as any).RosterView ?? mod.default })),
  leaderboards: () => import('../components/stats/Leaderboards.tsx').then((mod) => ({ default: (mod as any).Leaderboards ?? mod.default })),
  player: () => import('../components/stats/PlayerProfile.tsx').then((mod) => ({ default: (mod as any).PlayerProfile ?? mod.default })),
  playoffs: () => import('../components/playoffs/PlayoffBracketView.tsx').then((mod) => ({ default: (mod as any).PlayoffBracketView ?? mod.default })),
  awards: () => import('../components/awards/AwardsView.tsx').then((mod) => ({ default: (mod as any).AwardsView ?? mod.default })),
  history: () => import('../components/history/HistoryView.tsx').then((mod) => ({ default: mod.HistoryView })),
  news: () => import('../components/news/NewsFeedView.tsx').then((mod) => ({ default: (mod as any).NewsFeedView ?? mod.default })),
};

const lazyCache = new Map<FeatureLoaderKey, LazyExoticComponent<ComponentType>>();

export function getLazyFeatureComponent(loaderKey: FeatureLoaderKey): LazyExoticComponent<ComponentType> {
  const cached = lazyCache.get(loaderKey);
  if (cached) return cached;

  const loader = FEATURE_LOADERS[loaderKey];
  const lazyComponent = lazy(loader);
  lazyCache.set(loaderKey, lazyComponent);
  return lazyComponent;
}
