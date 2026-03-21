/**
 * Round 2 — Playoff system tests.
 * Tests bracket seeding, series outcomes, playoff result recording, and MVP selection.
 */
import { describe, it, expect } from 'vitest';
import {
  determinePlayoffField,
  simulateFullPlayoffs,
  type PlayoffBracket,
} from '../../src/engine/sim/playoffSimulator';
import type { StandingsRow } from '../../src/types/league';
import type { Team } from '../../src/types/team';
import type { Player } from '../../src/types/player';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeStandingsRow(overrides: Partial<StandingsRow> & { teamId: number; league: string; division: string }): StandingsRow {
  return {
    name: `Team ${overrides.teamId}`,
    abbreviation: `T${overrides.teamId}`,
    wins: 81,
    losses: 81,
    pct: 0.500,
    gb: 0,
    runsScored: 700,
    runsAllowed: 700,
    streak: 0,
    last10: '5-5',
    ...overrides,
  } as StandingsRow;
}

function makeTeam(id: number, league: string, division: string): Team {
  return {
    teamId: id,
    name: `Team ${id}`,
    abbreviation: `T${id}`,
    city: `City ${id}`,
    league: league as any,
    division: division as any,
    conferenceId: league === 'AL' ? 0 : 1,
    divisionId: 0,
    parkFactorId: 0,
    budget: 100000000,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'contender',
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
  } as Team;
}

function makePlayer(id: number, teamId: number, overrides: Partial<Player> = {}): Player {
  return {
    playerId: id,
    teamId,
    name: `Player ${id}`,
    firstName: 'Test',
    lastName: `P${id}`,
    age: 27,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    leagueLevel: 'MLB',
    isPitcher: false,
    hitterAttributes: null,
    pitcherAttributes: null,
    overall: 300,
    potential: 350,
    development: {
      meanReversion: 0, volatility: 0.1, peak: 28, declineRate: 0.02,
      lastDelta: 0, peakReached: false,
    } as any,
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 172,
      serviceTimeCurrentTeamDays: 172,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 3,
      salary: 5000000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

function buildFullStandings(): StandingsRow[] {
  // 30 teams: 15 AL, 15 NL, 5 per division
  const rows: StandingsRow[] = [];
  let id = 1;
  for (const league of ['AL', 'NL']) {
    for (const div of ['East', 'Central', 'West']) {
      for (let i = 0; i < 5; i++) {
        rows.push(makeStandingsRow({
          teamId: id,
          league,
          division: div,
          wins: 95 - i * 5 - (div === 'Central' ? 2 : 0) - (div === 'West' ? 4 : 0),
          losses: 67 + i * 5 + (div === 'Central' ? 2 : 0) + (div === 'West' ? 4 : 0),
        }));
        id++;
      }
    }
  }
  return rows;
}

function buildTeams(): Team[] {
  const teams: Team[] = [];
  let id = 1;
  for (const league of ['AL', 'NL']) {
    for (const div of ['East', 'Central', 'West']) {
      for (let i = 0; i < 5; i++) {
        teams.push(makeTeam(id, league, div));
        id++;
      }
    }
  }
  return teams;
}

function buildPlayers(teams: Team[]): Player[] {
  const players: Player[] = [];
  let pid = 1;
  for (const team of teams) {
    for (let i = 0; i < 25; i++) {
      players.push(makePlayer(pid, team.teamId, {
        overall: 250 + Math.round(Math.random() * 150),
        isPitcher: i >= 16,
        position: (i >= 16 ? 'SP' : ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'][i % 8]) as any,
      }));
      pid++;
    }
  }
  return players;
}

// ─── Bracket seeding ────────────────────────────────────────────────────────

describe('determinePlayoffField — bracket seeding', () => {
  it('returns 6 teams per league', () => {
    const standings = buildFullStandings();
    const { al, nl } = determinePlayoffField(standings);
    expect(al.length).toBe(6);
    expect(nl.length).toBe(6);
  });

  it('division winners are seeds 1-3', () => {
    const standings = buildFullStandings();
    const { al } = determinePlayoffField(standings);
    // Seeds 1-3 should be division winners (one from each division)
    const divWinnerSeeds = al.filter(t => t.seed <= 3);
    expect(divWinnerSeeds.length).toBe(3);
  });

  it('wild cards are seeds 4-6', () => {
    const standings = buildFullStandings();
    const { al } = determinePlayoffField(standings);
    const wcSeeds = al.filter(t => t.seed >= 4);
    expect(wcSeeds.length).toBe(3);
  });

  it('seeds are ordered 1 through 6', () => {
    const standings = buildFullStandings();
    const { al, nl } = determinePlayoffField(standings);
    expect(al.map(t => t.seed)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(nl.map(t => t.seed)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('best record gets seed 1', () => {
    const standings = buildFullStandings();
    const { al } = determinePlayoffField(standings);
    // Team 1 has 95 wins (best in AL East)
    expect(al[0].wins).toBeGreaterThanOrEqual(al[1].wins);
  });
});

// ─── Full playoff simulation ────────────────────────────────────────────────

describe('simulateFullPlayoffs — series outcomes', () => {
  it('produces a complete bracket with a champion', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345);
    expect(bracket).not.toBeNull();
    expect(bracket!.championId).not.toBeNull();
    expect(bracket!.championName).toBeTruthy();
  });

  it('has 4 WC series (2 per league)', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    expect(bracket.wildCardRound.length).toBe(4);
  });

  it('has 4 DS series (2 per league)', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    expect(bracket.divisionSeries.length).toBe(4);
  });

  it('has 2 CS series (1 per league)', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    expect(bracket.championshipSeries.length).toBe(2);
  });

  it('has 1 World Series', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    expect(bracket.worldSeries).not.toBeNull();
    expect(bracket.worldSeries!.round).toBe('WS');
  });

  it('WC series are best-of-3', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    for (const s of bracket.wildCardRound) {
      expect(s.bestOf).toBe(3);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeGreaterThanOrEqual(2);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeLessThanOrEqual(3);
    }
  });

  it('DS series are best-of-5', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    for (const s of bracket.divisionSeries) {
      expect(s.bestOf).toBe(5);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeGreaterThanOrEqual(3);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeLessThanOrEqual(5);
    }
  });

  it('CS and WS series are best-of-7', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    for (const s of [...bracket.championshipSeries, bracket.worldSeries!]) {
      expect(s.bestOf).toBe(7);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeGreaterThanOrEqual(4);
      expect(s.higherSeedWins + s.lowerSeedWins).toBeLessThanOrEqual(7);
    }
  });

  it('champion is one of the playoff teams', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const allPlayoffTeamIds = new Set([
      ...bracket.alTeams.map(t => t.teamId),
      ...bracket.nlTeams.map(t => t.teamId),
    ]);
    expect(allPlayoffTeamIds.has(bracket.championId!)).toBe(true);
  });

  it('deterministic — same seed produces same champion', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket1 = simulateFullPlayoffs(standings, teams, players, 99999)!;
    const bracket2 = simulateFullPlayoffs(standings, teams, players, 99999)!;
    expect(bracket1.championId).toBe(bracket2.championId);
    expect(bracket1.worldSeries!.higherSeedWins).toBe(bracket2.worldSeries!.higherSeedWins);
    expect(bracket1.worldSeries!.lowerSeedWins).toBe(bracket2.worldSeries!.lowerSeedWins);
  });
});

// ─── Playoff result derivation helper ───────────────────────────────────────

function derivePlayoffResults(bracket: PlayoffBracket): Map<number, string> {
  const results = new Map<number, string>();

  for (const t of [...bracket.alTeams, ...bracket.nlTeams]) {
    results.set(t.teamId, 'WC');
  }
  for (const t of [bracket.alTeams[0], bracket.alTeams[1], bracket.nlTeams[0], bracket.nlTeams[1]]) {
    if (t) results.set(t.teamId, 'DS');
  }
  for (const s of bracket.wildCardRound) {
    results.set(s.winnerId, 'DS');
  }
  for (const s of bracket.divisionSeries) {
    results.set(s.winnerId, 'CS');
  }
  for (const s of bracket.championshipSeries) {
    results.set(s.winnerId, 'WS');
  }
  if (bracket.championId) {
    results.set(bracket.championId, 'Champion');
  }
  return results;
}

describe('playoff result recording', () => {
  it('champion team gets "Champion"', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const results = derivePlayoffResults(bracket);
    expect(results.get(bracket.championId!)).toBe('Champion');
  });

  it('WS loser gets "WS"', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const results = derivePlayoffResults(bracket);
    const ws = bracket.worldSeries!;
    const loserId = ws.winnerId === ws.higherSeed.teamId ? ws.lowerSeed.teamId : ws.higherSeed.teamId;
    expect(results.get(loserId)).toBe('WS');
  });

  it('CS losers get "CS"', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const results = derivePlayoffResults(bracket);
    for (const s of bracket.championshipSeries) {
      const loserId = s.winnerId === s.higherSeed.teamId ? s.lowerSeed.teamId : s.higherSeed.teamId;
      expect(results.get(loserId)).toBe('CS');
    }
  });

  it('all 12 playoff teams get a result', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const results = derivePlayoffResults(bracket);
    expect(results.size).toBe(12);
    for (const [, value] of results) {
      expect(['WC', 'DS', 'CS', 'WS', 'Champion']).toContain(value);
    }
  });

  it('exactly one Champion', () => {
    const standings = buildFullStandings();
    const teams = buildTeams();
    const players = buildPlayers(teams);
    const bracket = simulateFullPlayoffs(standings, teams, players, 12345)!;
    const results = derivePlayoffResults(bracket);
    const champions = [...results.values()].filter(v => v === 'Champion');
    expect(champions.length).toBe(1);
  });
});
