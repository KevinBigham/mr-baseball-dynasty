import { create } from 'zustand';
import type { StandingsData, RosterData, LeaderboardEntry } from '../types/league';

interface LeagueStore {
  standings: StandingsData | null;
  roster: RosterData | null;
  leaderboard: LeaderboardEntry[];
  lastSeasonERA: number;
  lastSeasonBA: number;
  lastSeasonRPG: number;
  setStandings: (d: StandingsData) => void;
  setRoster: (d: RosterData) => void;
  setLeaderboard: (d: LeaderboardEntry[]) => void;
  setLastSeasonStats: (era: number, ba: number, rpg: number) => void;
}

export const useLeagueStore = create<LeagueStore>(set => ({
  standings: null,
  roster: null,
  leaderboard: [],
  lastSeasonERA: 0,
  lastSeasonBA: 0,
  lastSeasonRPG: 0,
  setStandings: d => set({ standings: d }),
  setRoster: d => set({ roster: d }),
  setLeaderboard: d => set({ leaderboard: d }),
  setLastSeasonStats: (era, ba, rpg) => set({ lastSeasonERA: era, lastSeasonBA: ba, lastSeasonRPG: rpg }),
}));
