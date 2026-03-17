import { create } from 'zustand';
import type { StandingsData, RosterData, LeaderboardEntry, LeaderboardFullEntry } from '../types/league';
import type { NewsItem } from '../engine/narrative';
import type { RivalRecord } from '../engine/rivalry';
import type { MFSNReport } from '../engine/predictions';
import type { StaffPoachEvent } from '../engine/staffPoaching';
import type { SeasonMoment } from '../engine/moments';
import type { SeasonAwards } from '../engine/league/awards';
import type { PlayoffBracket } from '../engine/sim/playoffSimulator';
import type { ClubhouseEvent, TeamChemistryState } from '../types/chemistry';
import type { WeeklyStory } from '../components/dashboard/WeeklyCard';

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

type StandingsLike = StandingsData | StandingsData['standings'];
type FullRosterPayload = RosterData | (Omit<RosterData, 'minors'> & {
  aaa?: RosterData['active'];
  aa?: RosterData['active'];
  aPlus?: RosterData['active'];
  aMinus?: RosterData['active'];
  rookie?: RosterData['active'];
  intl?: RosterData['active'];
  fortyManCount?: number;
  activeCount?: number;
});

function dedupeNewsItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const deduped: NewsItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  return deduped.slice(0, 50);
}

function normalizeStandings(data: StandingsLike, fallbackSeason: number): StandingsData {
  if (Array.isArray(data)) {
    return { season: fallbackSeason, standings: data };
  }
  return {
    season: data.season,
    standings: Array.isArray(data.standings) ? data.standings : [],
  };
}

function normalizeRoster(data: FullRosterPayload): RosterData {
  if ('minors' in data && Array.isArray(data.minors)) {
    return {
      teamId: data.teamId,
      season: data.season,
      active: data.active ?? [],
      il: data.il ?? [],
      minors: data.minors,
      dfa: data.dfa ?? [],
    };
  }

  return {
    teamId: data.teamId,
    season: data.season,
    active: data.active ?? [],
    il: data.il ?? [],
    minors: 'aaa' in data && Array.isArray(data.aaa) ? data.aaa : [],
    dfa: data.dfa ?? [],
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface LeagueStore {
  standings:      StandingsData | null;
  roster:         RosterData | null;
  leaderboard:    LeaderboardEntry[];
  leaderboardFull: LeaderboardFullEntry[];
  lastSeasonERA:  number;
  lastSeasonBA:   number;
  lastSeasonRPG:  number;

  // ── News Feed ─────────────────────────────────────────────────────────────────
  newsItems:      NewsItem[];
  teamChemistry:  TeamChemistryState | null;
  clubhouseEvents: ClubhouseEvent[];
  playoffBracket: PlayoffBracket | null;
  seasonAwards:   SeasonAwards | null;

  // ── Division Rivals ───────────────────────────────────────────────────────────
  rivals:         RivalRecord[];

  // ── Franchise History ─────────────────────────────────────────────────────────
  franchiseHistory: SeasonSummary[];

  // ── Press Conference ──────────────────────────────────────────────────────────
  presserAvailable: boolean;
  presserDone:      boolean;

  // ── MFSN Predictions ─────────────────────────────────────────────────────────
  mfsnReport:       MFSNReport | null;

  // ── Staff Poaching ────────────────────────────────────────────────────────────
  poachEvent:       StaffPoachEvent | null;

  // ── Season Moments Gallery ────────────────────────────────────────────────────
  moments:          SeasonMoment[];

  // ── Weekly MRBD Card ──────────────────────────────────────────────────────────
  weeklyStories:    WeeklyStory[];

  // ── Trade History ───────────────────────────────────────────────────────────
  tradeHistory:     TradeHistoryRecord[];

  setStandings:           (d: StandingsLike) => void;
  setRoster:              (d: FullRosterPayload) => void;
  setLeaderboard:         (d: LeaderboardEntry[]) => void;
  setLeaderboardFull:     (d: LeaderboardFullEntry[]) => void;
  setLastSeasonStats:     (era: number, ba: number, rpg: number) => void;

  addNewsItems:           (items: NewsItem[]) => void;
  syncWorkerNewsItems:    (items: NewsItem[]) => void;
  clearNews:              () => void;
  setTeamChemistry:       (chemistry: TeamChemistryState | null) => void;
  setClubhouseEvents:     (events: ClubhouseEvent[]) => void;
  setPlayoffBracket:      (bracket: PlayoffBracket | null) => void;
  setSeasonAwards:        (awards: SeasonAwards | null) => void;

  setRivals:              (rivals: RivalRecord[]) => void;
  updateRivals:           (rivals: RivalRecord[]) => void;

  addSeasonSummary:       (summary: SeasonSummary) => void;

  setPresserAvailable:    (v: boolean) => void;
  setPresserDone:         (v: boolean) => void;

  setMFSNReport:          (report: MFSNReport) => void;
  clearMFSNReport:        () => void;

  setPoachEvent:          (event: StaffPoachEvent | null) => void;
  resolvePoachEvent:      (decision: 'let_go' | 'block') => void;

  addMoments:             (items: SeasonMoment[]) => void;
  setWeeklyStories:       (stories: WeeklyStory[]) => void;

  addTradeRecord:         (record: TradeHistoryRecord) => void;

  resetAll:               () => void;
}

// ─── Trade History ────────────────────────────────────────────────────────────

export interface TradeHistoryRecord {
  season: number;
  partnerTeamAbbr: string;
  sent: string[];
  received: string[];
  type: 'incoming' | 'proposed';
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
  leaderboardFull:  [],
  lastSeasonERA:    0,
  lastSeasonBA:     0,
  lastSeasonRPG:    0,
  newsItems:        [],
  teamChemistry:    null,
  clubhouseEvents:  [],
  playoffBracket:   null,
  seasonAwards:     null,
  rivals:           [],
  franchiseHistory: [],
  presserAvailable: false,
  presserDone:      false,
  mfsnReport:       null,
  poachEvent:       null,
  moments:          [],
  weeklyStories:    [],
  tradeHistory:     [],

  setStandings:       d => set(state => ({
    standings: normalizeStandings(d, state.standings?.season ?? 2026),
  })),
  setRoster:          d => set({ roster: normalizeRoster(d) }),
  setLeaderboard:     d => set({ leaderboard: d }),
  setLeaderboardFull: d => set({ leaderboardFull: d }),
  setLastSeasonStats: (era, ba, rpg) => set({ lastSeasonERA: era, lastSeasonBA: ba, lastSeasonRPG: rpg }),

  addNewsItems: items => set(state => ({
    newsItems: dedupeNewsItems([...items, ...state.newsItems]),
  })),
  syncWorkerNewsItems: items => set(state => ({
    newsItems: dedupeNewsItems([
      ...items,
      ...state.newsItems.filter((item) => item.source !== 'worker'),
    ]),
  })),
  clearNews: () => set({ newsItems: [] }),
  setTeamChemistry: chemistry => set({ teamChemistry: chemistry }),
  setClubhouseEvents: events => set({ clubhouseEvents: events.slice(0, 12) }),
  setPlayoffBracket: bracket => set({ playoffBracket: bracket }),
  setSeasonAwards: awards => set({ seasonAwards: awards }),

  setRivals:    rivals => set({ rivals }),
  updateRivals: rivals => set({ rivals }),

  addSeasonSummary: summary => set(state => ({
    franchiseHistory: [summary, ...state.franchiseHistory].slice(0, 30),
  })),

  setPresserAvailable: v => set({ presserAvailable: v }),
  setPresserDone:      v => set({ presserDone: v }),

  setMFSNReport:   report => set({ mfsnReport: report }),
  clearMFSNReport: ()     => set({ mfsnReport: null }),

  setPoachEvent:   event  => set({ poachEvent: event }),
  resolvePoachEvent: decision => set(state => ({
    poachEvent: state.poachEvent
      ? { ...state.poachEvent, resolved: true, decision }
      : null,
  })),

  addMoments:      items   => set(state => ({
    // Keep all moments but cap at 100; newest first
    moments: [...items, ...state.moments].slice(0, 100),
  })),
  setWeeklyStories: stories => set({ weeklyStories: stories }),

  addTradeRecord: record => set(state => ({
    tradeHistory: [record, ...state.tradeHistory].slice(0, 50),
  })),

  resetAll: () => set({
    standings: null,
    roster: null,
    leaderboard: [],
    leaderboardFull: [],
    lastSeasonERA: 0,
    lastSeasonBA: 0,
    lastSeasonRPG: 0,
    newsItems: [],
    teamChemistry: null,
    clubhouseEvents: [],
    playoffBracket: null,
    seasonAwards: null,
    rivals: [],
    franchiseHistory: [],
    presserAvailable: false,
    presserDone: false,
    mfsnReport: null,
    poachEvent: null,
    moments: [],
    weeklyStories: [],
    tradeHistory: [],
  }),
}));
