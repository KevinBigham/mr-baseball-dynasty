import { describe, it, expect } from 'vitest';
import {
  classifyTeamMode,
  analyzePositionalNeeds,
  computeTeamProfile,
  rankTargets,
  evaluateTradeForTeam,
  computeTeamPayroll,
} from '../../src/engine/aiTeamIntelligence';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import type { StandingsRow } from '../../src/types/league';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    teamId: 1,
    name: 'Test Team',
    abbreviation: 'TST',
    city: 'Test City',
    league: 'AL',
    division: 'East',
    conferenceId: 0,
    divisionId: 0,
    parkFactorId: 0,
    budget: 150_000_000,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'fringe',
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Player',
    firstName: 'Test',
    lastName: 'Player',
    leagueLevel: 'MLB',
    age: 28,
    position: 'CF',
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
      optionYearsRemaining: 1,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 2,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  };
}

function makeStandingsRow(overrides: Partial<StandingsRow> = {}): StandingsRow {
  return {
    teamId: 1, name: 'Test Team', abbreviation: 'TST',
    league: 'AL', division: 'East',
    wins: 81, losses: 81, pct: 0.5, gb: 0,
    runsScored: 700, runsAllowed: 700, pythagWins: 81,
    ...overrides,
  };
}

// Generate N MLB_ACTIVE players for a team
function makeRoster(teamId: number, count: number, baseOvr: number, baseAge = 28): Player[] {
  const positions: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
    'SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP',
    'RP', 'RP', 'C', '1B', '2B', 'SS', '3B'];
  return Array.from({ length: count }, (_, i) => makePlayer({
    playerId: teamId * 100 + i,
    teamId,
    position: positions[i % positions.length],
    overall: baseOvr + (i % 5) * 10 - 20,
    potential: baseOvr + 50,
    age: baseAge + (i % 6) - 2,
    isPitcher: ['SP', 'RP'].includes(positions[i % positions.length]),
    rosterData: {
      ...makePlayer().rosterData,
      salary: 3_000_000 + i * 500_000,
    },
  }));
}

// ─── classifyTeamMode ────────────────────────────────────────────────────────

describe('classifyTeamMode', () => {
  it('classifies a high-win high-OVR team as contender', () => {
    const team = makeTeam({ seasonRecord: { wins: 95, losses: 67, runsScored: 850, runsAllowed: 650 } });
    const players = makeRoster(1, 26, 380);
    expect(classifyTeamMode(team, players)).toBe('contender');
  });

  it('classifies a low-win low-OVR team as rebuilder', () => {
    const team = makeTeam({ seasonRecord: { wins: 60, losses: 102, runsScored: 550, runsAllowed: 850 } });
    const players = makeRoster(1, 26, 260);
    expect(classifyTeamMode(team, players)).toBe('rebuilder');
  });

  it('classifies a middling team as fringe', () => {
    const team = makeTeam({ seasonRecord: { wins: 80, losses: 82, runsScored: 700, runsAllowed: 710 } });
    const players = makeRoster(1, 26, 320);
    expect(classifyTeamMode(team, players)).toBe('fringe');
  });

  it('uses standings data when provided', () => {
    const team = makeTeam();
    const players = makeRoster(1, 26, 380);
    const standings = [makeStandingsRow({ teamId: 1, wins: 95, pythagWins: 93 })];
    expect(classifyTeamMode(team, players, standings)).toBe('contender');
  });

  it('an aging contender with low farm is still contender if winning', () => {
    const team = makeTeam({ seasonRecord: { wins: 92, losses: 70, runsScored: 800, runsAllowed: 650 } });
    const players = makeRoster(1, 26, 370, 33);
    expect(classifyTeamMode(team, players)).toBe('contender');
  });
});

// ─── analyzePositionalNeeds ──────────────────────────────────────────────────

describe('analyzePositionalNeeds', () => {
  it('identifies critical need when position has no MLB players', () => {
    // Roster has no catcher
    const players = makeRoster(1, 20, 350).filter(p => p.position !== 'C');
    const needs = analyzePositionalNeeds(1, players);
    const catcherNeed = needs.find(n => n.position === 'C');
    expect(catcherNeed).toBeDefined();
    expect(catcherNeed!.severity).toBe('critical');
  });

  it('returns empty array when roster is well-stocked', () => {
    // Build a complete roster with all positions covered at good OVR
    const positions: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
      'SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP'];
    const players = positions.map((pos, i) => makePlayer({
      playerId: i + 1, teamId: 1, position: pos, overall: 380,
      isPitcher: ['SP', 'RP'].includes(pos),
    }));
    const needs = analyzePositionalNeeds(1, players);
    expect(needs.length).toBe(0);
  });

  it('identifies SP as moderate need when only 3 starters', () => {
    const positions: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
      'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP'];
    const players = positions.map((pos, i) => makePlayer({
      playerId: i + 1, teamId: 1, position: pos, overall: 350,
      isPitcher: ['SP', 'RP'].includes(pos),
    }));
    const needs = analyzePositionalNeeds(1, players);
    const spNeed = needs.find(n => n.position === 'SP');
    expect(spNeed).toBeDefined();
    expect(spNeed!.severity).toBe('moderate');
  });

  it('sorts needs by severity: critical before moderate before mild', () => {
    // No catcher (critical), only 3 SP (moderate)
    const positions: Position[] = ['1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
      'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP'];
    const players = positions.map((pos, i) => makePlayer({
      playerId: i + 1, teamId: 1, position: pos, overall: 350,
      isPitcher: ['SP', 'RP'].includes(pos),
    }));
    const needs = analyzePositionalNeeds(1, players);
    expect(needs.length).toBeGreaterThan(0);
    // First need should be critical (catcher)
    expect(needs[0].severity).toBe('critical');
  });
});

// ─── computeTeamProfile ──────────────────────────────────────────────────────

describe('computeTeamProfile', () => {
  it('returns a complete profile with all fields', () => {
    const team = makeTeam();
    const players = makeRoster(1, 26, 340);
    const profile = computeTeamProfile(team, players);

    expect(profile.teamId).toBe(1);
    expect(['contender', 'fringe', 'rebuilder']).toContain(profile.mode);
    expect(profile.windowYears).toBeGreaterThanOrEqual(1);
    expect(profile.windowYears).toBeLessThanOrEqual(5);
    expect(profile.rosterStrength).toBeGreaterThanOrEqual(0);
    expect(profile.rosterStrength).toBeLessThanOrEqual(100);
    expect(profile.farmStrength).toBeGreaterThanOrEqual(0);
    expect(profile.farmStrength).toBeLessThanOrEqual(100);
    expect(profile.payrollFlexibility).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(profile.positionalNeeds)).toBe(true);
    expect(Array.isArray(profile.priorityActions)).toBe(true);
  });

  it('contender profile has win_now_FA priority', () => {
    const team = makeTeam({ seasonRecord: { wins: 95, losses: 67, runsScored: 850, runsAllowed: 650 } });
    const players = makeRoster(1, 26, 390);
    const profile = computeTeamProfile(team, players);
    expect(profile.mode).toBe('contender');
    expect(profile.priorityActions).toContain('win_now_FA');
  });

  it('rebuilder profile has prospect_hoard priority', () => {
    const team = makeTeam({ seasonRecord: { wins: 55, losses: 107, runsScored: 500, runsAllowed: 900 } });
    const players = makeRoster(1, 26, 250);
    const profile = computeTeamProfile(team, players);
    expect(profile.mode).toBe('rebuilder');
    expect(profile.priorityActions).toContain('prospect_hoard');
  });

  it('payrollFlexibility is budget minus payroll', () => {
    const team = makeTeam({ budget: 100_000_000 });
    const players = [
      makePlayer({ teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 30_000_000 } }),
      makePlayer({ playerId: 2, teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 20_000_000 } }),
    ];
    const profile = computeTeamProfile(team, players);
    expect(profile.payrollFlexibility).toBe(50_000_000);
  });
});

// ─── rankTargets ─────────────────────────────────────────────────────────────

describe('rankTargets', () => {
  it('ranks players filling a critical need higher', () => {
    // Profile needs a catcher critically
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'fringe', windowYears: 2,
      positionalNeeds: [{ position: 'C', severity: 'critical', urgency: 'immediate', bestInternalOvr: 0 }],
      rosterStrength: 50, farmStrength: 50, payrollFlexibility: 50_000_000,
      priorityActions: ['draft_positional_need'],
    };

    const catcher = makePlayer({ playerId: 1, position: 'C', overall: 300 });
    const outfielder = makePlayer({ playerId: 2, position: 'RF', overall: 300 });

    const ranked = rankTargets(profile, [catcher, outfielder]);
    expect(ranked[0].player.playerId).toBe(1); // Catcher ranked first due to need bonus
  });

  it('contender profile prefers MLB-ready over raw prospects', () => {
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'contender', windowYears: 2,
      positionalNeeds: [],
      rosterStrength: 80, farmStrength: 30, payrollFlexibility: 50_000_000,
      priorityActions: ['win_now_FA'],
    };

    const veteran = makePlayer({ playerId: 1, overall: 370, age: 29 });
    const prospect = makePlayer({
      playerId: 2, overall: 220, potential: 450, age: 20,
      rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AA' },
    });

    const ranked = rankTargets(profile, [veteran, prospect]);
    expect(ranked[0].player.playerId).toBe(1); // Veteran ranked first
  });

  it('rebuilder profile prefers high-upside youth', () => {
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'rebuilder', windowYears: 4,
      positionalNeeds: [],
      rosterStrength: 30, farmStrength: 70, payrollFlexibility: 80_000_000,
      priorityActions: ['prospect_hoard'],
    };

    const expensiveVet = makePlayer({
      playerId: 1, overall: 360, age: 32,
      rosterData: { ...makePlayer().rosterData, salary: 20_000_000 },
    });
    const youngProspect = makePlayer({
      playerId: 2, overall: 280, potential: 450, age: 22,
      rosterData: { ...makePlayer().rosterData, salary: 700_000 },
    });

    const ranked = rankTargets(profile, [expensiveVet, youngProspect]);
    // Young prospect gets +15 for high ceiling, veteran gets -15 for expensive/old
    expect(ranked[0].player.playerId).toBe(2);
  });
});

// ─── evaluateTradeForTeam ────────────────────────────────────────────────────

describe('evaluateTradeForTeam', () => {
  it('accepts trade that fills a critical need', () => {
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'fringe', windowYears: 2,
      positionalNeeds: [{ position: 'SS', severity: 'critical', urgency: 'immediate', bestInternalOvr: 0 }],
      rosterStrength: 50, farmStrength: 50, payrollFlexibility: 50_000_000,
      priorityActions: ['draft_positional_need'],
    };

    const incomingSS = makePlayer({ playerId: 10, position: 'SS', overall: 330 });
    const outgoingOF = makePlayer({ playerId: 20, position: 'RF', overall: 330 });

    const result = evaluateTradeForTeam(profile, [incomingSS], [outgoingOF]);
    expect(result.accept).toBe(true);
  });

  it('rejects lopsided trade against the team', () => {
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'fringe', windowYears: 2,
      positionalNeeds: [],
      rosterStrength: 50, farmStrength: 50, payrollFlexibility: 50_000_000,
      priorityActions: [],
    };

    const weakPlayer = makePlayer({ playerId: 10, overall: 200 });
    const star = makePlayer({ playerId: 20, overall: 450 });

    const result = evaluateTradeForTeam(profile, [weakPlayer], [star]);
    expect(result.accept).toBe(false);
    expect(result.netValue).toBeLessThan(0);
  });

  it('rebuilder is more willing to trade veterans', () => {
    const profile: ReturnType<typeof computeTeamProfile> = {
      teamId: 1, mode: 'rebuilder', windowYears: 4,
      positionalNeeds: [],
      rosterStrength: 30, farmStrength: 70, payrollFlexibility: 80_000_000,
      priorityActions: ['prospect_hoard'],
    };

    const youngProspect = makePlayer({ playerId: 10, overall: 280, potential: 430, age: 21 });
    const oldVeteran = makePlayer({ playerId: 20, overall: 340, age: 33 });

    const result = evaluateTradeForTeam(profile, [youngProspect], [oldVeteran]);
    // Rebuilder discounts veteran (0.8x) and values young upside (1.2x)
    expect(result.accept).toBe(true);
  });
});

// ─── computeTeamPayroll ──────────────────────────────────────────────────────

describe('computeTeamPayroll', () => {
  it('sums salaries for team players', () => {
    const players = [
      makePlayer({ teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 10_000_000 } }),
      makePlayer({ playerId: 2, teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 5_000_000 } }),
      makePlayer({ playerId: 3, teamId: 2, rosterData: { ...makePlayer().rosterData, salary: 20_000_000 } }),
    ];
    expect(computeTeamPayroll(players, 1)).toBe(15_000_000);
  });

  it('ignores players with zero salary', () => {
    const players = [
      makePlayer({ teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 0 } }),
      makePlayer({ playerId: 2, teamId: 1, rosterData: { ...makePlayer().rosterData, salary: 5_000_000 } }),
    ];
    expect(computeTeamPayroll(players, 1)).toBe(5_000_000);
  });
});
