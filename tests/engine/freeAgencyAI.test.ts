import { describe, it, expect } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import type { StandingsRow } from '../../src/types/league';
import { processAISignings, projectSalary, projectYears } from '../../src/engine/freeAgency';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { playerId: number; position: Position }): Player {
  const isPitcher = ['SP', 'RP', 'CL'].includes(overrides.position);
  return {
    playerId: overrides.playerId,
    teamId: overrides.teamId ?? -1,
    name: overrides.name ?? `Player ${overrides.playerId}`,
    age: overrides.age ?? 27,
    position: overrides.position,
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher,
    hitterAttributes: isPitcher ? null : {
      contact: 350, power: 350, eye: 350, speed: 300, fielding: 300,
      armStrength: 300, durability: 350, baserunningIQ: 300,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 60, mentalToughness: 55,
    },
    pitcherAttributes: isPitcher ? {
      stuff: 350, movement: 350, command: 350, stamina: 350,
      pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 300,
      durability: 350, recoveryRate: 300, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
      pitchingIQ: 300, workEthic: 60, mentalToughness: 55,
    } : null,
    overall: overrides.overall ?? 350,
    potential: overrides.potential ?? 380,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: overrides.rosterData?.rosterStatus ?? 'FREE_AGENT',
      isOn40Man: false,
      optionYearsRemaining: 0,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 172 * 6,
      serviceTimeCurrentTeamDays: 0,
      rule5Selected: false,
      signedSeason: 2020,
      signedAge: 22,
      contractYearsRemaining: 0,
      salary: 0,
      arbitrationEligible: false,
      freeAgentEligible: true,
      hasTenAndFive: false,
      ...overrides.rosterData,
    },
  };
}

function makeTeam(teamId: number, abbr: string, wins = 81): Team {
  return {
    teamId,
    name: `Team ${abbr}`,
    abbreviation: abbr,
    city: `City ${abbr}`,
    league: teamId <= 15 ? 'AL' : 'NL',
    division: 'East',
    parkFactorId: 0,
    budget: 150_000_000,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'fringe',
    seasonRecord: { wins, losses: 162 - wins, runsScored: wins * 5, runsAllowed: (162 - wins) * 5 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
  };
}

function makeStandings(teams: Team[]): StandingsRow[] {
  return teams.map(t => ({
    teamId: t.teamId,
    name: t.name,
    abbreviation: t.abbreviation,
    league: t.league,
    division: t.division,
    wins: t.seasonRecord.wins,
    losses: t.seasonRecord.losses,
    pct: t.seasonRecord.wins / 162,
    gb: 0,
    runsScored: t.seasonRecord.runsScored,
    runsAllowed: t.seasonRecord.runsAllowed,
    pythagWins: t.seasonRecord.wins,
  }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('projectSalary', () => {
  it('projects higher salary for higher OVR', () => {
    const elite = makePlayer({ playerId: 1, position: 'SS', overall: 450, age: 27 });
    const avg = makePlayer({ playerId: 2, position: 'SS', overall: 300, age: 27 });
    expect(projectSalary(elite)).toBeGreaterThan(projectSalary(avg));
  });

  it('applies age discount for 33+ players', () => {
    const young = makePlayer({ playerId: 1, position: 'SS', overall: 400, age: 28 });
    const old = makePlayer({ playerId: 2, position: 'SS', overall: 400, age: 35 });
    expect(projectSalary(old)).toBeLessThan(projectSalary(young));
  });
});

describe('projectYears', () => {
  it('projects more years for younger elite players', () => {
    const young = makePlayer({ playerId: 1, position: 'SS', overall: 450, age: 26 });
    const old = makePlayer({ playerId: 2, position: 'SS', overall: 450, age: 37 });
    expect(projectYears(young)).toBeGreaterThan(projectYears(old));
  });

  it('never projects more than 6 years', () => {
    const superstar = makePlayer({ playerId: 1, position: 'SS', overall: 500, age: 25 });
    expect(projectYears(superstar)).toBeLessThanOrEqual(6);
  });
});

describe('processAISignings (needs-based)', () => {
  it('signs free agents to AI teams', () => {
    const userTeamId = 1;
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1'), makeTeam(3, 'AI2')];
    const standings = makeStandings(teams);

    // Create some active roster players for AI teams
    const activePlayers: Player[] = [];
    const positions: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP'];
    let pid = 100;
    for (const team of teams) {
      for (const pos of positions) {
        activePlayers.push(makePlayer({
          playerId: pid++, position: pos, teamId: team.teamId, overall: 320,
          rosterData: { rosterStatus: 'MLB_ACTIVE', isOn40Man: true } as Player['rosterData'],
        }));
      }
    }

    // Free agents
    const fas = [
      makePlayer({ playerId: 1, position: 'SP', overall: 400, name: 'Ace Pitcher' }),
      makePlayer({ playerId: 2, position: 'SS', overall: 380, name: 'Star Shortstop' }),
      makePlayer({ playerId: 3, position: 'RF', overall: 300, name: 'Bench Outfielder' }),
    ];

    const allPlayers = [...activePlayers, ...fas];
    const result = processAISignings(allPlayers, teams, userTeamId, standings);

    expect(result.count).toBeGreaterThan(0);
    // FAs should be signed to AI teams, not user team
    for (const signing of result.signings) {
      expect(signing.teamId).not.toBe(userTeamId);
    }
  });

  it('contender teams target higher-OVR free agents', () => {
    const userTeamId = 1;
    const contender = makeTeam(2, 'WIN', 95); // High wins = contender
    const rebuilder = makeTeam(3, 'REB', 55); // Low wins = rebuilder
    const teams = [makeTeam(1, 'USR'), contender, rebuilder];
    const standings = makeStandings(teams);

    // Give teams active rosters
    const activePlayers: Player[] = [];
    const positions: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH',
      'SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP'];
    let pid = 100;
    for (const team of teams) {
      const ovr = team.teamId === 2 ? 370 : team.teamId === 3 ? 260 : 320;
      for (const pos of positions) {
        activePlayers.push(makePlayer({
          playerId: pid++, position: pos, teamId: team.teamId, overall: ovr,
          rosterData: { rosterStatus: 'MLB_ACTIVE', isOn40Man: true } as Player['rosterData'],
        }));
      }
    }

    // One premium FA
    const premiumFA = makePlayer({ playerId: 1, position: 'SP', overall: 420, age: 28, name: 'Elite Arm' });

    const allPlayers = [...activePlayers, premiumFA];
    const result = processAISignings(allPlayers, teams, userTeamId, standings);

    // The premium FA should be more likely to go to the contender
    const signing = result.signings.find(s => s.playerName === 'Elite Arm');
    if (signing) {
      // Contender should win the bidding (higher interest)
      expect(signing.teamId).toBe(contender.teamId);
    }
  });

  it('produces signing reasons', () => {
    const userTeamId = 1;
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const standings = makeStandings(teams);

    // Give team 2 a minimal roster (missing SP)
    const activePlayers: Player[] = [];
    let pid = 100;
    const basicPos: Position[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH'];
    for (const pos of basicPos) {
      activePlayers.push(makePlayer({
        playerId: pid++, position: pos, teamId: 2, overall: 320,
        rosterData: { rosterStatus: 'MLB_ACTIVE', isOn40Man: true } as Player['rosterData'],
      }));
    }

    const fa = makePlayer({ playerId: 1, position: 'SP', overall: 350, name: 'FA Pitcher' });
    const allPlayers = [...activePlayers, fa];
    const result = processAISignings(allPlayers, teams, userTeamId, standings);

    // Should have a signing with a reason
    if (result.signings.length > 0) {
      expect(result.signings[0].reason).toBeDefined();
      expect(result.signings[0].reason.length).toBeGreaterThan(0);
    }
  });

  it('respects max 5 signings per team', () => {
    const userTeamId = 1;
    const teams = [makeTeam(1, 'USR'), makeTeam(2, 'AI1')];
    const standings = makeStandings(teams);

    // Team 2 has some roster
    const activePlayers: Player[] = [];
    let pid = 100;
    for (let i = 0; i < 10; i++) {
      activePlayers.push(makePlayer({
        playerId: pid++, position: 'RF', teamId: 2, overall: 300,
        rosterData: { rosterStatus: 'MLB_ACTIVE', isOn40Man: true } as Player['rosterData'],
      }));
    }

    // 10 FAs
    const fas: Player[] = [];
    for (let i = 0; i < 10; i++) {
      fas.push(makePlayer({ playerId: i + 1, position: 'SP', overall: 320 + i * 5 }));
    }

    const allPlayers = [...activePlayers, ...fas];
    const result = processAISignings(allPlayers, teams, userTeamId, standings);

    const team2Signings = result.signings.filter(s => s.teamId === 2);
    expect(team2Signings.length).toBeLessThanOrEqual(5);
  });
});
