import { beforeEach, describe, expect, it } from 'vitest';
import { createPRNG } from '../../src/engine/math/prng.ts';
import { generateAllPlayers } from '../../src/engine/player/generation.ts';
import {
  clearAllSaves,
  createSave,
  crc32,
  exportSaveToJSON,
  importSaveFromJSON,
  loadSave,
  preflightImportJSON,
  type GameState,
} from '../../src/engine/persistence/saveManager.ts';
import type { Team } from '../../src/types/team.ts';

function makeState(seed: number, season: number): GameState {
  const teams: Team[] = [
    { teamId: 1, city: 'Test', name: 'One', abbreviation: 'ONE', conferenceId: 0, divisionId: 0, parkFactorId: 5 } as Team,
    { teamId: 2, city: 'Test', name: 'Two', abbreviation: 'TWO', conferenceId: 1, divisionId: 1, parkFactorId: 8 } as Team,
  ];

  const gen = createPRNG(seed);
  const generated = generateAllPlayers(gen, teams.map((t) => t.teamId));

  return {
    season,
    rngSeed: seed,
    gen: generated.gen,
    teams,
    players: generated.players,
    teamSeasons: [],
    playerSeasons: new Map(),
    gameResults: [],
    playoffBracket: null,
    seasonAwards: null,
    hallOfFamers: [],
    milestones: [],
    leagueRecords: [],
    newsFeed: [],
    transactionLog: [],
    coachingStaffs: new Map(),
    latestOffseasonRecap: null,
    ownerProfiles: new Map(),
    teamChemistry: new Map(),
    clubhouseEvents: [],
    ownerEvaluationHistory: [],
    featureVersions: {},
    enabledFeatures: [],
    migrationNotes: [],
    buildFingerprint: 'test',
  };
}

describe('save migration integrity', () => {
  beforeEach(() => {
    clearAllSaves();
  });

  it('reports unknown top-level fields without rejecting a valid import', () => {
    createSave('manual-1', 'Unknown Field Source', makeState(11, 2), false);
    const exported = exportSaveToJSON('manual-1');
    expect(exported).not.toBeNull();

    const parsed = JSON.parse(exported!) as { manifest: Record<string, unknown>; payload: string };
    const payload = JSON.parse(parsed.payload) as Record<string, unknown>;
    payload.futureMysteryField = { ok: true };
    parsed.payload = JSON.stringify(payload);

    const result = preflightImportJSON(JSON.stringify({
      manifest: {
        ...parsed.manifest,
        checksum: crc32(parsed.payload),
      },
      payload: parsed.payload,
    }));

    expect(result.ok).toBe(true);
    expect(result.unknownTopLevelFields).toContain('futureMysteryField');
  });

  it('rejects newer schema versions during preflight and import', () => {
    createSave('manual-1', 'Future Schema Source', makeState(14, 3), false);
    const exported = exportSaveToJSON('manual-1');
    expect(exported).not.toBeNull();

    const parsed = JSON.parse(exported!) as { manifest: Record<string, unknown>; payload: string };
    const payload = JSON.parse(parsed.payload) as Record<string, unknown>;
    payload.schemaVersion = 999;
    parsed.payload = JSON.stringify(payload);

    const json = JSON.stringify({
      manifest: {
        ...parsed.manifest,
        schemaVersion: 999,
        checksum: crc32(parsed.payload),
      },
      payload: parsed.payload,
    });

    const preflight = preflightImportJSON(json);
    expect(preflight.ok).toBe(false);
    expect(preflight.rejectReasons.some((reason) => reason.includes('newer than supported'))).toBe(true);

    const imported = importSaveFromJSON(json, 'manual-2');
    expect(imported.success).toBe(false);
    expect(imported.error).toContain('newer than supported');
  });

  it('migrates v7 saves with additive metadata defaults', () => {
    createSave('manual-1', 'Legacy Metadata Source', makeState(21, 4), false);
    const exported = exportSaveToJSON('manual-1');
    expect(exported).not.toBeNull();

    const parsed = JSON.parse(exported!) as { manifest: Record<string, unknown>; payload: string };
    const payload = JSON.parse(parsed.payload) as Record<string, unknown>;
    delete payload.featureVersions;
    delete payload.enabledFeatures;
    delete payload.migrationNotes;
    delete payload.buildFingerprint;
    payload.schemaVersion = 7;
    parsed.payload = JSON.stringify(payload);

    const json = JSON.stringify({
      manifest: {
        ...parsed.manifest,
        schemaVersion: 7,
        checksum: crc32(parsed.payload),
      },
      payload: parsed.payload,
    });

    const imported = importSaveFromJSON(json, 'manual-2');
    expect(imported.success).toBe(true);

    const loaded = loadSave('manual-2');
    expect(loaded.success).toBe(true);
    expect(loaded.state?.featureVersions).toEqual({});
    expect(loaded.state?.enabledFeatures).toEqual([]);
    expect(loaded.state?.migrationNotes).toEqual([]);
    expect(loaded.state?.buildFingerprint).toBe('unknown');
  });
});
