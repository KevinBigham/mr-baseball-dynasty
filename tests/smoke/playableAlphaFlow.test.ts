import { beforeEach, describe, expect, it } from 'vitest';
import { TEAMS } from '../../src/data/teams.ts';
import { generateAllCoachingStaffs } from '../../src/engine/ai/coachingStaff.ts';
import { createPRNG } from '../../src/engine/math/prng.ts';
import { clearAllSaves, createSave, loadSave, type GameState } from '../../src/engine/persistence/saveManager.ts';
import { advanceOffseason } from '../../src/engine/roster/offseason.ts';
import { executeTransaction, validateTransaction } from '../../src/engine/roster/rosterManager.ts';
import { generateAllPlayers } from '../../src/engine/player/generation.ts';
import { simulateSeason } from '../../src/engine/sim/seasonSimulator.ts';
import type { Player } from '../../src/types/player.ts';
import type { TransactionLogEntry } from '../../src/types/roster.ts';

function toGameState(
  season: number,
  rngSeed: number,
  gen: ReturnType<typeof createPRNG>,
  players: Player[],
  sim: ReturnType<typeof simulateSeason>,
  transactionLog: TransactionLogEntry[],
  coachingStaffs: ReturnType<typeof generateAllCoachingStaffs>[0],
): GameState {
  return {
    season,
    rngSeed,
    gen,
    teams: [...TEAMS],
    players,
    teamSeasons: sim.teamSeasons,
    playerSeasons: sim.playerSeasons,
    gameResults: sim.gameResults,
    playoffBracket: null,
    seasonAwards: null,
    hallOfFamers: [],
    milestones: [],
    leagueRecords: [],
    newsFeed: [],
    transactionLog,
    coachingStaffs,
    latestOffseasonRecap: null,
    ownerProfiles: new Map(),
    teamChemistry: new Map(),
    clubhouseEvents: [],
    ownerEvaluationHistory: [],
    featureVersions: {},
    enabledFeatures: ['dashboard', 'standings', 'roster', 'news', 'playoffs'],
    migrationNotes: [],
    buildFingerprint: 'smoke-playable-alpha',
  };
}

describe('playable alpha smoke flow', () => {
  beforeEach(() => {
    clearAllSaves();
  });

  it('covers new game -> simulate -> transaction -> save -> load -> continue', () => {
    const seed = 77;
    let gen = createPRNG(seed);
    const teams = [...TEAMS];
    const teamIds = teams.map((team) => team.teamId);

    const generated = generateAllPlayers(gen, teamIds);
    let players = generated.players;
    gen = generated.gen;

    const coaching = generateAllCoachingStaffs(teamIds, gen);
    const coachingStaffs = coaching[0];
    gen = coaching[1];

    const sim = simulateSeason(teams, players, 1, seed);
    expect(sim.gameResults.length).toBeGreaterThan(2000);
    expect(sim.teamSeasons).toHaveLength(30);

    const playerMap = new Map(players.map((player) => [player.playerId, player]));
    const transactionLog: TransactionLogEntry[] = [];
    const userTeamId = teams[0].teamId;
    const fortyManCandidate = players.find(
      (player) => player.teamId === userTeamId
        && player.rosterData.rosterStatus === 'MINORS_AAA'
        && !player.rosterData.isOn40Man,
    );

    expect(fortyManCandidate).toBeDefined();
    const validation = validateTransaction(
      { type: 'ADD_TO_40_MAN', playerId: fortyManCandidate!.playerId },
      userTeamId,
      playerMap,
    );
    expect(validation.valid).toBe(true);

    executeTransaction(
      { type: 'ADD_TO_40_MAN', playerId: fortyManCandidate!.playerId },
      userTeamId,
      playerMap,
      170,
      1,
      transactionLog,
    );

    players = Array.from(playerMap.values());
    expect(transactionLog).toHaveLength(1);

    createSave('manual-1', 'Playable Alpha Smoke', toGameState(1, seed, sim.gen, players, sim, transactionLog, coachingStaffs), false);
    const loaded = loadSave('manual-1');
    expect(loaded.success).toBe(true);
    expect(loaded.state?.buildFingerprint).toBe('smoke-playable-alpha');
    expect(loaded.state?.transactionLog).toHaveLength(1);

    const teamSeasonsMap = new Map(loaded.state!.teamSeasons.map((entry) => [entry.teamId, entry]));
    const playersMap = new Map(loaded.state!.players.map((player) => [player.playerId, player]));
    const maxPlayerId = loaded.state!.players.reduce((max, player) => Math.max(max, player.playerId), 0);

    const offseason = advanceOffseason({
      players: playersMap,
      teamSeasons: teamSeasonsMap,
      season: loaded.state!.season,
      gen: loaded.state!.gen,
      transactionLog: [...loaded.state!.transactionLog],
      coachingStaffs: loaded.state!.coachingStaffs,
      seasonHistory: [sim],
      nextDraftPlayerId: maxPlayerId + 1,
    });

    expect(offseason.recap.season).toBe(1);
    expect(offseason.recap.draftResult.picks.length).toBeGreaterThan(0);
    expect(offseason.newPlayers.length).toBeGreaterThan(0);
  }, 30000);
});
