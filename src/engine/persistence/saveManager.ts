/**
 * Save/load system.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player, PlayerSeason } from '../../types/player';
import type { Team, TeamSeason, CoachingStaff } from '../../types/team';
import type { GameResult } from '../../types/game';
import type { TransactionLogEntry } from '../../types/roster';
import type { OwnerProfile, OwnerEvaluation } from '../../types/owner';
import type { TeamChemistryState, ClubhouseEvent } from '../../types/chemistry';
import type { PlayoffBracket } from '../league/playoffs';
import type { SeasonAwards } from '../league/awards';
import type { NewsStory } from '../league/newsFeed';
import type { OffseasonRecap } from '../../types/offseason';
import type { RandomGenerator } from '../math/prng';
import type { FeatureId } from '../../features/catalog';

export const CURRENT_SCHEMA_VERSION = 1;

export interface GameState {
  season: number;
  rngSeed: number;
  userTeamId?: number;
  gen: RandomGenerator;
  teams: Team[];
  players: Player[];
  teamSeasons: TeamSeason[];
  playerSeasons: Map<number, PlayerSeason> | Record<string, PlayerSeason>;
  gameResults: GameResult[];
  playoffBracket: PlayoffBracket | null;
  seasonAwards: SeasonAwards | null;
  hallOfFamers: unknown[];
  milestones: unknown[];
  leagueRecords: unknown[];
  careerHistory?: Record<number, PlayerSeason[]>;
  awardsHistory?: SeasonAwards[];
  leagueHistory?: unknown[];
  hofCandidates?: unknown[];
  franchiseRecordBook?: unknown;
  firedMilestones?: string[];
  lineupOrders?: Record<string, number[]>;
  rotationOrders?: Record<string, number[]>;
  devAssignments?: Record<string, unknown>;
  newsFeed: NewsStory[];
  transactionLog: TransactionLogEntry[];
  coachingStaffs: Map<number, CoachingStaff> | Record<string, CoachingStaff>;
  latestOffseasonRecap: OffseasonRecap | null;
  ownerProfiles: Map<number, OwnerProfile> | Record<string, OwnerProfile>;
  teamChemistry: Map<number, TeamChemistryState> | Record<string, TeamChemistryState>;
  clubhouseEvents: ClubhouseEvent[];
  ownerEvaluationHistory: OwnerEvaluation[];
  eventLog?: unknown[];
  featureVersions: Record<string, number>;
  enabledFeatures: FeatureId[];
  migrationNotes: string[];
  buildFingerprint: string;
}

export interface SaveManifest {
  slotId: string;
  label: string;
  season: number;
  createdAt: number;
  isAutosave: boolean;
}

export interface SaveResult {
  success: boolean;
  error?: string;
  manifest?: SaveManifest;
}

export interface LoadResult {
  success: boolean;
  error?: string;
  state?: GameState;
  manifest?: SaveManifest;
}

const saves = new Map<string, { manifest: SaveManifest; state: GameState }>();

export function createSave(slotId: string, label: string, state: GameState, isAutosave: boolean): SaveManifest {
  const manifest: SaveManifest = {
    slotId,
    label,
    season: state.season,
    createdAt: Date.now(),
    isAutosave,
  };
  saves.set(slotId, { manifest, state });
  return manifest;
}

export function createAutosave(state: GameState, label: string): SaveManifest {
  return createSave('autosave', label, state, true);
}

export function loadSave(slotId: string): LoadResult {
  const entry = saves.get(slotId);
  if (!entry) return { success: false, error: 'Save not found' };
  return { success: true, state: entry.state, manifest: entry.manifest };
}

export function deleteSave(slotId: string): boolean {
  return saves.delete(slotId);
}

export function clearAllSaves(): void {
  saves.clear();
}

export function listSaveManifests(): SaveManifest[] {
  return Array.from(saves.values()).map(e => e.manifest);
}

export function getNextManualSlot(): string {
  let i = 1;
  while (saves.has(`manual-${i}`)) i++;
  return `manual-${i}`;
}

export function exportSaveToJSON(slotId: string): string | null {
  const entry = saves.get(slotId);
  if (!entry) return null;
  return JSON.stringify(entry);
}

export function crc32(data: string): number { return data.length; }
export function preflightImportJSON(_json: string): { ok: boolean; unknownTopLevelFields: string[]; rejectReasons: string[] } {
  return { ok: true, unknownTopLevelFields: [], rejectReasons: [] };
}

export function importSaveFromJSON(json: string, slotId: string): SaveResult {
  try {
    const data = JSON.parse(json);
    if (!data) return { success: false, error: 'Invalid JSON' };
    saves.set(slotId, data);
    return { success: true, manifest: data.manifest };
  } catch {
    return { success: false, error: 'Parse error' };
  }
}
