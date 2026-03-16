import { describe, expect, it } from 'vitest';
import { WorkerCache, type DashboardBundle } from '../../src/engine/workerCache';

describe('DashboardBundle contract', () => {
  it('includes chemistry and clubhouse event fields', () => {
    const bundle: DashboardBundle = {
      season: 2026,
      standings: [],
      topBatters: [],
      topPitchers: [],
      bracket: null,
      awards: null,
      news: [],
      teamNames: [],
      gamesPlayed: 0,
      userTeamChemistry: null,
      recentClubhouseEvents: [],
    };

    expect(bundle.userTeamChemistry).toBeNull();
    expect(bundle.recentClubhouseEvents).toEqual([]);
  });

  it('invalidates cached dashboard bundles with chemistry state', () => {
    const cache = new WorkerCache();
    const bundle: DashboardBundle = {
      season: 2026,
      standings: [],
      topBatters: [],
      topPitchers: [],
      bracket: null,
      awards: null,
      news: [],
      teamNames: [],
      gamesPlayed: 0,
      userTeamChemistry: { teamId: 1, cohesion: 70, morale: 64, lastUpdatedSeason: 2026 },
      recentClubhouseEvents: [{ eventId: 1, teamId: 1, season: 2026, kind: 'leadership_emergence', description: 'Veteran leaders have rallied the clubhouse.' }],
    };

    cache.setDashboard(2026, bundle);
    expect(cache.getDashboard(2026)?.userTeamChemistry?.cohesion).toBe(70);

    cache.invalidate();
    expect(cache.getDashboard(2026)).toBeNull();
  });
});
