import { create } from 'zustand';
import type { StandingsData, RosterData, LeaderboardEntry } from '../types/league';
import type { NewsItem } from '../engine/narrative';
import type { RivalRecord } from '../engine/rivalry';

// ─── Franchise history record ─────────────────────────────────────────────────

export interface SeasonSummary {
  season:          number;
  wins:            number;
  losses:          number;
  pct:             number;
  playoffResult:   string | null;  // 'WC' | 'DS' | 'CS' | 'WS' | 'Champion' | null
  awardsWon:       string[];
  breakoutHits:    number;
  ownerPatienceEnd: number;
  teamMoraleEnd:   number;
  leagueERA:       number;
  leagueBA:        number;
  keyMoment:       string;         // Generated narrative summary line
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface LeagueStore {
  standings:      StandingsData | null;
  roster:         RosterData | null;
  leaderboard:    LeaderboardEntry[];
  lastSeasonERA:  number;
  lastSeasonBA:   number;
  lastSeasonRPG:  number;

  // ── News Feed ─────────────────────────────────────────────────────────────────
  newsItems:      NewsItem[];

  // ── Division Rivals ───────────────────────────────────────────────────────────
  rivals:         RivalRecord[];

  // ── Franchise History ─────────────────────────────────────────────────────────
  franchiseHistory: SeasonSummary[];

  // ── Press Conference ──────────────────────────────────────────────────────────
  presserAvailable: boolean;
  presserDone:      boolean;

  setStandings:           (d: StandingsData) => void;
  setRoster:              (d: RosterData) => void;
  setLeaderboard:         (d: LeaderboardEntry[]) => void;
  setLastSeasonStats:     (era: number, ba: number, rpg: number) => void;

  addNewsItems:           (items: NewsItem[]) => void;
  clearNews:              () => void;

  setRivals:              (rivals: RivalRecord[]) => void;
  updateRivals:           (rivals: RivalRecord[]) => void;

  addSeasonSummary:       (summary: SeasonSummary) => void;

  setPresserAvailable:    (v: boolean) => void;
  setPresserDone:         (v: boolean) => void;
}

// ─── Key moment generator ─────────────────────────────────────────────────────

export function generateKeyMoment(summary: Omit<SeasonSummary, 'keyMoment'>): string {
  if (summary.playoffResult === 'Champion') {
    return `🏆 World Series Champions — the dynasty reaches its peak.`;
  }
  if (summary.playoffResult === 'WS') {
    return `🥈 World Series appearance — so close, so painful.`;
  }
  if (summary.playoffResult === 'CS') {
    return `Fell in the Championship Series — one series away from glory.`;
  }
  if (summary.playoffResult === 'DS') {
    return `Eliminated in the Division Series — the team fights on.`;
  }
  if (summary.playoffResult === 'WC') {
    return `Wild Card exit — the season ends in heartbreak.`;
  }
  if (summary.wins >= 95) {
    return `${summary.wins} wins — a dominant regular season, but no postseason berth.`;
  }
  if (summary.wins >= 85) {
    return `${summary.wins}-${summary.losses} — a winning season, just short of October.`;
  }
  if (summary.wins >= 75) {
    return `${summary.wins}-${summary.losses} — a middling year. The roster needs work.`;
  }
  if (summary.wins >= 65) {
    return `${summary.wins}-${summary.losses} — a rough campaign. The rebuild continues.`;
  }
  return `${summary.wins}-${summary.losses} — a lost season. Eyes on the draft.`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLeagueStore = create<LeagueStore>(set => ({
  standings:        null,
  roster:           null,
  leaderboard:      [],
  lastSeasonERA:    0,
  lastSeasonBA:     0,
  lastSeasonRPG:    0,
  newsItems:        [],
  rivals:           [],
  franchiseHistory: [],
  presserAvailable: false,
  presserDone:      false,

  setStandings:       d => set({ standings: d }),
  setRoster:          d => set({ roster: d }),
  setLeaderboard:     d => set({ leaderboard: d }),
  setLastSeasonStats: (era, ba, rpg) => set({ lastSeasonERA: era, lastSeasonBA: ba, lastSeasonRPG: rpg }),

  addNewsItems: items => set(state => ({
    newsItems: [...items, ...state.newsItems].slice(0, 50),
  })),
  clearNews: () => set({ newsItems: [] }),

  setRivals:    rivals => set({ rivals }),
  updateRivals: rivals => set({ rivals }),

  addSeasonSummary: summary => set(state => ({
    franchiseHistory: [summary, ...state.franchiseHistory].slice(0, 30),
  })),

  setPresserAvailable: v => set({ presserAvailable: v }),
  setPresserDone:      v => set({ presserDone: v }),
}));
