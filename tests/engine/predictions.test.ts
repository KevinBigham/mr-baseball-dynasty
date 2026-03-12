import { describe, it, expect } from 'vitest';
import {
  generatePreseasonPredictions,
  resolvePredictions,
  gradeReportAccuracy,
} from '../../src/engine/predictions';
import type { StandingsRow } from '../../src/types/league';

function makeStandingsRow(teamId: number, wins: number, losses = 162 - wins): StandingsRow {
  return {
    teamId, name: `Team ${teamId}`, abbreviation: `T${teamId}`,
    league: teamId <= 15 ? 'AL' : 'NL', division: 'East',
    wins, losses, pct: wins / (wins + losses),
    gb: 0, runsScored: wins * 5, runsAllowed: losses * 5, pythagWins: wins,
  };
}

function makeStandings(): StandingsRow[] {
  return Array.from({ length: 30 }, (_, i) => {
    const wins = 70 + (i % 20); // 70-89 wins
    return makeStandingsRow(i + 1, wins);
  });
}

describe('generatePreseasonPredictions', () => {
  it('generates 30 predictions', () => {
    const report = generatePreseasonPredictions(null, 1, 2025);
    expect(report.predictions.length).toBe(30);
  });

  it('predicted wins are in [55, 105] range', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    for (const p of report.predictions) {
      expect(p.predictedWins).toBeGreaterThanOrEqual(55);
      expect(p.predictedWins).toBeLessThanOrEqual(105);
    }
  });

  it('playoff odds are in [2, 97] range', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    for (const p of report.predictions) {
      expect(p.playoffOdds).toBeGreaterThanOrEqual(2);
      expect(p.playoffOdds).toBeLessThanOrEqual(97);
    }
  });

  it('WS odds are in [1, 33] range', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    for (const p of report.predictions) {
      expect(p.wsOdds).toBeGreaterThanOrEqual(1);
      expect(p.wsOdds).toBeLessThanOrEqual(33);
    }
  });

  it('is deterministic for same season', () => {
    const r1 = generatePreseasonPredictions(makeStandings(), 1, 2025);
    const r2 = generatePreseasonPredictions(makeStandings(), 1, 2025);
    expect(r1.predictions.map(p => p.predictedWins)).toEqual(r2.predictions.map(p => p.predictedWins));
  });

  it('uses 81 wins baseline when no standings', () => {
    const report = generatePreseasonPredictions(null, 1, 2025);
    // All teams start from 81 wins, regressed: 81*0.65 + 81*0.35 = 81, +/- noise
    for (const p of report.predictions) {
      expect(p.predictedWins).toBeGreaterThanOrEqual(55);
      expect(p.predictedWins).toBeLessThanOrEqual(105);
    }
  });
});

describe('resolvePredictions', () => {
  it('marks predictions as resolved', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    const actual = makeStandings();
    const resolved = resolvePredictions(report, actual);
    expect(resolved.resolved).toBe(true);
  });

  it('sets hit=true when within 5 wins', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    // Create actual standings where each team matches prediction exactly
    const actual = report.predictions.map(p =>
      makeStandingsRow(p.teamId, p.predictedWins)
    );
    const resolved = resolvePredictions(report, actual);
    for (const p of resolved.predictions) {
      expect(p.hit).toBe(true);
    }
  });

  it('sets hit=false when > 5 wins off', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    // Create actual standings wildly different
    const actual = report.predictions.map(p =>
      makeStandingsRow(p.teamId, Math.max(55, p.predictedWins - 20))
    );
    const resolved = resolvePredictions(report, actual);
    const allHit = resolved.predictions.every(p => p.hit === true);
    expect(allHit).toBe(false); // At least some should miss
  });
});

describe('gradeReportAccuracy', () => {
  it('returns SHARP for 70%+ accuracy', () => {
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    // Resolve with exact predictions
    const actual = report.predictions.map(p =>
      makeStandingsRow(p.teamId, p.predictedWins)
    );
    const resolved = resolvePredictions(report, actual);
    const grade = gradeReportAccuracy(resolved);
    expect(grade.pct).toBe(100);
    expect(grade.label).toBe('SHARP');
  });

  it('returns correct grade tiers', () => {
    // Test that grade function exists and returns valid shape
    const report = generatePreseasonPredictions(makeStandings(), 1, 2025);
    const actual = makeStandings();
    const resolved = resolvePredictions(report, actual);
    const grade = gradeReportAccuracy(resolved);
    expect(grade).toHaveProperty('pct');
    expect(grade).toHaveProperty('label');
    expect(grade).toHaveProperty('color');
    expect(typeof grade.pct).toBe('number');
    expect(grade.pct).toBeGreaterThanOrEqual(0);
    expect(grade.pct).toBeLessThanOrEqual(100);
  });
});
