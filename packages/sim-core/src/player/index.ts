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
} from './attributes.js';
export type {
  HitterAttributes,
  PitcherAttributes,
  LetterGrade,
} from './attributes.js';

export {
  generatePlayer,
  generateTeamRoster,
  generateLeaguePlayers,
  HITTER_POSITIONS,
  PITCHER_POSITIONS,
  ALL_POSITIONS,
  ROSTER_LEVELS,
  DEV_PHASES,
} from './generation.js';
export type {
  Position,
  RosterLevel,
  DevPhase,
  GeneratedPlayer,
} from './generation.js';

// Development
export {
  developPlayer,
  developAllPlayers,
  updateDevPhase,
  shouldRetire,
  growMentalToughness,
} from './development.js';
export type { DevProgram } from './development.js';

// Injuries
export {
  checkInjury,
  advanceInjury,
  getInjuryMultiplier,
  generateInjury,
  describeInjury,
  processInjuries,
} from './injury.js';
export type {
  InjuryType,
  InjurySeverity,
  Injury,
} from './injury.js';
