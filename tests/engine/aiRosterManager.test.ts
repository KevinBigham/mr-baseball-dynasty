import { describe, it, expect } from 'vitest';
import { processAIRosterMoves } from '../../src/engine/aiRosterManager';
import type { Player } from '../../src/types/player';
import type { Team } from '../../src/types/team';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeTeam(id: number, abbr = 'TST'): Team {
  return {
    teamId: id, name: `Team ${id}`, abbreviation: abbr, city: 'Test City',
    league: 'AL', division: 'East', parkFactorId: 0, budget: 100_000_000,
    scoutingQuality: 0.7, coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'contender', seasonRecord: { wins: 80, losses: 82, runsScored: 700, runsAllowed: 720 },
    rotationIndex: 0, bullpenReliefCounter: 0,
  };
}

function makePlayer(overrides: Partial<Player> & { playerId: number; teamId: number }): Player {
  return {
    name: `Player ${overrides.playerId}`,
    age: 26,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: {
      contact: 350, power: 350, eye: 350, speed: 350,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 275,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 350,
    potential: 400,
    development: { theta: 0, sigma: 20, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 2,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 300,
      serviceTimeCurrentTeamDays: 300,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 24,
      contractYearsRemaining: 3,
      salary: 1_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('processAIRosterMoves — skips user team', () => {
  it('never produces moves for the user team', () => {
    const userTeamId = 1;
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    // Give user team an empty active roster and AAA prospect
    const players = [
      makePlayer({ playerId: 1, teamId: 1, rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MLB_IL_60' } }),
      makePlayer({ playerId: 2, teamId: 1, rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true } }),
    ];

    const moves = processAIRosterMoves(players, teams, userTeamId, 42);
    expect(moves.every(m => m.teamId !== userTeamId)).toBe(true);
  });
});

describe('processAIRosterMoves — injury call-ups', () => {
  it('calls up AAA prospect when active roster is short', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const basePlayers: Player[] = [];

    // AI team 2: 24 active players (2 short)
    for (let i = 1; i <= 24; i++) {
      basePlayers.push(makePlayer({ playerId: i, teamId: 2, position: i <= 5 ? 'SP' : 'SS' }));
    }
    // Add injured player on IL
    basePlayers.push(makePlayer({
      playerId: 25, teamId: 2, position: 'CF',
      rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MLB_IL_60' },
    }));
    // Add AAA prospect
    basePlayers.push(makePlayer({
      playerId: 26, teamId: 2, position: 'CF', overall: 400,
      rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    }));

    const moves = processAIRosterMoves(basePlayers, teams, 1, 100);
    const callUps = moves.filter(m => m.type === 'call_up' && m.teamId === 2);
    expect(callUps.length).toBeGreaterThan(0);
    expect(callUps[0].toStatus).toBe('MLB_ACTIVE');
  });

  it('does not call up when active roster is full', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players: Player[] = [];

    // 26 active players for team 2
    for (let i = 1; i <= 26; i++) {
      players.push(makePlayer({ playerId: i, teamId: 2 }));
    }
    // AAA prospect
    players.push(makePlayer({
      playerId: 27, teamId: 2, overall: 400,
      rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    }));

    const moves = processAIRosterMoves(players, teams, 1, 42);
    const callUps = moves.filter(m => m.type === 'call_up' && m.teamId === 2);
    expect(callUps.length).toBe(0);
  });
});

describe('processAIRosterMoves — swaps', () => {
  it('options underperformer when prospect is significantly better', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players: Player[] = [];

    // 26 active for team 2 including one weak player
    for (let i = 1; i <= 25; i++) {
      players.push(makePlayer({ playerId: i, teamId: 2, overall: 350, position: 'SS' }));
    }
    // Weak MLB player with options
    players.push(makePlayer({
      playerId: 26, teamId: 2, overall: 100, position: 'CF',
      rosterData: {
        ...makePlayer({ playerId: 0, teamId: 0 }).rosterData,
        rosterStatus: 'MLB_ACTIVE', optionYearsRemaining: 2,
      },
    }));
    // Much better AAA prospect at same position
    players.push(makePlayer({
      playerId: 27, teamId: 2, overall: 400, position: 'CF',
      rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    }));

    const moves = processAIRosterMoves(players, teams, 1, 42);
    const options = moves.filter(m => m.type === 'option' && m.teamId === 2);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].playerId).toBe(26);
    expect(options[0].toStatus).toBe('MINORS_AAA');
  });
});

describe('processAIRosterMoves — DFA', () => {
  it('DFAs very low OVR players when 40-man is near full', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players: Player[] = [];

    // 26 active for team 2
    for (let i = 1; i <= 26; i++) {
      players.push(makePlayer({ playerId: i, teamId: 2, overall: 350 }));
    }
    // 13 more on 40-man in minors (total 39 on 40-man)
    for (let i = 27; i <= 38; i++) {
      players.push(makePlayer({
        playerId: i, teamId: 2, overall: 200,
        rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
      }));
    }
    // One very bad player on 40-man in AAA
    players.push(makePlayer({
      playerId: 39, teamId: 2, overall: 80,
      rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    }));

    const moves = processAIRosterMoves(players, teams, 1, 42);
    const dfas = moves.filter(m => m.type === 'dfa' && m.teamId === 2);
    expect(dfas.length).toBeGreaterThan(0);
    expect(dfas[0].playerId).toBe(39);
    expect(dfas[0].toStatus).toBe('DFA');
  });
});

describe('processAIRosterMoves — returns deterministic results', () => {
  it('produces same moves for same seed', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const makePlayers = () => {
      const p: Player[] = [];
      for (let i = 1; i <= 24; i++) {
        p.push(makePlayer({ playerId: i, teamId: 2 }));
      }
      p.push(makePlayer({
        playerId: 25, teamId: 2, overall: 400,
        rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
      }));
      return p;
    };

    const moves1 = processAIRosterMoves(makePlayers(), teams, 1, 42);
    const moves2 = processAIRosterMoves(makePlayers(), teams, 1, 42);
    expect(moves1.length).toBe(moves2.length);
    expect(moves1.map(m => m.playerId)).toEqual(moves2.map(m => m.playerId));
  });
});

describe('processAIRosterMoves — caps moves per team', () => {
  it('calls up at most 3 players per team', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const players: Player[] = [];

    // Only 20 active (6 short) for team 2
    for (let i = 1; i <= 20; i++) {
      players.push(makePlayer({ playerId: i, teamId: 2 }));
    }
    // 6 AAA prospects
    for (let i = 21; i <= 26; i++) {
      players.push(makePlayer({
        playerId: i, teamId: 2, overall: 400,
        rosterData: { ...makePlayer({ playerId: 0, teamId: 0 }).rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
      }));
    }

    const moves = processAIRosterMoves(players, teams, 1, 42);
    const callUps = moves.filter(m => m.type === 'call_up' && m.teamId === 2);
    expect(callUps.length).toBeLessThanOrEqual(3);
  });
});

describe('processAIRosterMoves — empty inputs', () => {
  it('returns empty array when no AI teams', () => {
    const teams = [makeTeam(1, 'USR')];
    const players = [makePlayer({ playerId: 1, teamId: 1 })];
    const moves = processAIRosterMoves(players, teams, 1, 42);
    expect(moves).toEqual([]);
  });

  it('returns empty array when no players', () => {
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const moves = processAIRosterMoves([], teams, 1, 42);
    expect(moves).toEqual([]);
  });
});
