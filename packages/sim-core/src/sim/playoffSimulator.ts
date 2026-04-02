/**
 * @module playoffSimulator
 * Postseason bracket simulation: seeding, series play, championship.
 * Supports best-of-5 (Division Series) and best-of-7 (CS + World Series).
 */

import type { GameRNG } from '../math/prng.js';
import type { GeneratedPlayer } from '../player/generation.js';
import type { StandingsEntry } from '../league/standings.js';
import type { GameBoxScore, GameTeam } from './gameSimulator.js';
import { simulateGame } from './gameSimulator.js';
import { HITTER_POSITIONS, PITCHER_POSITIONS } from '../player/generation.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayoffSeed {
  readonly teamId: string;
  readonly seed: number;
  readonly wins: number;
  readonly losses: number;
}

export interface SeriesResult {
  readonly winnerId: string;
  readonly loserId: string;
  readonly winnerWins: number;
  readonly loserWins: number;
  readonly games: GameBoxScore[];
  readonly round: PlayoffRound;
}

export type PlayoffRound = 'WILD_CARD' | 'DIVISION_SERIES' | 'CHAMPIONSHIP_SERIES' | 'WORLD_SERIES';

export interface PlayoffBracket {
  readonly seeds: PlayoffSeed[];
  readonly series: SeriesResult[];
  readonly champion: string | null;
}

export interface PlayoffPreviewTeamSlot {
  readonly teamId: string | null;
  readonly seed: number | null;
  readonly placeholder: string | null;
}

export interface PlayoffPreviewSeries {
  readonly id: string;
  readonly round: PlayoffRound;
  readonly bestOf: 5 | 7;
  readonly home: PlayoffPreviewTeamSlot;
  readonly away: PlayoffPreviewTeamSlot;
}

function slotFromSeed(seed: PlayoffSeed | undefined): PlayoffPreviewTeamSlot {
  return {
    teamId: seed?.teamId ?? null,
    seed: seed?.seed ?? null,
    placeholder: null,
  };
}

function placeholderSlot(placeholder: string): PlayoffPreviewTeamSlot {
  return {
    teamId: null,
    seed: null,
    placeholder,
  };
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Determine playoff seeds from league standings.
 * 12 teams: 6 division winners + 6 wild cards (3 per league).
 */
export function determinePlayoffSeeds(
  standings: Record<string, StandingsEntry[]>,
): PlayoffSeed[] {
  const seeds: PlayoffSeed[] = [];
  const divisionWinners: StandingsEntry[] = [];
  const wildCardPool: StandingsEntry[] = [];

  for (const [, divStandings] of Object.entries(standings)) {
    if (divStandings.length === 0) continue;
    divisionWinners.push(divStandings[0]!);
    for (let i = 1; i < divStandings.length; i++) {
      wildCardPool.push(divStandings[i]!);
    }
  }

  // Sort division winners by record
  divisionWinners.sort((a, b) => b.pct - a.pct);

  // Top 3 AL + top 3 NL division winners get seeds 1-3 in each league
  // For simplicity, seed all division winners then top wild cards
  let seedNum = 1;
  for (const dw of divisionWinners) {
    seeds.push({ teamId: dw.teamId, seed: seedNum++, wins: dw.wins, losses: dw.losses });
  }

  // Wild cards: top 6 non-division-winners by record
  wildCardPool.sort((a, b) => b.pct - a.pct);
  for (let i = 0; i < Math.min(6, wildCardPool.length); i++) {
    const wc = wildCardPool[i]!;
    seeds.push({ teamId: wc.teamId, seed: seedNum++, wins: wc.wins, losses: wc.losses });
  }

  return seeds;
}

export function buildPlayoffPreview(seeds: PlayoffSeed[]): PlayoffPreviewSeries[] {
  if (seeds.length < 8) {
    return [];
  }

  return [
    {
      id: 'wc-1',
      round: 'WILD_CARD',
      bestOf: 5,
      home: slotFromSeed(seeds[4]),
      away: slotFromSeed(seeds[11] ?? seeds[seeds.length - 1]),
    },
    {
      id: 'wc-2',
      round: 'WILD_CARD',
      bestOf: 5,
      home: slotFromSeed(seeds[5]),
      away: slotFromSeed(seeds[10] ?? seeds[seeds.length - 1]),
    },
    {
      id: 'wc-3',
      round: 'WILD_CARD',
      bestOf: 5,
      home: slotFromSeed(seeds[6]),
      away: slotFromSeed(seeds[9] ?? seeds[seeds.length - 1]),
    },
    {
      id: 'wc-4',
      round: 'WILD_CARD',
      bestOf: 5,
      home: slotFromSeed(seeds[7]),
      away: slotFromSeed(seeds[8]),
    },
    {
      id: 'ds-1',
      round: 'DIVISION_SERIES',
      bestOf: 5,
      home: slotFromSeed(seeds[0]),
      away: placeholderSlot('Winner of 8 vs 9'),
    },
    {
      id: 'ds-2',
      round: 'DIVISION_SERIES',
      bestOf: 5,
      home: slotFromSeed(seeds[1]),
      away: placeholderSlot('Winner of 7 vs 10'),
    },
    {
      id: 'ds-3',
      round: 'DIVISION_SERIES',
      bestOf: 5,
      home: slotFromSeed(seeds[2]),
      away: placeholderSlot('Winner of 6 vs 11'),
    },
    {
      id: 'ds-4',
      round: 'DIVISION_SERIES',
      bestOf: 5,
      home: slotFromSeed(seeds[3]),
      away: placeholderSlot('Winner of 5 vs 12'),
    },
    {
      id: 'cs-1',
      round: 'CHAMPIONSHIP_SERIES',
      bestOf: 7,
      home: placeholderSlot('Winner of DS 1'),
      away: placeholderSlot('Winner of DS 2'),
    },
    {
      id: 'cs-2',
      round: 'CHAMPIONSHIP_SERIES',
      bestOf: 7,
      home: placeholderSlot('Winner of DS 3'),
      away: placeholderSlot('Winner of DS 4'),
    },
    {
      id: 'ws-1',
      round: 'WORLD_SERIES',
      bestOf: 7,
      home: placeholderSlot('Winner of CS 1'),
      away: placeholderSlot('Winner of CS 2'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Series simulation
// ---------------------------------------------------------------------------

function buildGameTeam(teamId: string, allPlayers: GeneratedPlayer[]): GameTeam {
  const mlbPlayers = allPlayers.filter(p => p.teamId === teamId && p.rosterStatus === 'MLB');
  const hitters = mlbPlayers
    .filter(p => (HITTER_POSITIONS as readonly string[]).includes(p.position))
    .sort((a, b) => b.overallRating - a.overallRating);
  const pitchers = mlbPlayers
    .filter(p => (PITCHER_POSITIONS as readonly string[]).includes(p.position))
    .sort((a, b) => b.overallRating - a.overallRating);

  const lineup = hitters.slice(0, 9);
  while (lineup.length < 9 && lineup.length > 0) {
    lineup.push(lineup[0]!);
  }

  const starter = pitchers.find(p => p.position === 'SP') ?? pitchers[0] ?? lineup[0]!;
  const bullpen = pitchers.filter(p => p !== starter);

  return { teamId, lineup, pitcher: starter, bullpen };
}

/**
 * Simulate a best-of-N series between two teams.
 */
export function simulateSeries(
  rng: GameRNG,
  team1Id: string,
  team2Id: string,
  bestOf: 5 | 7,
  round: PlayoffRound,
  allPlayers: GeneratedPlayer[],
): SeriesResult {
  const winsNeeded = Math.ceil(bestOf / 2);
  let team1Wins = 0;
  let team2Wins = 0;
  const games: GameBoxScore[] = [];

  // Home advantage: higher seed (team1) gets home in games 1,2,5,7
  const homePattern = bestOf === 7
    ? [1, 1, 2, 2, 1, 2, 1] // HHAAAHA
    : [1, 1, 2, 2, 1];       // HHAAH

  let gameNum = 0;
  while (team1Wins < winsNeeded && team2Wins < winsNeeded) {
    const homeTeamId = (homePattern[gameNum % homePattern.length] === 1) ? team1Id : team2Id;
    const awayTeamId = homeTeamId === team1Id ? team2Id : team1Id;

    const gameRng = rng.fork();
    const home = buildGameTeam(homeTeamId, allPlayers);
    const away = buildGameTeam(awayTeamId, allPlayers);

    if (home.lineup.length < 9 || away.lineup.length < 9) {
      // Can't play — team with more wins advances
      break;
    }

    const { boxScore } = simulateGame(gameRng, away, home, `PO-G${gameNum + 1}`, true);
    games.push(boxScore);

    if (boxScore.homeScore > boxScore.awayScore) {
      if (homeTeamId === team1Id) team1Wins++;
      else team2Wins++;
    } else {
      if (awayTeamId === team1Id) team1Wins++;
      else team2Wins++;
    }

    gameNum++;
  }

  const winnerId = team1Wins >= winsNeeded ? team1Id : team2Id;
  const loserId = winnerId === team1Id ? team2Id : team1Id;

  return {
    winnerId,
    loserId,
    winnerWins: Math.max(team1Wins, team2Wins),
    loserWins: Math.min(team1Wins, team2Wins),
    games,
    round,
  };
}

// ---------------------------------------------------------------------------
// Full playoff bracket
// ---------------------------------------------------------------------------

/**
 * Run the entire playoff bracket from seeds to championship.
 *
 * Bracket structure (12 teams):
 * - Wild Card Round: Seeds 5-12 play (4 series, best-of-3 simplified to best-of-5 for fun)
 * - Division Series: Seeds 1-4 vs WC winners (best-of-5)
 * - Championship Series: 2 series (best-of-7)
 * - World Series: best-of-7
 */
export function simulatePlayoffs(
  rng: GameRNG,
  seeds: PlayoffSeed[],
  allPlayers: GeneratedPlayer[],
): PlayoffBracket {
  const series: SeriesResult[] = [];

  if (seeds.length < 8) {
    return { seeds, series, champion: seeds[0]?.teamId ?? null };
  }

  // Wild Card Round: 5v12, 6v11, 7v10, 8v9
  const wcMatchups = [
    [seeds[4]!, seeds[11] ?? seeds[seeds.length - 1]!],
    [seeds[5]!, seeds[10] ?? seeds[seeds.length - 1]!],
    [seeds[6]!, seeds[9] ?? seeds[seeds.length - 1]!],
    [seeds[7]!, seeds[8] ?? seeds[seeds.length - 1]!],
  ];

  const wcWinners: string[] = [];
  for (const [higher, lower] of wcMatchups) {
    if (!higher || !lower) continue;
    const result = simulateSeries(rng, higher.teamId, lower.teamId, 5, 'WILD_CARD', allPlayers);
    series.push(result);
    wcWinners.push(result.winnerId);
  }

  // Division Series: 1 vs lowest WC, 2 vs next, 3 vs next, 4 vs next
  const dsMatchups = [
    [seeds[0]!.teamId, wcWinners[3] ?? wcWinners[0]!],
    [seeds[1]!.teamId, wcWinners[2] ?? wcWinners[0]!],
    [seeds[2]!.teamId, wcWinners[1] ?? wcWinners[0]!],
    [seeds[3]!.teamId, wcWinners[0]!],
  ];

  const dsWinners: string[] = [];
  for (const [higher, lower] of dsMatchups) {
    if (!higher || !lower) continue;
    const result = simulateSeries(rng, higher, lower, 5, 'DIVISION_SERIES', allPlayers);
    series.push(result);
    dsWinners.push(result.winnerId);
  }

  // Championship Series
  const csMatchups = [
    [dsWinners[0]!, dsWinners[1]!],
    [dsWinners[2]!, dsWinners[3]!],
  ];

  const csWinners: string[] = [];
  for (const [t1, t2] of csMatchups) {
    if (!t1 || !t2) continue;
    const result = simulateSeries(rng, t1, t2, 7, 'CHAMPIONSHIP_SERIES', allPlayers);
    series.push(result);
    csWinners.push(result.winnerId);
  }

  // World Series
  let champion: string | null = null;
  if (csWinners.length >= 2) {
    const wsResult = simulateSeries(rng, csWinners[0]!, csWinners[1]!, 7, 'WORLD_SERIES', allPlayers);
    series.push(wsResult);
    champion = wsResult.winnerId;
  } else if (csWinners.length === 1) {
    champion = csWinners[0]!;
  }

  return { seeds, series, champion };
}
