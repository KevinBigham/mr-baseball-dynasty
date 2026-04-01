export {
  TEAMS,
  DIVISIONS,
  getTeamsByDivision,
  getTeamById,
} from './teams.js';
export type {
  Division,
  OwnerArchetype,
  TeamDef,
} from './teams.js';

export {
  StandingsTracker,
} from './standings.js';
export type {
  TeamRecord,
  StandingsEntry,
} from './standings.js';

export {
  generateSchedule,
  getGamesForDay,
  getSeasonLength,
  isDivisionGame,
} from './schedule.js';
export type {
  ScheduledGame,
} from './schedule.js';

export {
  getPersonalityArchetype,
  createInitialPlayerMorale,
  applyMoraleEvent,
  calculateTeamChemistry,
  createOwnerState,
  evaluateOwnerState,
  buildFrontOfficeBriefing,
} from './narrativeState.js';
export type {
  PersonalityArchetype,
  MoraleEvent,
  OwnerEvaluationContext,
  BriefingContext,
} from './narrativeState.js';

export {
  calculateAwardRaces,
  finalizeAwardResults,
} from './awards.js';
export type {
  AwardRaceEntry,
  AwardRaces,
} from './awards.js';

export {
  upsertRivalry,
  deriveRivalriesFromStandings,
} from './rivalries.js';
