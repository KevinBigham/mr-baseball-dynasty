/**
 * Worker cache for expensive computed data.
 * Stub — Sprint 04 branch surgery.
 */

import type { StandingsRow } from '../types/league';
import type { ClubhouseEvent, TeamChemistryState } from '../types/chemistry';
import type { PlayoffBracket } from './sim/playoffSimulator';
import type { SeasonAwards } from './league/awards';
import type { NewsStory } from './league/newsFeed';

export interface DashboardLeaderEntry {
  playerId: number;
  name: string;
  team: string;
  position: string;
  stat1: number | string;
  stat2: number | string;
  stat3: number | string;
  stat4: number | string;
  stat5: number | string;
}

export interface DashboardBundle {
  season: number;
  standings: StandingsRow[];
  topBatters: DashboardLeaderEntry[];
  topPitchers: DashboardLeaderEntry[];
  bracket: PlayoffBracket | null;
  awards: SeasonAwards | null;
  news: NewsStory[];
  teamNames: [number, string][];
  gamesPlayed: number;
  userTeamChemistry: TeamChemistryState | null;
  recentClubhouseEvents: ClubhouseEvent[];
}

export class WorkerCache {
  private version = 0;
  private standings = new Map<number, StandingsRow[]>();
  private battingLeaders = new Map<number, DashboardLeaderEntry[]>();
  private pitchingLeaders = new Map<number, DashboardLeaderEntry[]>();
  private dashboards = new Map<number, DashboardBundle>();

  getVersion(): number { return this.version; }
  invalidate(): void { this.version++; this.standings.clear(); this.battingLeaders.clear(); this.pitchingLeaders.clear(); this.dashboards.clear(); }
  reset(): void { this.invalidate(); this.version = 0; }

  getStandings(season: number): StandingsRow[] | null { return this.standings.get(season) ?? null; }
  setStandings(season: number, data: StandingsRow[]): void { this.standings.set(season, data); }

  getBattingLeaders(season: number): DashboardLeaderEntry[] | null { return this.battingLeaders.get(season) ?? null; }
  setBattingLeaders(season: number, data: DashboardLeaderEntry[]): void { this.battingLeaders.set(season, data); }

  getPitchingLeaders(season: number): DashboardLeaderEntry[] | null { return this.pitchingLeaders.get(season) ?? null; }
  setPitchingLeaders(season: number, data: DashboardLeaderEntry[]): void { this.pitchingLeaders.set(season, data); }

  getDashboard(season: number): DashboardBundle | null { return this.dashboards.get(season) ?? null; }
  setDashboard(season: number, data: DashboardBundle): void { this.dashboards.set(season, data); }
}
