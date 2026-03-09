/**
 * Worker cache for expensive computed data.
 * Stub — Sprint 04 branch surgery.
 */

import type { PlayoffBracket } from './league/playoffs';
import type { SeasonAwards } from './league/awards';
import type { NewsStory } from './league/newsFeed';

export interface DashboardBundle {
  season: number;
  standings: unknown[];
  topBatters: unknown[];
  topPitchers: unknown[];
  bracket: PlayoffBracket | null;
  awards: SeasonAwards | null;
  news: NewsStory[];
  teamNames: [number, string][];
  gamesPlayed: number;
}

export class WorkerCache {
  private version = 0;
  private standings = new Map<number, unknown[]>();
  private battingLeaders = new Map<number, unknown[]>();
  private pitchingLeaders = new Map<number, unknown[]>();
  private dashboards = new Map<number, DashboardBundle>();

  getVersion(): number { return this.version; }
  invalidate(): void { this.version++; this.standings.clear(); this.battingLeaders.clear(); this.pitchingLeaders.clear(); this.dashboards.clear(); }
  reset(): void { this.invalidate(); this.version = 0; }

  getStandings(season: number): unknown[] | null { return this.standings.get(season) ?? null; }
  setStandings(season: number, data: unknown[]): void { this.standings.set(season, data); }

  getBattingLeaders(season: number): unknown[] | null { return this.battingLeaders.get(season) ?? null; }
  setBattingLeaders(season: number, data: unknown[]): void { this.battingLeaders.set(season, data); }

  getPitchingLeaders(season: number): unknown[] | null { return this.pitchingLeaders.get(season) ?? null; }
  setPitchingLeaders(season: number, data: unknown[]): void { this.pitchingLeaders.set(season, data); }

  getDashboard(season: number): DashboardBundle | null { return this.dashboards.get(season) ?? null; }
  setDashboard(season: number, data: DashboardBundle): void { this.dashboards.set(season, data); }
}
