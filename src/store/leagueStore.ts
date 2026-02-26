import { create } from 'zustand';
import type { StandingsData, RosterData, LeaderboardEntry } from '../types/league';
import type { NewsItem } from '../engine/narrative';

interface LeagueStore {
  standings:      StandingsData | null;
  roster:         RosterData | null;
  leaderboard:    LeaderboardEntry[];
  lastSeasonERA:  number;
  lastSeasonBA:   number;
  lastSeasonRPG:  number;

  // ── News Feed ─────────────────────────────────────────────────────────────────
  newsItems:      NewsItem[];

  setStandings:       (d: StandingsData) => void;
  setRoster:          (d: RosterData) => void;
  setLeaderboard:     (d: LeaderboardEntry[]) => void;
  setLastSeasonStats: (era: number, ba: number, rpg: number) => void;

  addNewsItems:       (items: NewsItem[]) => void;
  clearNews:          () => void;
}

export const useLeagueStore = create<LeagueStore>(set => ({
  standings:     null,
  roster:        null,
  leaderboard:   [],
  lastSeasonERA: 0,
  lastSeasonBA:  0,
  lastSeasonRPG: 0,

  newsItems:     [],

  setStandings:       d => set({ standings: d }),
  setRoster:          d => set({ roster: d }),
  setLeaderboard:     d => set({ leaderboard: d }),
  setLastSeasonStats: (era, ba, rpg) => set({ lastSeasonERA: era, lastSeasonBA: ba, lastSeasonRPG: rpg }),

  // Prepend new items and keep last 50 total
  addNewsItems: items => set(state => ({
    newsItems: [...items, ...state.newsItems].slice(0, 50),
  })),
  clearNews: () => set({ newsItems: [] }),
}));
