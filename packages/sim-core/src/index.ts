// Math
export {
  GameRNG,
  computeLog5Probabilities,
} from './math/index.js';
export type {
  GameRNGState,
  Log5Input,
  Log5Modifiers,
  OutcomeRates,
} from './math/index.js';

// Player
export {
  toDisplayRating,
  toInternalRating,
  toLetterGrade,
  hitterOverall,
  pitcherOverall,
  clampRating,
  RATING_MIN,
  RATING_MAX,
  DISPLAY_MIN,
  DISPLAY_MAX,
  GRADE_THRESHOLDS,
  HITTER_WEIGHTS,
  PITCHER_WEIGHTS,
  generatePlayer,
  generateTeamRoster,
  generateLeaguePlayers,
  HITTER_POSITIONS,
  PITCHER_POSITIONS,
  ALL_POSITIONS,
  ROSTER_LEVELS,
  DEV_PHASES,
} from './player/index.js';
export type {
  HitterAttributes,
  PitcherAttributes,
  LetterGrade,
  Position,
  RosterLevel,
  DevPhase,
  GeneratedPlayer,
} from './player/index.js';

// League
export {
  TEAMS,
  DIVISIONS,
  getTeamsByDivision,
  getTeamById,
  StandingsTracker,
  generateSchedule,
  getGamesForDay,
  getSeasonLength,
  isDivisionGame,
} from './league/index.js';
export type {
  Division,
  OwnerArchetype,
  TeamDef,
  TeamRecord,
  StandingsEntry,
  ScheduledGame,
} from './league/index.js';

// Sim
export {
  resolvePlateAppearance,
  advanceRunners,
  freshRunnerState,
  simulateGame,
  createSeasonState,
  simulateDay,
  simulateWeek,
  simulateMonth,
  determinePlayoffSeeds,
  simulateSeries,
  simulatePlayoffs,
} from './sim/index.js';
export type {
  PAOutcome,
  PAContext,
  PAResult,
  BaseState,
  RunnerState,
  MarkovResult,
  GameTeam,
  GameBoxScore,
  PlayerGameStats,
  SeasonState,
  DaySimResult,
  PlayoffSeed,
  SeriesResult,
  PlayoffRound,
  PlayoffBracket,
} from './sim/index.js';
