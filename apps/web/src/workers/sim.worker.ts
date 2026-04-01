/**
 * Web Worker entry point.
 * Full simulation engine: player generation, schedule, game sim, standings.
 */
import * as Comlink from 'comlink';
import {
  GameRNG,
  generateLeaguePlayers,
  TEAMS,
  generateSchedule,
  StandingsTracker,
  createSeasonState,
  simulateDay,
  simulateWeek,
  simulateMonth,
  determinePlayoffSeeds,
  simulatePlayoffs,
  toDisplayRating,
  toLetterGrade,
  getTeamById,
  HITTER_POSITIONS,
  PITCHER_POSITIONS,
} from '@mbd/sim-core';
import type {
  GeneratedPlayer,
  ScheduledGame,
  SeasonState,
  StandingsEntry,
  PlayoffBracket,
  PlayerGameStats,
} from '@mbd/sim-core';

// ---------------------------------------------------------------------------
// Full game state
// ---------------------------------------------------------------------------

interface FullGameState {
  rng: GameRNG;
  season: number;
  day: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  players: GeneratedPlayer[];
  schedule: ScheduledGame[];
  seasonState: SeasonState;
  userTeamId: string;
  playoffBracket: PlayoffBracket | null;
}

let state: FullGameState | null = null;

// ---------------------------------------------------------------------------
// DTO types for the UI
// ---------------------------------------------------------------------------

interface TeamStandingsDTO {
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

interface PlayerDTO {
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
    // Pitching
    ip: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    era: string;
  } | null;
}

interface SimResultDTO {
  day: number;
  season: number;
  phase: string;
  gamesPlayed: number;
  seasonComplete: boolean;
}

// ---------------------------------------------------------------------------
// Helper: build player DTO
// ---------------------------------------------------------------------------

function toPlayerDTO(player: GeneratedPlayer, stats?: PlayerGameStats): PlayerDTO {
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
      pa: seasonStats.pa,
      ab: seasonStats.ab,
      hits: seasonStats.hits,
      hr: seasonStats.hr,
      rbi: seasonStats.rbi,
      bb: seasonStats.bb,
      k: seasonStats.k,
      avg,
      ip: seasonStats.ip,
      earnedRuns: seasonStats.earnedRuns,
      strikeouts: seasonStats.strikeouts,
      walks: seasonStats.walks,
      era,
    };
  }

  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    age: player.age,
    position: player.position,
    overallRating: player.overallRating,
    displayRating: toDisplayRating(player.overallRating),
    letterGrade: toLetterGrade(player.overallRating),
    rosterStatus: player.rosterStatus,
    teamId: player.teamId,
    stats: statBlock,
  };
}

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------

const api = {
  ping() {
    return { pong: true as const, timestamp: Date.now() };
  },

  newGame(seed: number, userTeamId: string = 'nyy') {
    const rng = new GameRNG(seed);

    // Generate all players for all 32 teams
    const teamIds = TEAMS.map(t => t.id);
    const players = generateLeaguePlayers(rng.fork(), teamIds);

    // Generate schedule
    const schedule = generateSchedule(rng.fork());

    // Initialize season state
    const seasonState = createSeasonState(1, teamIds);

    state = {
      rng,
      season: 1,
      day: 1,
      phase: 'preseason',
      players,
      schedule,
      seasonState,
      userTeamId,
      playoffBracket: null,
    };

    return {
      success: true as const,
      season: 1,
      day: 1,
      phase: 'preseason' as const,
      playerCount: players.length,
      teamCount: teamIds.length,
      gamesScheduled: schedule.length,
    };
  },

  simDay(): SimResultDTO {
    if (!state) throw new Error('No game initialized');

    if (state.phase === 'preseason') {
      state.phase = 'regular';
      state.day = 1;
      // Fall through to simulate the first day of the regular season
    }

    if (state.phase === 'regular') {
      const { newState, result } = simulateDay(
        state.rng, state.seasonState, state.schedule, state.players,
      );
      state.seasonState = newState;
      state.day = newState.currentDay;

      if (result.seasonComplete) {
        state.phase = 'playoffs';
        state.day = 1;
      }

      return {
        day: state.day,
        season: state.season,
        phase: state.phase,
        gamesPlayed: result.games.length,
        seasonComplete: result.seasonComplete,
      };
    }

    if (state.phase === 'playoffs') {
      // Run entire playoffs at once
      if (!state.playoffBracket) {
        const fullStandings = state.seasonState.standings.getFullStandings();
        const seeds = determinePlayoffSeeds(fullStandings);
        state.playoffBracket = simulatePlayoffs(state.rng, seeds, state.players);
      }
      state.phase = 'offseason';
      state.day = 1;
      return {
        day: 1,
        season: state.season,
        phase: 'offseason',
        gamesPlayed: 0,
        seasonComplete: true,
      };
    }

    if (state.phase === 'offseason') {
      // Start new season
      state.season++;
      state.day = 1;
      state.phase = 'preseason';
      state.playoffBracket = null;

      // Regenerate schedule, reset season state
      const teamIds = TEAMS.map(t => t.id);
      state.schedule = generateSchedule(state.rng.fork());
      state.seasonState = createSeasonState(state.season, teamIds);

      // Age players
      for (const p of state.players) {
        (p as { age: number }).age++;
      }

      return {
        day: 1,
        season: state.season,
        phase: 'preseason',
        gamesPlayed: 0,
        seasonComplete: false,
      };
    }

    return { day: state.day, season: state.season, phase: state.phase, gamesPlayed: 0, seasonComplete: false };
  },

  simWeek(): SimResultDTO {
    if (!state) throw new Error('No game initialized');

    if (state.phase !== 'regular') {
      return this.simDay();
    }

    const { newState, result } = simulateWeek(
      state.rng, state.seasonState, state.schedule, state.players,
    );
    state.seasonState = newState;
    state.day = newState.currentDay;

    if (result.seasonComplete) {
      state.phase = 'playoffs';
      state.day = 1;
    }

    return {
      day: state.day,
      season: state.season,
      phase: state.phase,
      gamesPlayed: result.games.length,
      seasonComplete: result.seasonComplete,
    };
  },

  simMonth(): SimResultDTO {
    if (!state) throw new Error('No game initialized');

    if (state.phase !== 'regular') {
      return this.simDay();
    }

    const { newState, result } = simulateMonth(
      state.rng, state.seasonState, state.schedule, state.players,
    );
    state.seasonState = newState;
    state.day = newState.currentDay;

    if (result.seasonComplete) {
      state.phase = 'playoffs';
      state.day = 1;
    }

    return {
      day: state.day,
      season: state.season,
      phase: state.phase,
      gamesPlayed: result.games.length,
      seasonComplete: result.seasonComplete,
    };
  },

  getState() {
    if (!state) return null;
    return {
      season: state.season,
      day: state.day,
      phase: state.phase,
      userTeamId: state.userTeamId,
      playerCount: state.players.length,
    };
  },

  // -----------------------------------------------------------------------
  // Data queries
  // -----------------------------------------------------------------------

  getStandings(): { divisions: Record<string, TeamStandingsDTO[]> } | null {
    if (!state) return null;

    const fullStandings = state.seasonState.standings.getFullStandings();
    const divisions: Record<string, TeamStandingsDTO[]> = {};

    for (const [div, entries] of Object.entries(fullStandings)) {
      divisions[div] = entries.map((e: StandingsEntry) => {
        const team = getTeamById(e.teamId);
        return {
          teamId: e.teamId,
          teamName: team?.name ?? e.teamId,
          city: team?.city ?? '',
          abbreviation: team?.abbreviation ?? '',
          division: div,
          wins: e.wins,
          losses: e.losses,
          pct: e.pct.toFixed(3).replace(/^0/, ''),
          gamesBack: e.gamesBack,
          streak: e.streak,
          runDifferential: e.runDifferential,
        };
      });
    }

    return { divisions };
  },

  getTeamRoster(teamId: string): PlayerDTO[] {
    if (!state) return [];
    return state.players
      .filter(p => p.teamId === teamId && p.rosterStatus === 'MLB')
      .sort((a, b) => b.overallRating - a.overallRating)
      .map(p => toPlayerDTO(p));
  },

  getFullRoster(teamId: string): { mlb: PlayerDTO[]; minors: Record<string, PlayerDTO[]> } {
    if (!state) return { mlb: [], minors: {} };

    const teamPlayers = state.players.filter(p => p.teamId === teamId);
    const mlb = teamPlayers
      .filter(p => p.rosterStatus === 'MLB')
      .sort((a, b) => b.overallRating - a.overallRating)
      .map(p => toPlayerDTO(p));

    const minors: Record<string, PlayerDTO[]> = {};
    for (const level of ['AAA', 'AA', 'A_PLUS', 'A', 'ROOKIE', 'INTERNATIONAL']) {
      minors[level] = teamPlayers
        .filter(p => p.rosterStatus === level)
        .sort((a, b) => b.overallRating - a.overallRating)
        .map(p => toPlayerDTO(p));
    }

    return { mlb, minors };
  },

  getPlayer(playerId: string): PlayerDTO | null {
    if (!state) return null;
    const player = state.players.find(p => p.id === playerId);
    if (!player) return null;
    return toPlayerDTO(player);
  },

  getLeagueLeaders(stat: string, limit: number = 20): PlayerDTO[] {
    if (!state) return [];

    const mlbPlayers = state.players.filter(p => p.rosterStatus === 'MLB');
    const withStats = mlbPlayers
      .map(p => ({
        player: p,
        stats: state!.seasonState.playerSeasonStats.get(p.id),
      }))
      .filter((item): item is { player: GeneratedPlayer; stats: PlayerGameStats } =>
        item.stats != null && item.stats.pa > 0
      );

    // Sort by requested stat
    const sorted = [...withStats].sort((a, b) => {
      switch (stat) {
        case 'hr': return b.stats.hr - a.stats.hr;
        case 'rbi': return b.stats.rbi - a.stats.rbi;
        case 'hits': return b.stats.hits - a.stats.hits;
        case 'avg': {
          const aAvg = a.stats.ab > 0 ? a.stats.hits / a.stats.ab : 0;
          const bAvg = b.stats.ab > 0 ? b.stats.hits / b.stats.ab : 0;
          return bAvg - aAvg;
        }
        case 'k': return b.stats.strikeouts - a.stats.strikeouts;
        case 'era': {
          const aEra = a.stats.ip > 0 ? (a.stats.earnedRuns / (a.stats.ip / 3)) * 9 : 99;
          const bEra = b.stats.ip > 0 ? (b.stats.earnedRuns / (b.stats.ip / 3)) * 9 : 99;
          return aEra - bEra; // Lower ERA is better
        }
        default: return b.stats.hr - a.stats.hr;
      }
    });

    return sorted.slice(0, limit).map(item => toPlayerDTO(item.player, item.stats));
  },

  getPlayoffBracket(): PlayoffBracket | null {
    if (!state) return null;
    return state.playoffBracket;
  },

  getUserTeamId(): string {
    return state?.userTeamId ?? 'nyy';
  },

  searchPlayers(query: string, limit: number = 20): PlayerDTO[] {
    if (!state || !query) return [];
    const q = query.toLowerCase();
    return state.players
      .filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(p => toPlayerDTO(p));
  },
};

export type WorkerApi = typeof api;
Comlink.expose(api);
