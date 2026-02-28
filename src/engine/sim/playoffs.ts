/**
 * Playoff Bracket Engine — Mr. Baseball Dynasty
 *
 * Modern 12-team format (6 per league):
 *   • 3 division winners + 3 wild cards per league
 *   • Wild Card Round: #3 vs #6, #4 vs #5 (best of 3)
 *   • Division Series:  #1 vs WC(4/5 winner), #2 vs WC(3/6 winner) (best of 5)
 *   • Championship Series: ALDS/NLDS winners meet (best of 7)
 *   • World Series: AL champ vs NL champ (best of 7)
 *
 * Uses the same game simulation engine as the regular season.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import type { StandingsRow } from '../../types/league';
import { simulateGame, type SimulateGameInput } from './gameSimulator';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PlayoffSeed {
  teamId:       number;
  seed:         number;    // 1–6 within league
  abbreviation: string;
  name:         string;
  league:       string;
  wins:         number;
  losses:       number;
  isDivWinner:  boolean;
}

export interface SeriesResult {
  round:      PlayoffRound;
  higherSeed: PlayoffSeed;
  lowerSeed:  PlayoffSeed;
  homeWins:   number;      // wins by higher seed
  awayWins:   number;      // wins by lower seed
  winner:     PlayoffSeed;
  loser:      PlayoffSeed;
  bestOf:     number;
  gameScores: Array<{ homeScore: number; awayScore: number; homeTeamId: number; awayTeamId: number }>;
}

export type PlayoffRound = 'WC' | 'DS' | 'CS' | 'WS';

export interface PlayoffBracket {
  season:       number;
  alSeeds:      PlayoffSeed[];   // 6 seeds
  nlSeeds:      PlayoffSeed[];   // 6 seeds
  // Round results (filled as bracket advances)
  wildCard:     SeriesResult[];  // 4 series (2 AL, 2 NL)
  divSeries:    SeriesResult[];  // 4 series (2 AL, 2 NL)
  champSeries:  SeriesResult[];  // 2 series (AL, NL)
  worldSeries:  SeriesResult | null;
  champion:     PlayoffSeed | null;
}

// ─── Determine playoff field from standings ─────────────────────────────────────

export function determinePlayoffField(standings: StandingsRow[]): {
  alSeeds: PlayoffSeed[];
  nlSeeds: PlayoffSeed[];
} {
  const leagueSeeds = (league: string): PlayoffSeed[] => {
    const teams = standings.filter(s => s.league === league);
    const divisions = ['East', 'Central', 'West'];

    // Division winners: best record in each division
    const divWinners: StandingsRow[] = [];
    for (const div of divisions) {
      const divTeams = teams.filter(t => t.division === div);
      divTeams.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      if (divTeams.length > 0) divWinners.push(divTeams[0]!);
    }

    // Sort div winners by record for seeding (#1, #2, #3)
    divWinners.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    // Wild card teams: best 3 non-division winners
    const divWinnerIds = new Set(divWinners.map(t => t.teamId));
    const wildCardPool = teams
      .filter(t => !divWinnerIds.has(t.teamId))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const wildCards = wildCardPool.slice(0, 3);

    const seeds: PlayoffSeed[] = [];

    // Seeds 1-3: division winners sorted by record
    for (let i = 0; i < divWinners.length; i++) {
      const t = divWinners[i]!;
      seeds.push({
        teamId: t.teamId,
        seed: i + 1,
        abbreviation: t.abbreviation,
        name: t.name,
        league: t.league,
        wins: t.wins,
        losses: t.losses,
        isDivWinner: true,
      });
    }

    // Seeds 4-6: wild cards sorted by record
    for (let i = 0; i < wildCards.length; i++) {
      const t = wildCards[i]!;
      seeds.push({
        teamId: t.teamId,
        seed: i + 4,
        abbreviation: t.abbreviation,
        name: t.name,
        league: t.league,
        wins: t.wins,
        losses: t.losses,
        isDivWinner: false,
      });
    }

    return seeds;
  };

  return {
    alSeeds: leagueSeeds('AL'),
    nlSeeds: leagueSeeds('NL'),
  };
}

// ─── Simulate a single playoff series ───────────────────────────────────────────

function simulatePlayoffSeries(
  higherSeed: PlayoffSeed,
  lowerSeed: PlayoffSeed,
  round: PlayoffRound,
  bestOf: number,
  teams: Team[],
  players: Player[],
  baseSeed: number,
): SeriesResult {
  const winsNeeded = Math.ceil(bestOf / 2);
  let homeWins = 0;
  let awayWins = 0;
  const gameScores: SeriesResult['gameScores'] = [];

  // Home-field advantage pattern:
  // Best of 3: H-A-H
  // Best of 5: H-H-A-A-H
  // Best of 7: H-H-A-A-A-H-H
  const homePattern3 = [true, false, true];
  const homePattern5 = [true, true, false, false, true];
  const homePattern7 = [true, true, false, false, false, true, true];
  const pattern = bestOf === 3 ? homePattern3 : bestOf === 5 ? homePattern5 : homePattern7;

  const homeTeam = teams.find(t => t.teamId === higherSeed.teamId)!;
  const awayTeam = teams.find(t => t.teamId === lowerSeed.teamId)!;

  let gameNum = 0;
  while (homeWins < winsNeeded && awayWins < winsNeeded) {
    const isHigherHome = pattern[gameNum % pattern.length]!;
    const gameSeed = (baseSeed ^ ((gameNum + 1) * 2654435761)) >>> 0;

    const actualHome = isHigherHome ? homeTeam : awayTeam;
    const actualAway = isHigherHome ? awayTeam : homeTeam;

    const input: SimulateGameInput = {
      gameId: 10000 + gameNum,
      season: 0,
      date: `playoff-${round}-G${gameNum + 1}`,
      homeTeam: { ...actualHome, rotationIndex: gameNum, bullpenReliefCounter: gameNum * 3 },
      awayTeam: { ...actualAway, rotationIndex: gameNum, bullpenReliefCounter: gameNum * 3 },
      players,
      seed: gameSeed,
    };

    const result = simulateGame(input);

    const higherScored = isHigherHome ? result.homeScore : result.awayScore;
    const lowerScored  = isHigherHome ? result.awayScore : result.homeScore;

    if (higherScored > lowerScored) {
      homeWins++;
    } else {
      awayWins++;
    }

    gameScores.push({
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      homeTeamId: actualHome.teamId,
      awayTeamId: actualAway.teamId,
    });

    gameNum++;
  }

  const winner = homeWins >= winsNeeded ? higherSeed : lowerSeed;
  const loser  = homeWins >= winsNeeded ? lowerSeed : higherSeed;

  return { round, higherSeed, lowerSeed, homeWins, awayWins, winner, loser, bestOf, gameScores };
}

// ─── Run the full playoff bracket ───────────────────────────────────────────────

export function simulatePlayoffs(
  standings: StandingsRow[],
  teams: Team[],
  players: Player[],
  season: number,
  baseSeed: number,
): PlayoffBracket {
  const { alSeeds, nlSeeds } = determinePlayoffField(standings);

  const bracket: PlayoffBracket = {
    season,
    alSeeds,
    nlSeeds,
    wildCard: [],
    divSeries: [],
    champSeries: [],
    worldSeries: null,
    champion: null,
  };

  const runLeaguePlayoffs = (seeds: PlayoffSeed[], leagueSeedOffset: number) => {
    // ── Wild Card Round (best of 3) ────────────────────────────────────────
    // #3 vs #6, #4 vs #5
    const wc1 = simulatePlayoffSeries(
      seeds[2]!, seeds[5]!, 'WC', 3, teams, players,
      (baseSeed ^ ((leagueSeedOffset + 100) * 48271)) >>> 0,
    );
    const wc2 = simulatePlayoffSeries(
      seeds[3]!, seeds[4]!, 'WC', 3, teams, players,
      (baseSeed ^ ((leagueSeedOffset + 200) * 48271)) >>> 0,
    );
    bracket.wildCard.push(wc1, wc2);

    // ── Division Series (best of 5) ────────────────────────────────────────
    // #1 vs WC(4/5 winner), #2 vs WC(3/6 winner)
    const ds1 = simulatePlayoffSeries(
      seeds[0]!, wc2.winner, 'DS', 5, teams, players,
      (baseSeed ^ ((leagueSeedOffset + 300) * 48271)) >>> 0,
    );
    const ds2 = simulatePlayoffSeries(
      seeds[1]!, wc1.winner, 'DS', 5, teams, players,
      (baseSeed ^ ((leagueSeedOffset + 400) * 48271)) >>> 0,
    );
    bracket.divSeries.push(ds1, ds2);

    // ── Championship Series (best of 7) ────────────────────────────────────
    const cs = simulatePlayoffSeries(
      ds1.winner, ds2.winner, 'CS', 7, teams, players,
      (baseSeed ^ ((leagueSeedOffset + 500) * 48271)) >>> 0,
    );
    bracket.champSeries.push(cs);

    return cs.winner;
  };

  // Run AL and NL brackets
  const alChamp = runLeaguePlayoffs(alSeeds, 1);
  const nlChamp = runLeaguePlayoffs(nlSeeds, 2);

  // ── World Series (best of 7) ─────────────────────────────────────────────
  // Higher seed by regular season wins gets home-field advantage
  const wsHigher = alChamp.wins >= nlChamp.wins ? alChamp : nlChamp;
  const wsLower  = alChamp.wins >= nlChamp.wins ? nlChamp : alChamp;

  const ws = simulatePlayoffSeries(
    wsHigher, wsLower, 'WS', 7, teams, players,
    (baseSeed ^ (7777 * 48271)) >>> 0,
  );
  bracket.worldSeries = ws;
  bracket.champion = ws.winner;

  return bracket;
}

// ─── Assign playoff results back to TeamSeasonStats ─────────────────────────────

export function getPlayoffResults(bracket: PlayoffBracket): Map<number, 'WC' | 'DS' | 'CS' | 'WS' | 'Champion'> {
  const results = new Map<number, 'WC' | 'DS' | 'CS' | 'WS' | 'Champion'>();

  // All 12 playoff teams at minimum got a WC berth (though div winners skip WC play)
  for (const seed of [...bracket.alSeeds, ...bracket.nlSeeds]) {
    results.set(seed.teamId, 'WC');
  }

  // Wild card losers stay at 'WC'
  // Division series participants made it at least to DS
  for (const ds of bracket.divSeries) {
    results.set(ds.higherSeed.teamId, 'DS');
    results.set(ds.lowerSeed.teamId, 'DS');
  }

  // Championship series participants
  for (const cs of bracket.champSeries) {
    results.set(cs.higherSeed.teamId, 'CS');
    results.set(cs.lowerSeed.teamId, 'CS');
  }

  // World Series participants
  if (bracket.worldSeries) {
    results.set(bracket.worldSeries.higherSeed.teamId, 'WS');
    results.set(bracket.worldSeries.lowerSeed.teamId, 'WS');
  }

  // Champion
  if (bracket.champion) {
    results.set(bracket.champion.teamId, 'Champion');
  }

  return results;
}
