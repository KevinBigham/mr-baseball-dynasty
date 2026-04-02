/**
 * @module roster
 * Barrel export for the roster management system.
 */

export {
  // Constants
  MLB_ROSTER_LIMIT,
  FORTY_MAN_LIMIT,
  MIN_PITCHERS,
  MIN_POSITION_PLAYERS,
  MAX_MINOR_LEAGUE_OPTIONS,

  // Functions
  buildRosterState,
  validateRoster,
  executeRosterAction,
  promotePlayer,
  demotePlayer,
  dfaPlayer,
  getMLBRosterCount,
  get40ManCount,
  needsRosterMove,
  getNextLevel,
  autoFillMLBRoster,
} from './rosterManager.js';

export type {
  RosterAction,
  RosterTransaction,
  RosterState,
  RosterValidation,
  RosterActionResult,
} from './rosterManager.js';

// Offseason
export {
  OFFSEASON_PHASES,
  createOffseasonState,
  getOffseasonLength,
  getPhaseIndex,
  getNextPhase,
  getPhaseDuration,
  advanceOffseasonDay,
  skipCurrentPhase,
  recordArbitration,
  recordTenderDecisions,
  recordFASigning,
  recordDraftPicks,
  recordRetirements,
  autoResolveTenderNonTender,
  determineRetirements,
  summarizeOffseason,
} from './offseason.js';
export type {
  OffseasonPhase,
  OffseasonState,
  PhaseResults,
  ArbitrationResult,
  FASigningResult,
  DraftPickResult,
  RetirementResult,
  OffseasonSummary,
} from './offseason.js';

// Rule 5
export {
  calculateRule5EligibleAfterSeason,
  createRule5Session,
  estimateBackfilledRule5EligibilityAfterSeason,
  lockRule5ProtectionAudit,
  makeRule5Selection,
  passRule5DraftTurn,
  toggleRule5Protection,
} from './rule5.js';
export type {
  Rule5ActionResult,
  Rule5EligiblePlayer,
  Rule5Obligation,
  Rule5OfferBackState,
  Rule5Selection,
  Rule5SessionState,
} from './rule5.js';

// Free Agency
export {
  calculateMarketValue,
  getDemandLevel,
  projectContractYears,
  createFreeAgencyMarket,
  generateAIOffer,
  simulateFADay,
  simulateFullFreeAgency,
  makeUserOffer,
  getTopFreeAgents,
} from './freeAgency.js';
export type {
  FreeAgent,
  ContractOffer,
  FreeAgencyMarket,
} from './freeAgency.js';
