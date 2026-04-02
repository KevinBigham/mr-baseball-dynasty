import { describe, expect, it } from 'vitest';
import {
  GameRNG,
  generateLeaguePlayers,
  initializePlayoffBracket,
  buildPlayoffPreview,
  simPlayoffGame,
  advancePlayoffRound,
  isPlayoffComplete,
  type PlayoffBracket,
  type StandingsEntry,
} from '../src/index.js';

function entry(teamId: string, wins: number, losses: number): StandingsEntry {
  return {
    teamId,
    wins,
    losses,
    pct: wins / (wins + losses),
    gamesBack: 0,
    runsScored: wins * 6,
    runsAllowed: losses * 5,
    runDifferential: wins - losses,
    streak: 'W2',
    last10Wins: 7,
    last10Losses: 3,
  };
}

function standingsFixture(): Record<string, StandingsEntry[]> {
  return {
    AL_EAST: [
      entry('nyy', 101, 61),
      entry('bal', 95, 67),
      entry('bos', 89, 73),
      entry('tb', 84, 78),
      entry('tor', 78, 84),
    ],
    AL_CENTRAL: [
      entry('cle', 96, 66),
      entry('det', 90, 72),
      entry('min', 88, 74),
      entry('kc', 80, 82),
      entry('cws', 72, 90),
    ],
    AL_WEST: [
      entry('hou', 98, 64),
      entry('sea', 93, 69),
      entry('tex', 87, 75),
      entry('por', 83, 79),
      entry('laa', 76, 86),
      entry('oak', 70, 92),
    ],
    NL_EAST: [
      entry('atl', 102, 60),
      entry('phi', 98, 64),
      entry('nym', 86, 76),
      entry('mtl', 82, 80),
      entry('mia', 74, 88),
      entry('wsh', 68, 94),
    ],
    NL_CENTRAL: [
      entry('mil', 97, 65),
      entry('chc', 91, 71),
      entry('cin', 85, 77),
      entry('stl', 79, 83),
      entry('pit', 71, 91),
    ],
    NL_WEST: [
      entry('lad', 100, 62),
      entry('sd', 94, 68),
      entry('ari', 89, 73),
      entry('sf', 81, 81),
      entry('col', 66, 96),
    ],
  };
}

function winnersById(bracket: PlayoffBracket): string[] {
  return bracket.series.map((series) => series.winnerId);
}

describe('playoff bracket state', () => {
  it('builds league-local wild card matchups and later-round placeholders', () => {
    const bracket = initializePlayoffBracket(standingsFixture(), new GameRNG(17));
    const preview = buildPlayoffPreview(bracket.seeds);

    expect(bracket.currentRound).toBe('WILD_CARD');
    expect(bracket.currentRoundSeries).toHaveLength(4);

    expect(bracket.currentRoundSeries.map((series) => ({
      id: series.id,
      round: series.round,
      league: series.league,
      bestOf: series.bestOf,
      high: `${series.higherSeed.seed}-${series.higherSeed.teamId}`,
      low: `${series.lowerSeed.seed}-${series.lowerSeed.teamId}`,
    }))).toEqual([
      { id: 'AL-WC-1', round: 'WILD_CARD', league: 'AL', bestOf: 3, high: '3-cle', low: '6-det' },
      { id: 'AL-WC-2', round: 'WILD_CARD', league: 'AL', bestOf: 3, high: '4-bal', low: '5-sea' },
      { id: 'NL-WC-1', round: 'WILD_CARD', league: 'NL', bestOf: 3, high: '3-mil', low: '6-chc' },
      { id: 'NL-WC-2', round: 'WILD_CARD', league: 'NL', bestOf: 3, high: '4-phi', low: '5-sd' },
    ]);

    expect(preview.map((series) => ({
      id: series.id,
      round: series.round,
      bestOf: series.bestOf,
      homeSeed: series.home.seed,
      awaySeed: series.away.seed,
      homePlaceholder: series.home.placeholder,
      awayPlaceholder: series.away.placeholder,
    }))).toEqual([
      { id: 'AL-WC-1', round: 'WILD_CARD', bestOf: 3, homeSeed: 3, awaySeed: 6, homePlaceholder: null, awayPlaceholder: null },
      { id: 'AL-WC-2', round: 'WILD_CARD', bestOf: 3, homeSeed: 4, awaySeed: 5, homePlaceholder: null, awayPlaceholder: null },
      { id: 'AL-DS-1', round: 'DIVISION_SERIES', bestOf: 5, homeSeed: 1, awaySeed: null, homePlaceholder: null, awayPlaceholder: 'Lowest remaining AL wild card' },
      { id: 'AL-DS-2', round: 'DIVISION_SERIES', bestOf: 5, homeSeed: 2, awaySeed: null, homePlaceholder: null, awayPlaceholder: 'Highest remaining AL wild card' },
      { id: 'AL-CS-1', round: 'CHAMPIONSHIP_SERIES', bestOf: 7, homeSeed: null, awaySeed: null, homePlaceholder: 'Winner of AL DS 1', awayPlaceholder: 'Winner of AL DS 2' },
      { id: 'NL-WC-1', round: 'WILD_CARD', bestOf: 3, homeSeed: 3, awaySeed: 6, homePlaceholder: null, awayPlaceholder: null },
      { id: 'NL-WC-2', round: 'WILD_CARD', bestOf: 3, homeSeed: 4, awaySeed: 5, homePlaceholder: null, awayPlaceholder: null },
      { id: 'NL-DS-1', round: 'DIVISION_SERIES', bestOf: 5, homeSeed: 1, awaySeed: null, homePlaceholder: null, awayPlaceholder: 'Lowest remaining NL wild card' },
      { id: 'NL-DS-2', round: 'DIVISION_SERIES', bestOf: 5, homeSeed: 2, awaySeed: null, homePlaceholder: null, awayPlaceholder: 'Highest remaining NL wild card' },
      { id: 'NL-CS-1', round: 'CHAMPIONSHIP_SERIES', bestOf: 7, homeSeed: null, awaySeed: null, homePlaceholder: 'Winner of NL DS 1', awayPlaceholder: 'Winner of NL DS 2' },
      { id: 'WS-1', round: 'WORLD_SERIES', bestOf: 7, homeSeed: null, awaySeed: null, homePlaceholder: 'AL Champion', awayPlaceholder: 'NL Champion' },
    ]);
  });

  it('sims one playoff game with key performers and updates series score', () => {
    const rng = new GameRNG(23);
    const players = generateLeaguePlayers(rng.fork(), [
      'nyy', 'bal', 'bos', 'tb', 'tor',
      'cle', 'det', 'min', 'kc', 'cws',
      'hou', 'sea', 'tex', 'por', 'laa', 'oak',
      'atl', 'phi', 'nym', 'mtl', 'mia', 'wsh',
      'mil', 'chc', 'cin', 'stl', 'pit',
      'lad', 'sd', 'ari', 'sf', 'col',
    ]);
    const bracket = initializePlayoffBracket(standingsFixture(), rng.fork());

    const updatedSeries = simPlayoffGame(bracket.currentRoundSeries[0]!, players, rng.fork());

    expect(updatedSeries.games).toHaveLength(1);
    expect(updatedSeries.games[0]?.gameNumber).toBe(1);
    expect(updatedSeries.games[0]?.keyPerformers.length).toBeGreaterThan(0);
    expect(updatedSeries.higherSeedWins + updatedSeries.lowerSeedWins).toBe(1);
    expect(updatedSeries.leaderSummary).toMatch(/leads 1-0|won 1-0|Series tied 0-0/);
    expect(updatedSeries.status).toBe('in_progress');
  });

  it('advances rounds, preserves completed-series history, and finishes the bracket', () => {
    const rng = new GameRNG(31);
    const players = generateLeaguePlayers(rng.fork(), [
      'nyy', 'bal', 'bos', 'tb', 'tor',
      'cle', 'det', 'min', 'kc', 'cws',
      'hou', 'sea', 'tex', 'por', 'laa', 'oak',
      'atl', 'phi', 'nym', 'mtl', 'mia', 'wsh',
      'mil', 'chc', 'cin', 'stl', 'pit',
      'lad', 'sd', 'ari', 'sf', 'col',
    ]);
    let bracket = initializePlayoffBracket(standingsFixture(), rng.fork());

    while (!isPlayoffComplete(bracket)) {
      bracket = advancePlayoffRound(bracket, players, rng.fork());
    }

    expect(isPlayoffComplete(bracket)).toBe(true);
    expect(bracket.champion).toBeTruthy();
    expect(bracket.completedRounds.map((round) => round.round)).toEqual([
      'WILD_CARD',
      'DIVISION_SERIES',
      'CHAMPIONSHIP_SERIES',
      'WORLD_SERIES',
    ]);
    expect(bracket.series).toHaveLength(11);
    expect(winnersById(bracket)).toContain(bracket.champion!);
  });
});
