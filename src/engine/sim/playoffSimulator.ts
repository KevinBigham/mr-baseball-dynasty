import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import type { StandingsRow } from '../../types/league';
import { simulateGame, type SimulateGameInput } from './gameSimulator';

// ─── Playoff types ──────────────────────────────────────────────────────────

export interface PlayoffTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  seed: number;
  wins: number;
  losses: number;
  league: string;
}

export interface PlayoffGame {
  gameNumber: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

export interface PlayoffSeries {
  round: 'WC' | 'DS' | 'CS' | 'WS';
  higherSeed: PlayoffTeam;
  lowerSeed: PlayoffTeam;
  games: PlayoffGame[];
  higherSeedWins: number;
  lowerSeedWins: number;
  winnerId: number;
  bestOf: number;
}

export interface PlayoffBracket {
  alTeams: PlayoffTeam[];
  nlTeams: PlayoffTeam[];
  wildCardRound: PlayoffSeries[];
  divisionSeries: PlayoffSeries[];
  championshipSeries: PlayoffSeries[];
  worldSeries: PlayoffSeries | null;
  championId: number | null;
  championName: string | null;
}

// ─── Determine playoff field ─────────────────────────────────────────────────
// Modern MLB format: 6 teams per league (3 div winners + 3 wild cards)
export function determinePlayoffField(standings: StandingsRow[]): { al: PlayoffTeam[]; nl: PlayoffTeam[] } {
  const al = standings.filter(r => r.league === 'AL');
  const nl = standings.filter(r => r.league === 'NL');

  function getLeagueField(rows: StandingsRow[], league: string): PlayoffTeam[] {
    // Division winners
    const divs = ['East', 'Central', 'West'];
    const divWinners: StandingsRow[] = [];
    for (const div of divs) {
      const divTeams = rows.filter(r => r.division === div).sort((a, b) => b.wins - a.wins);
      if (divTeams.length > 0) divWinners.push(divTeams[0]);
    }
    divWinners.sort((a, b) => b.wins - a.wins);

    // Wild cards: best 3 remaining
    const divWinnerIds = new Set(divWinners.map(d => d.teamId));
    const remaining = rows.filter(r => !divWinnerIds.has(r.teamId)).sort((a, b) => b.wins - a.wins);
    const wildcards = remaining.slice(0, 3);

    // Seed 1-3: division winners by record, 4-6: wild cards by record
    const all = [...divWinners, ...wildcards];
    return all.map((r, i) => ({
      teamId: r.teamId,
      name: r.name,
      abbreviation: r.abbreviation,
      seed: i + 1,
      wins: r.wins,
      losses: r.losses,
      league,
    }));
  }

  return {
    al: getLeagueField(al, 'AL'),
    nl: getLeagueField(nl, 'NL'),
  };
}

// ─── Simulate a single series ────────────────────────────────────────────────
function simulateSeries(
  higher: PlayoffTeam,
  lower: PlayoffTeam,
  round: 'WC' | 'DS' | 'CS' | 'WS',
  bestOf: number,
  teams: Team[],
  players: Player[],
  baseSeed: number,
): PlayoffSeries {
  const winsNeeded = Math.ceil(bestOf / 2);
  const games: PlayoffGame[] = [];
  let higherWins = 0;
  let lowerWins = 0;

  const homeTeam = teams.find(t => t.teamId === higher.teamId)!;
  const awayTeam = teams.find(t => t.teamId === lower.teamId)!;

  // Home-field advantage pattern
  // Best-of-7: 2-2-1-1-1 (higher seed has games 1,2,5,7 at home)
  // Best-of-5: 2-2-1 (higher seed has games 1,2,5 at home)
  // Best-of-3: 2-1 (higher seed has games 1,2 at home)
  function isHigherHome(gameNum: number): boolean {
    if (bestOf === 3) return gameNum <= 2;
    if (bestOf === 5) return gameNum <= 2 || gameNum === 5;
    // bestOf === 7
    return gameNum <= 2 || gameNum === 5 || gameNum === 7;
  }

  let gameNum = 0;
  while (higherWins < winsNeeded && lowerWins < winsNeeded) {
    gameNum++;
    const higherIsHome = isHigherHome(gameNum);
    const gameSeed = (baseSeed ^ (gameNum * 2654435761)) >>> 0;

    const input: SimulateGameInput = {
      gameId: baseSeed * 100 + gameNum,
      season: 0,
      date: `playoff-${round}-G${gameNum}`,
      homeTeam: higherIsHome
        ? { ...homeTeam, rotationIndex: gameNum - 1, bullpenReliefCounter: 0 }
        : { ...awayTeam, rotationIndex: gameNum - 1, bullpenReliefCounter: 0 },
      awayTeam: higherIsHome
        ? { ...awayTeam, rotationIndex: gameNum - 1, bullpenReliefCounter: 0 }
        : { ...homeTeam, rotationIndex: gameNum - 1, bullpenReliefCounter: 0 },
      players,
      seed: gameSeed,
    };

    const result = simulateGame(input);
    const homeId = higherIsHome ? higher.teamId : lower.teamId;
    const awayId = higherIsHome ? lower.teamId : higher.teamId;
    const homeWon = result.homeScore > result.awayScore;

    games.push({
      gameNumber: gameNum,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
    });

    if ((higherIsHome && homeWon) || (!higherIsHome && !homeWon)) {
      higherWins++;
    } else {
      lowerWins++;
    }
  }

  return {
    round,
    higherSeed: higher,
    lowerSeed: lower,
    games,
    higherSeedWins: higherWins,
    lowerSeedWins: lowerWins,
    winnerId: higherWins >= winsNeeded ? higher.teamId : lower.teamId,
    bestOf,
  };
}

// ─── Find team helper ────────────────────────────────────────────────────────
function findTeamInField(field: PlayoffTeam[], teamId: number): PlayoffTeam {
  return field.find(t => t.teamId === teamId)!;
}

// ─── Full playoff simulation ─────────────────────────────────────────────────
export function simulateFullPlayoffs(
  standings: StandingsRow[],
  teams: Team[],
  players: Player[],
  baseSeed: number,
): PlayoffBracket {
  const { al, nl } = determinePlayoffField(standings);

  // ── Wild Card Round (best-of-3) ──
  // Seeds 1-2 get bye. 3 vs 6, 4 vs 5
  const wildCardRound: PlayoffSeries[] = [];

  // AL Wild Card
  const alWC1 = simulateSeries(al[2], al[5], 'WC', 3, teams, players, baseSeed + 1);
  const alWC2 = simulateSeries(al[3], al[4], 'WC', 3, teams, players, baseSeed + 2);
  wildCardRound.push(alWC1, alWC2);

  // NL Wild Card
  const nlWC1 = simulateSeries(nl[2], nl[5], 'WC', 3, teams, players, baseSeed + 3);
  const nlWC2 = simulateSeries(nl[3], nl[4], 'WC', 3, teams, players, baseSeed + 4);
  wildCardRound.push(nlWC1, nlWC2);

  // ── Division Series (best-of-5) ──
  // AL: #1 vs lower WC winner, #2 vs higher WC winner
  const alDS1Higher = al[0]; // #1 seed
  const alDS1Lower = findTeamInField(al, alWC2.winnerId); // 4/5 winner
  const alDS2Higher = al[1]; // #2 seed
  const alDS2Lower = findTeamInField(al, alWC1.winnerId); // 3/6 winner

  const alDS1 = simulateSeries(alDS1Higher, alDS1Lower, 'DS', 5, teams, players, baseSeed + 10);
  const alDS2 = simulateSeries(alDS2Higher, alDS2Lower, 'DS', 5, teams, players, baseSeed + 11);

  const nlDS1Higher = nl[0];
  const nlDS1Lower = findTeamInField(nl, nlWC2.winnerId);
  const nlDS2Higher = nl[1];
  const nlDS2Lower = findTeamInField(nl, nlWC1.winnerId);

  const nlDS1 = simulateSeries(nlDS1Higher, nlDS1Lower, 'DS', 5, teams, players, baseSeed + 12);
  const nlDS2 = simulateSeries(nlDS2Higher, nlDS2Lower, 'DS', 5, teams, players, baseSeed + 13);

  const divisionSeries = [alDS1, alDS2, nlDS1, nlDS2];

  // ── Championship Series (best-of-7) ──
  const alcsHigher = findTeamInField(al, alDS1.winnerId);
  const alcsLower = findTeamInField(al, alDS2.winnerId);
  const alcs = simulateSeries(
    alcsHigher.wins >= alcsLower.wins ? alcsHigher : alcsLower,
    alcsHigher.wins >= alcsLower.wins ? alcsLower : alcsHigher,
    'CS', 7, teams, players, baseSeed + 20,
  );

  const nlcsHigher = findTeamInField(nl, nlDS1.winnerId);
  const nlcsLower = findTeamInField(nl, nlDS2.winnerId);
  const nlcs = simulateSeries(
    nlcsHigher.wins >= nlcsLower.wins ? nlcsHigher : nlcsLower,
    nlcsHigher.wins >= nlcsLower.wins ? nlcsLower : nlcsHigher,
    'CS', 7, teams, players, baseSeed + 21,
  );

  const championshipSeries = [alcs, nlcs];

  // ── World Series (best-of-7) ──
  const alChamp = findTeamInField(al, alcs.winnerId);
  const nlChamp = findTeamInField(nl, nlcs.winnerId);
  const ws = simulateSeries(
    alChamp.wins >= nlChamp.wins ? alChamp : nlChamp,
    alChamp.wins >= nlChamp.wins ? nlChamp : alChamp,
    'WS', 7, teams, players, baseSeed + 30,
  );

  const champion = ws.winnerId === alChamp.teamId ? alChamp : nlChamp;

  return {
    alTeams: al,
    nlTeams: nl,
    wildCardRound,
    divisionSeries,
    championshipSeries,
    worldSeries: ws,
    championId: champion.teamId,
    championName: champion.name,
  };
}
