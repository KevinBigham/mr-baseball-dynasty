import { describe, it, expect } from 'vitest';
import { computeReputation } from '../../src/engine/reputation';
import type { SeasonSummary } from '../../src/store/leagueStore';

// ─── SeasonSummary factory ──────────────────────────────────────────────────

function makeSummary(overrides: Partial<SeasonSummary> = {}): SeasonSummary {
  return {
    season: 2025,
    wins: 85,
    losses: 77,
    pct: 0.525,
    playoffResult: null,
    awardsWon: [],
    breakoutHits: 1,
    ownerPatienceEnd: 50,
    teamMoraleEnd: 60,
    leagueERA: 4.10,
    leagueBA: 0.260,
    keyMoment: '',
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('computeReputation — empty history', () => {
  it('returns null for empty history', () => {
    const result = computeReputation([]);
    expect(result).toBeNull();
  });
});

describe('computeReputation — single season', () => {
  it('returns a valid reputation score', () => {
    const result = computeReputation([makeSummary()]);
    expect(result).not.toBeNull();
    expect(result!.overall).toBeGreaterThanOrEqual(0);
    expect(result!.overall).toBeLessThanOrEqual(100);
    expect(result!.dimensions).toHaveLength(4);
  });

  it('has correct dimension labels', () => {
    const result = computeReputation([makeSummary()]);
    const labels = result!.dimensions.map(d => d.label);
    expect(labels).toContain('WINNING');
    expect(labels).toContain('OCTOBER');
    expect(labels).toContain('DEVELOPMENT');
    expect(labels).toContain('LONGEVITY');
  });

  it('assigns grade based on score', () => {
    const result = computeReputation([makeSummary()]);
    expect(typeof result!.grade).toBe('string');
    expect(result!.grade.length).toBeGreaterThan(0);
  });
});

describe('computeReputation — dynasty scenario', () => {
  it('scores very high for multiple championships', () => {
    const history = Array.from({ length: 5 }, (_, i) =>
      makeSummary({
        season: 2025 + i,
        wins: 100,
        losses: 62,
        pct: 0.617,
        playoffResult: 'Champion',
        breakoutHits: 2,
      })
    );
    const result = computeReputation(history);
    expect(result!.overall).toBeGreaterThan(70);
    expect(result!.flavor).toContain('DYNASTY');
  });
});

describe('computeReputation — rebuilding scenario', () => {
  it('scores low for losing seasons', () => {
    const history = Array.from({ length: 3 }, (_, i) =>
      makeSummary({
        season: 2025 + i,
        wins: 60,
        losses: 102,
        pct: 0.370,
        playoffResult: null,
        breakoutHits: 0,
      })
    );
    const result = computeReputation(history);
    expect(result!.overall).toBeLessThan(40);
  });
});

describe('computeReputation — dimension bounds', () => {
  it('each dimension score is between 0 and 25', () => {
    const history = [makeSummary({ wins: 95, playoffResult: 'DS' })];
    const result = computeReputation(history);
    for (const dim of result!.dimensions) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(25);
      expect(dim.max).toBe(25);
    }
  });
});
