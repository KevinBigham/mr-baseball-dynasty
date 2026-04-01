/**
 * @module scouting
 * Barrel export for the scouting system.
 */

export {
  // Types
  type ScoutBias,
  type Scout,
  type ScoutReport,

  // Functions
  generateScout,
  generateScoutingStaff,
  scoutPlayer,
  combineReports,
  getTeamScoutingAccuracy,
  generateScoutNotes,
} from './scoutingEngine.js';
