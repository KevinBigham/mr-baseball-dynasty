/**
 * v0.1 Validation Gates
 *
 * ALL gates must pass before v0.1 is considered shippable.
 * Run: npx vitest run tests/validation/gates.test.ts
 *
 * Simulates 3 seasons with different seeds and validates:
 *   - League-average stats in realistic MLB ranges
 *   - Distribution shape (team win SD)
 *   - Tail frequencies (40+ HR, 200+ K, 200+ IP)
 *   - Pythagorean correlation ≥ 0.85
 *   - Determinism: same seed → same result
 *   - Performance: single game ≤ 50ms, full season ≤ 5000ms
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createPRNG } from '../../src/engine/math/prng';
import { generateLeaguePlayers } from '../../src/engine/player/generation';
import { buildInitialTeams } from '../../src/data/teams';
import { generateScheduleTemplate } from '../../src/data/scheduleTemplate';
import { simulateSeason } from '../../src/engine/sim/seasonSimulator';
import { simulateGame } from '../../src/engine/sim/gameSimulator';
import { pearsonCorrelation } from '../../src/utils/helpers';
import { GATES } from '../../src/utils/constants';
import type { Player } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import type { SeasonResult } from '../../src/types/league';

// ─── Setup: simulate 3 seasons ───────────────────────────────────────────────

const SEEDS = [42, 137, 9001];
const seasonResults: SeasonResult[] = [];
let sharedTeams: Team[];
let sharedPlayers: Player[];

beforeAll(async () => {
  sharedTeams = buildInitialTeams();
  const [players] = generateLeaguePlayers(createPRNG(42), sharedTeams, 2026);
  sharedPlayers = players;
  const schedule = generateScheduleTemplate();

  for (const seed of SEEDS) {
    const result = await simulateSeason(sharedTeams, sharedPlayers, schedule, seed);
    seasonResults.push(result);
  }
}, 90_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgOf(fn: (r: SeasonResult) => number): number {
  return seasonResults.reduce((sum, r) => sum + fn(r), 0) / seasonResults.length;
}

// ─── Gate 1: League ERA ───────────────────────────────────────────────────────

describe('Gate 1 — League ERA', () => {
  it(`falls between ${GATES.leagueERA.min} and ${GATES.leagueERA.max}`, () => {
    const era = avgOf(r => r.leagueERA);
    expect(era).toBeGreaterThanOrEqual(GATES.leagueERA.min);
    expect(era).toBeLessThanOrEqual(GATES.leagueERA.max);
  });
});

// ─── Gate 2: League BA ────────────────────────────────────────────────────────

describe('Gate 2 — League Batting Average', () => {
  it(`falls between ${GATES.leagueBA.min} and ${GATES.leagueBA.max}`, () => {
    const ba = avgOf(r => r.leagueBA);
    expect(ba).toBeGreaterThanOrEqual(GATES.leagueBA.min);
    expect(ba).toBeLessThanOrEqual(GATES.leagueBA.max);
  });
});

// ─── Gate 3: League R/G ───────────────────────────────────────────────────────

describe('Gate 3 — League Runs Per Game', () => {
  it(`falls between ${GATES.leagueRPG.min} and ${GATES.leagueRPG.max}`, () => {
    const rpg = avgOf(r => r.leagueRPG);
    expect(rpg).toBeGreaterThanOrEqual(GATES.leagueRPG.min);
    expect(rpg).toBeLessThanOrEqual(GATES.leagueRPG.max);
  });
});

// ─── Gate 4: Team Win SD ─────────────────────────────────────────────────────

describe('Gate 4 — Team Win Distribution (SD)', () => {
  it(`std dev of team wins is between ${GATES.teamWinsSD.min} and ${GATES.teamWinsSD.max}`, () => {
    const sd = avgOf(r => r.teamWinsSD);
    expect(sd).toBeGreaterThanOrEqual(GATES.teamWinsSD.min);
    expect(sd).toBeLessThanOrEqual(GATES.teamWinsSD.max);
  });
});

// ─── Gate 5: Teams over 100 wins ─────────────────────────────────────────────

describe('Gate 5 — Teams over 100 Wins', () => {
  it(`${GATES.teamsOver100Wins.min}–${GATES.teamsOver100Wins.max} per season on average`, () => {
    const avg = avgOf(r => r.teamSeasons.filter(ts => ts.record.wins >= 100).length);
    expect(avg).toBeGreaterThanOrEqual(GATES.teamsOver100Wins.min);
    expect(avg).toBeLessThanOrEqual(GATES.teamsOver100Wins.max);
  });
});

// ─── Gate 6: Teams under 60 wins ─────────────────────────────────────────────

describe('Gate 6 — Teams under 60 Wins', () => {
  it(`${GATES.teamsUnder60Wins.min}–${GATES.teamsUnder60Wins.max} per season on average`, () => {
    const avg = avgOf(r => r.teamSeasons.filter(ts => ts.record.wins < 60).length);
    expect(avg).toBeGreaterThanOrEqual(GATES.teamsUnder60Wins.min);
    expect(avg).toBeLessThanOrEqual(GATES.teamsUnder60Wins.max);
  });
});

// ─── Gate 7: 40+ HR hitters ──────────────────────────────────────────────────

describe('Gate 7 — 40 HR Club', () => {
  it(`${GATES.playersWith40HR.min}–${GATES.playersWith40HR.max} players hit 40+ HR per season`, () => {
    // Hitters have ab > 0 and outs === 0
    const avg = avgOf(r => r.playerSeasons.filter(ps => ps.ab > 0 && ps.hr >= 40).length);
    expect(avg).toBeGreaterThanOrEqual(GATES.playersWith40HR.min);
    expect(avg).toBeLessThanOrEqual(GATES.playersWith40HR.max);
  });
});

// ─── Gate 8: 200+ K pitchers ─────────────────────────────────────────────────

describe('Gate 8 — 200 K Pitchers', () => {
  it(`${GATES.playersWith200K.min}–${GATES.playersWith200K.max} pitchers strike out 200+ per season`, () => {
    // Pitchers have outs > 0; ka = strikeouts recorded as pitcher
    const avg = avgOf(r => r.playerSeasons.filter(ps => ps.outs > 0 && ps.ka >= 200).length);
    expect(avg).toBeGreaterThanOrEqual(GATES.playersWith200K.min);
    expect(avg).toBeLessThanOrEqual(GATES.playersWith200K.max);
  });
});

// ─── Gate 9: 200+ IP pitchers ────────────────────────────────────────────────

describe('Gate 9 — 200 IP Workhorses', () => {
  it(`${GATES.pitchersWith200IP.min}–${GATES.pitchersWith200IP.max} starters throw 200+ IP per season`, () => {
    const avg = avgOf(r => r.playerSeasons.filter(ps => ps.outs >= 600).length); // 200 IP = 600 outs
    expect(avg).toBeGreaterThanOrEqual(GATES.pitchersWith200IP.min);
    expect(avg).toBeLessThanOrEqual(GATES.pitchersWith200IP.max);
  });
});

// ─── Gate 10: Pythagorean Correlation ────────────────────────────────────────

describe('Gate 10 — Pythagorean Win% Correlation', () => {
  it(`correlation between pythag W% and actual W% ≥ ${GATES.pythagCorrelation.min}`, () => {
    const actualWPcts: number[] = [];
    const pythagWPcts: number[] = [];

    for (const r of seasonResults) {
      for (const ts of r.teamSeasons) {
        const { wins, losses, runsScored, runsAllowed } = ts.record;
        const games = wins + losses;
        if (games === 0) continue;

        actualWPcts.push(wins / games);
        const pythag = runsAllowed === 0
          ? 1
          : Math.pow(runsScored, 1.83) / (Math.pow(runsScored, 1.83) + Math.pow(runsAllowed, 1.83));
        pythagWPcts.push(pythag);
      }
    }

    const corr = pearsonCorrelation(pythagWPcts, actualWPcts);
    expect(corr).toBeGreaterThanOrEqual(GATES.pythagCorrelation.min);
  });
});

// ─── Gate 11: Determinism ─────────────────────────────────────────────────────

describe('Gate 11 — Determinism', () => {
  it('same seed produces identical season results', async () => {
    const t = buildInitialTeams();
    const [p] = generateLeaguePlayers(createPRNG(42), t, 2026);
    const schedule = generateScheduleTemplate();

    const r1 = await simulateSeason(t, p, schedule, 99);
    const r2 = await simulateSeason(t, p, schedule, 99);

    const wins1 = r1.teamSeasons.map(ts => ts.record.wins).join(',');
    const wins2 = r2.teamSeasons.map(ts => ts.record.wins).join(',');
    expect(wins1).toBe(wins2);
  }, 30_000);
});

// ─── Gate 12: Single Game Performance ────────────────────────────────────────

describe('Gate 12 — Single Game Performance', () => {
  it(`simulates one game in ≤ ${GATES.singleGameMs.max}ms`, () => {
    const start = performance.now();
    simulateGame({
      gameId: 1,
      season: 2026,
      date: '2026-04-01',
      homeTeam: sharedTeams[0],
      awayTeam: sharedTeams[1],
      players: sharedPlayers,
      seed: 42,
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThanOrEqual(GATES.singleGameMs.max);
  });
});

// ─── Gate 13: Full Season Performance ────────────────────────────────────────

describe('Gate 13 — Full Season Performance', () => {
  it(`simulates 162-game season in ≤ ${GATES.fullSeasonMs.max}ms`, async () => {
    const t = buildInitialTeams();
    const [p] = generateLeaguePlayers(createPRNG(42), t, 2026);
    const schedule = generateScheduleTemplate();

    const start = performance.now();
    await simulateSeason(t, p, schedule, 42);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThanOrEqual(GATES.fullSeasonMs.max);
  }, 15_000);
});
