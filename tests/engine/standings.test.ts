import { describe, it, expect } from 'vitest';
import { tiebreakCompare } from '../../src/engine/standings';
import type { StandingsRow } from '../../src/types/league';

// ─── Helper: build a StandingsRow with defaults ─────────────────────────────

function makeRow(overrides: Partial<StandingsRow> = {}): StandingsRow {
  return {
    teamId: 1,
    name: 'Test Team',
    abbreviation: 'TST',
    league: 'AL',
    division: 'East',
    wins: 81,
    losses: 81,
    pct: 0.500,
    gb: 0,
    runsScored: 700,
    runsAllowed: 700,
    pythagWins: 81,
    ...overrides,
  };
}

describe('tiebreakCompare', () => {
  it('higher wins sorts first', () => {
    const a = makeRow({ teamId: 1, wins: 95, losses: 67 });
    const b = makeRow({ teamId: 2, wins: 90, losses: 72 });

    // a should sort before b (compare returns negative when a is first)
    expect(tiebreakCompare(a, b)).toBeLessThan(0);
    expect(tiebreakCompare(b, a)).toBeGreaterThan(0);
  });

  it('equal wins — fewer losses sorts first', () => {
    const a = makeRow({ teamId: 1, wins: 90, losses: 70 });
    const b = makeRow({ teamId: 2, wins: 90, losses: 72 });

    // a has fewer losses, so a sorts first
    expect(tiebreakCompare(a, b)).toBeLessThan(0);
    expect(tiebreakCompare(b, a)).toBeGreaterThan(0);
  });

  it('run differential tiebreaker', () => {
    const a = makeRow({
      teamId: 1, wins: 90, losses: 72,
      runsScored: 750, runsAllowed: 700, // diff = +50
    });
    const b = makeRow({
      teamId: 2, wins: 90, losses: 72,
      runsScored: 720, runsAllowed: 700, // diff = +20
    });

    // a has better run differential
    expect(tiebreakCompare(a, b)).toBeLessThan(0);
    expect(tiebreakCompare(b, a)).toBeGreaterThan(0);
  });

  it('runs scored tiebreaker (equal diff)', () => {
    const a = makeRow({
      teamId: 1, wins: 90, losses: 72,
      runsScored: 800, runsAllowed: 750, // diff = +50
    });
    const b = makeRow({
      teamId: 2, wins: 90, losses: 72,
      runsScored: 750, runsAllowed: 700, // diff = +50
    });

    // Same run differential, but a scored more runs
    expect(tiebreakCompare(a, b)).toBeLessThan(0);
    expect(tiebreakCompare(b, a)).toBeGreaterThan(0);
  });

  it('pythagorean wins as final tiebreaker', () => {
    const a = makeRow({
      teamId: 1, wins: 90, losses: 72,
      runsScored: 700, runsAllowed: 650, // diff = +50
      pythagWins: 93,
    });
    const b = makeRow({
      teamId: 2, wins: 90, losses: 72,
      runsScored: 700, runsAllowed: 650, // diff = +50
      pythagWins: 88,
    });

    // Same wins, losses, diff, and runs scored — pythag decides
    expect(tiebreakCompare(a, b)).toBeLessThan(0);
    expect(tiebreakCompare(b, a)).toBeGreaterThan(0);
  });
});
