/**
 * Shared types, state, and helper functions for the sim worker.
 * Extracted to keep the main worker file under 500 lines.
 */
import {
  GameRNG,
  TEAMS,
  toDisplayRating,
  toLetterGrade,
  advanceInjury,
  describeInjury,
  processInjuries,
  checkMilestones,
  generateNews,
  deduplicateNews,
  createOffseasonState,
  advanceOffseasonDay,
  autoResolveTenderNonTender,
} from '@mbd/sim-core';
import type {
  GeneratedPlayer,
  ScheduledGame,
  SeasonState,
  PlayoffBracket,
  PlayerGameStats,
  Injury,
  Scout,
  DraftClass,
  RosterState,
  OffseasonState,
  FreeAgencyMarket,
  NewsItem,
  GMPersonality,
} from '@mbd/sim-core';

// ---------------------------------------------------------------------------
// Full game state
// ---------------------------------------------------------------------------

export interface FullGameState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  players: GeneratedPlayer[];
  schedule: ScheduledGame[];
  seasonState: SeasonState;
  userTeamId: string;
  playoffBracket: PlayoffBracket | null;
  // Phase 2 state
  injuries: Map<string, Injury>;
  serviceTime: Map<string, number>;
  scoutingStaffs: Map<string, Scout[]>;
  gmPersonalities: Map<string, GMPersonality>;
  offseasonState: OffseasonState | null;
  draftClass: DraftClass | null;
  freeAgencyMarket: FreeAgencyMarket | null;
  news: NewsItem[];
  rosterStates: Map<string, RosterState>;
}

export let state: FullGameState | null = null;

export function setState(s: FullGameState | null): void {
  state = s;
}

// ---------------------------------------------------------------------------
// DTO types for the UI
// ---------------------------------------------------------------------------

export interface TeamStandingsDTO {
  teamId: string;
  teamName: string;
  city: string;
  abbreviation: string;
  division: string;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: number;
  streak: string;
  runDifferential: number;
}

export interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  displayRating: number;
  letterGrade: string;
  rosterStatus: string;
  teamId: string;
  stats: {
    pa: number;
    ab: number;
    hits: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
    avg: string;
    ip: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    era: string;
  } | null;
}

export interface SimResultDTO {
  day: number;
  season: number;
  phase: string;
  gamesPlayed: number;
  seasonComplete: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function requireState(): FullGameState {
  if (!state) throw new Error('No game initialized');
  return state;
}

export function timestamp(): string {
  const s = requireState();
  return `S${s.season}D${s.day}`;
}

export function getTeamPlayers(teamId: string): GeneratedPlayer[] {
  return requireState().players.filter(p => p.teamId === teamId);
}

export function toPlayerDTO(player: GeneratedPlayer, stats?: PlayerGameStats): PlayerDTO {
  const seasonStats = stats ?? (state ? state.seasonState.playerSeasonStats.get(player.id) : undefined);
  let statBlock: PlayerDTO['stats'] = null;
  if (seasonStats && (seasonStats.pa > 0 || seasonStats.strikeouts > 0)) {
    const avg = seasonStats.ab > 0
      ? (seasonStats.hits / seasonStats.ab).toFixed(3).replace(/^0/, '')
      : '.000';
    const era = seasonStats.ip > 0
      ? ((seasonStats.earnedRuns / (seasonStats.ip / 3)) * 9).toFixed(2)
      : '0.00';
    statBlock = {
      pa: seasonStats.pa, ab: seasonStats.ab, hits: seasonStats.hits,
      hr: seasonStats.hr, rbi: seasonStats.rbi, bb: seasonStats.bb,
      k: seasonStats.k, avg,
      ip: seasonStats.ip, earnedRuns: seasonStats.earnedRuns,
      strikeouts: seasonStats.strikeouts, walks: seasonStats.walks, era,
    };
  }
  return {
    id: player.id, firstName: player.firstName, lastName: player.lastName,
    age: player.age, position: player.position,
    overallRating: player.overallRating,
    displayRating: toDisplayRating(player.overallRating),
    letterGrade: toLetterGrade(player.overallRating),
    rosterStatus: player.rosterStatus, teamId: player.teamId,
    stats: statBlock,
  };
}

/** Post-day injury processing and news generation. */
export function processDayInjuriesAndNews(s: FullGameState): void {
  // Advance existing injuries by 1 day
  for (const [pid, injury] of s.injuries) {
    const advanced = advanceInjury(injury);
    if (advanced) {
      s.injuries.set(pid, advanced);
    } else {
      s.injuries.delete(pid);
    }
  }

  // Check new injuries on MLB players
  const mlbPlayers = s.players.filter(p => p.rosterStatus === 'MLB');
  const newInjuries = processInjuries(s.rng.fork(), mlbPlayers, s.injuries);
  for (const [pid, injury] of newInjuries) {
    if (!s.injuries.has(pid)) {
      s.injuries.set(pid, injury);
      const player = s.players.find(p => p.id === pid);
      if (player) {
        const newsItems = generateNews(s.rng.fork(), {
          type: 'injury', season: s.season, day: s.day, data: {
            playerId: pid, playerName: `${player.firstName} ${player.lastName}`,
            teamId: player.teamId, description: describeInjury(injury),
          },
        }, s.players, s.season, s.day);
        s.news.push(...newsItems);
      }
    }
  }

  // Check milestones
  const milestones = checkMilestones(s.seasonState.playerSeasonStats, s.players, s.season, s.day);
  for (const m of milestones) {
    const mNews = generateNews(s.rng.fork(), {
      type: 'milestone', season: s.season, day: s.day,
      data: m as unknown as Record<string, unknown>,
    }, s.players, s.season, s.day);
    s.news.push(...mNews);
  }

  s.news = deduplicateNews(s.news);
}

/** Handle one offseason day with AI auto-resolution. */
export function advanceOffseasonOnce(s: FullGameState): void {
  if (!s.offseasonState) {
    s.offseasonState = createOffseasonState(s.season);
  }
  if (s.offseasonState.completed) return;

  s.offseasonState = advanceOffseasonDay(s.offseasonState);

  // Auto-resolve AI team actions for the current phase
  const teamIds = TEAMS.map(t => t.id);
  const phase = s.offseasonState.currentPhase;

  if (phase === 'tender_nontender') {
    for (const tid of teamIds) {
      if (tid === s.userTeamId) continue;
      autoResolveTenderNonTender(s.rng.fork(), tid, getTeamPlayers(tid), s.serviceTime);
    }
  }
}
