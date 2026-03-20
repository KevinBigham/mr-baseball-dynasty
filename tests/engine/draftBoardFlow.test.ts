import { describe, expect, it } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { TeamSeason } from '../../src/types/team';
import { createPRNG } from '../../src/engine/math/prng';
import {
  completeDraftBoard,
  createDraftBoardState,
  makeUserDraftPick,
  runAIPicksUntilUserTurn,
  teamOnClockId,
} from '../../src/engine/draft';

function makePlayer(
  playerId: number,
  position: Position,
  overall: number,
  teamId = 1,
): Player {
  const isPitcher = position === 'SP' || position === 'RP' || position === 'CL';
  return {
    playerId,
    teamId,
    name: `Player ${playerId}`,
    firstName: 'Player',
    lastName: String(playerId),
    age: isPitcher ? 27 : 26,
    position,
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    leagueLevel: 'MLB',
    isPitcher,
    hitterAttributes: isPitcher ? null : {
      contact: overall,
      power: overall,
      eye: overall,
      speed: overall,
      baserunningIQ: overall,
      fielding: overall,
      armStrength: overall,
      durability: overall,
      platoonSensitivity: 0,
      offensiveIQ: overall,
      defensiveIQ: overall,
      workEthic: 60,
      mentalToughness: 55,
    },
    pitcherAttributes: isPitcher ? {
      stuff: overall,
      movement: overall,
      command: overall,
      stamina: overall,
      pitchArsenalCount: position === 'SP' ? 4 : 3,
      gbFbTendency: 50,
      holdRunners: overall,
      durability: overall,
      recoveryRate: overall,
      platoonTendency: 0,
      pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
      pitchingIQ: overall,
      workEthic: 60,
      mentalToughness: 55,
    } : null,
    overall,
    potential: overall + 15,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 172 * 3,
      serviceTimeCurrentTeamDays: 172 * 3,
      rule5Selected: false,
      signedSeason: 2023,
      signedAge: 22,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: true,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  };
}

function makeTeamSeason(teamId: number, wins: number, losses: number): TeamSeason {
  return {
    teamId,
    season: 2026,
    wins,
    losses,
    runsScored: 700 - teamId,
    runsAllowed: 700 + teamId,
    divisionRank: teamId,
    playoffResult: null,
  };
}

describe('draft board flow', () => {
  it('creates deterministic setup draft boards from the MLB-active pool', () => {
    const teamSeasons = [makeTeamSeason(1, 81, 81), makeTeamSeason(2, 81, 81)];
    const playersA = [
      makePlayer(1, 'SS', 420),
      makePlayer(2, 'SP', 410),
      makePlayer(3, 'CF', 400),
      makePlayer(4, 'RP', 390),
    ];
    const playersB = [
      makePlayer(1, 'SS', 420),
      makePlayer(2, 'SP', 410),
      makePlayer(3, 'CF', 400),
      makePlayer(4, 'RP', 390),
    ];

    const [stateA, draftPlayersA] = createDraftBoardState(
      teamSeasons,
      playersA,
      2026,
      1,
      createPRNG(17),
      { mode: 'snake10' },
    );
    const [stateB, draftPlayersB] = createDraftBoardState(
      teamSeasons,
      playersB,
      2026,
      1,
      createPRNG(17),
      { mode: 'snake10' },
    );

    expect(draftPlayersA).toHaveLength(0);
    expect(draftPlayersB).toHaveLength(0);
    expect(stateA.totalRounds).toBe(10);
    expect(stateA.completed).toBe(false);
    expect(stateA.draftOrder).toEqual(stateB.draftOrder);
    expect(stateA.board.map((entry) => entry.playerId)).toEqual(stateB.board.map((entry) => entry.playerId));
    expect(playersA.every((player) => player.rosterData.rosterStatus === 'DRAFT_ELIGIBLE')).toBe(true);
  });

  it('pins the user team to the requested startup draft slot deterministically', () => {
    const teamSeasons = [
      makeTeamSeason(1, 81, 81),
      makeTeamSeason(2, 82, 80),
      makeTeamSeason(3, 83, 79),
      makeTeamSeason(4, 84, 78),
    ];
    const playersA = [
      makePlayer(1, 'SS', 420),
      makePlayer(2, 'SP', 410),
      makePlayer(3, 'CF', 400),
      makePlayer(4, 'RP', 390),
      makePlayer(5, '1B', 380),
      makePlayer(6, 'C', 370),
      makePlayer(7, 'LF', 360),
      makePlayer(8, 'CL', 350),
    ];
    const playersB = playersA.map((player) => makePlayer(player.playerId, player.position, player.overall, player.teamId));

    const [stateA] = createDraftBoardState(
      teamSeasons,
      playersA,
      2026,
      3,
      createPRNG(17),
      { mode: 'snake10', userDraftSlot: 2 },
    );
    const [stateB] = createDraftBoardState(
      teamSeasons,
      playersB,
      2026,
      3,
      createPRNG(17),
      { mode: 'snake10', userDraftSlot: 2 },
    );

    expect(stateA.draftOrder.indexOf(3)).toBe(1);
    expect(stateA.draftOrder).toEqual(stateB.draftOrder);
    expect(new Set(stateA.draftOrder)).toEqual(new Set([1, 2, 3, 4]));
  });

  it('advances to the user turn and assigns the selected player', () => {
    const teamSeasons = [makeTeamSeason(1, 81, 81), makeTeamSeason(2, 81, 81)];
    const players = [
      makePlayer(1, 'SS', 430),
      makePlayer(2, 'SP', 425),
      makePlayer(3, 'CF', 420),
      makePlayer(4, 'RP', 415),
      makePlayer(5, '1B', 410),
      makePlayer(6, 'C', 405),
    ];

    const [rawState] = createDraftBoardState(
      teamSeasons,
      players,
      2026,
      1,
      createPRNG(5),
      { mode: 'snake10' },
    );
    const playersById = new Map(players.map((player) => [player.playerId, player]));
    const state = runAIPicksUntilUserTurn(rawState, playersById);

    expect(teamOnClockId(state)).toBe(1);

    const playerId = state.board.find((entry) => entry.draftedByTeamId == null)?.playerId;
    expect(playerId).toBeDefined();

    const [nextState, result] = makeUserDraftPick(state, playersById, playerId ?? -1);

    expect(result.ok).toBe(true);
    expect(result.pick?.teamId).toBe(1);
    expect(result.pick?.pick).toBe(result.pick?.pickNumber);
    expect(playersById.get(playerId ?? -1)?.teamId).toBe(1);
    expect(playersById.get(playerId ?? -1)?.rosterData.rosterStatus).toBe('MLB_ACTIVE');
    expect(nextState.picks).toHaveLength(state.picks.length + 1);
  });

  it('auto-fills setup rosters to 26 active players and clears draft-eligible leftovers', () => {
    const teamSeasons = [makeTeamSeason(1, 81, 81), makeTeamSeason(2, 81, 81)];
    const template: Position[] = [
      'C', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
      'SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'CL',
      'LF', 'CF', '1B', 'RP', 'RP', 'SP',
    ];
    const players: Player[] = [...template, ...template].map((position, idx) =>
      makePlayer(idx + 1, position, 450 - idx, idx < template.length ? 1 : 2),
    );

    const [state] = createDraftBoardState(
      teamSeasons,
      players,
      2026,
      1,
      createPRNG(23),
      { mode: 'snake10' },
    );
    const playersById = new Map(players.map((player) => [player.playerId, player]));
    const result = completeDraftBoard({ ...state, completed: true }, playersById);

    const activeTeam1 = [...playersById.values()].filter(
      (player) => player.teamId === 1 && player.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    const activeTeam2 = [...playersById.values()].filter(
      (player) => player.teamId === 2 && player.rosterData.rosterStatus === 'MLB_ACTIVE',
    );
    const lingeringDraftEligible = [...playersById.values()].filter(
      (player) => player.rosterData.rosterStatus === 'DRAFT_ELIGIBLE',
    );

    expect(result.draftedCount).toBe(0);
    expect(activeTeam1).toHaveLength(26);
    expect(activeTeam2).toHaveLength(26);
    expect(lingeringDraftEligible).toHaveLength(0);
  });

  it('uses inverse standings for annual drafts and releases undrafted prospects', () => {
    const teamSeasons = [makeTeamSeason(1, 90, 72), makeTeamSeason(2, 65, 97)];
    const [rawState, draftPlayers] = createDraftBoardState(
      teamSeasons,
      [],
      2026,
      1,
      createPRNG(31),
      { mode: 'annual' },
    );
    const playersById = new Map(draftPlayers.map((player) => [player.playerId, player]));

    expect(rawState.draftOrder).toEqual([2, 1]);

    let state = runAIPicksUntilUserTurn(rawState, playersById);
    const userPickId = state.board.find((entry) => entry.draftedByTeamId == null)?.playerId;
    expect(userPickId).toBeDefined();

    [state] = makeUserDraftPick(state, playersById, userPickId ?? -1);
    const result = completeDraftBoard({ ...state, completed: true }, playersById);
    const lingeringDraftEligible = [...playersById.values()].filter(
      (player) => player.rosterData.rosterStatus === 'DRAFT_ELIGIBLE',
    );

    expect(result.draftedCount).toBe(2);
    expect(playersById.get(userPickId ?? -1)?.teamId).toBe(1);
    expect(playersById.get(userPickId ?? -1)?.rosterData.rosterStatus.startsWith('MINORS_')).toBe(true);
    expect(lingeringDraftEligible).toHaveLength(0);
  });
});
