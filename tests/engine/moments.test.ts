import { describe, it, expect } from 'vitest';
import { getMomentMeta, generateSeasonMoments } from '../../src/engine/moments';
import type { SeasonResult } from '../../src/types/league';
import type { SeasonSummary } from '../../src/store/leagueStore';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<SeasonResult> = {}): SeasonResult {
  return {
    season: 2025,
    teamSeasons: [],
    playerSeasons: [],
    boxScores: [],
    leagueBA: 0.260,
    leagueERA: 4.10,
    leagueRPG: 4.5,
    teamWinsSD: 8,
    awards: {
      mvpAL: { playerId: 1, name: 'Mike Trout', teamId: 1, teamAbbr: 'LAA', position: 'CF', age: 33, statLine: '.310/40/100' },
      mvpNL: { playerId: 2, name: 'Ronald Acuna', teamId: 16, teamAbbr: 'ATL', position: 'CF', age: 27, statLine: '.320/35/90' },
      cyYoungAL: null,
      cyYoungNL: null,
      royAL: null,
      royNL: null,
    },
    divisionChampions: [],
    developmentEvents: [],
    injuryEvents: [],
    ...overrides,
  };
}

function makeSummary(overrides: Partial<Omit<SeasonSummary, 'keyMoment'>> = {}): Omit<SeasonSummary, 'keyMoment'> {
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
    ...overrides,
  };
}

// ─── getMomentMeta ──────────────────────────────────────────────────────────

describe('getMomentMeta', () => {
  it('returns metadata for dynasty category', () => {
    const meta = getMomentMeta('dynasty');
    expect(meta).toHaveProperty('icon');
    expect(meta).toHaveProperty('color');
    expect(meta).toHaveProperty('label');
  });

  it('returns metadata for all categories', () => {
    const categories = ['dynasty', 'breakout', 'heartbreak', 'record', 'upset', 'milestone'] as const;
    for (const cat of categories) {
      const meta = getMomentMeta(cat);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── generateSeasonMoments ──────────────────────────────────────────────────

describe('generateSeasonMoments — championship', () => {
  it('generates dynasty moment for WS champion', () => {
    const result = makeResult();
    const summary = makeSummary({ playoffResult: 'Champion', wins: 100 });
    const moments = generateSeasonMoments(result, summary, 1);
    const dynasty = moments.find(m => m.category === 'dynasty');
    expect(dynasty).toBeDefined();
    expect(dynasty!.weight).toBe(10);
  });
});

describe('generateSeasonMoments — heartbreak', () => {
  it('generates heartbreak for WS appearance without win', () => {
    const result = makeResult();
    const summary = makeSummary({ playoffResult: 'WS', wins: 95 });
    const moments = generateSeasonMoments(result, summary, 1);
    const heartbreak = moments.find(m => m.category === 'heartbreak');
    expect(heartbreak).toBeDefined();
  });

  it('generates heartbreak for 95+ wins without playoffs', () => {
    const result = makeResult();
    const summary = makeSummary({ wins: 97, playoffResult: null });
    const moments = generateSeasonMoments(result, summary, 1);
    const upset = moments.find(m => m.headline?.includes('No October'));
    expect(upset).toBeDefined();
  });
});

describe('generateSeasonMoments — MVP moments', () => {
  it('generates record moments for MVP winners', () => {
    const result = makeResult();
    const summary = makeSummary();
    const moments = generateSeasonMoments(result, summary, 1);
    const records = moments.filter(m => m.category === 'record');
    expect(records.length).toBeGreaterThan(0);
  });
});

describe('generateSeasonMoments — max 5 moments', () => {
  it('returns at most 5 moments', () => {
    const result = makeResult({
      leagueERA: 3.50,
      teamWinsSD: 14,
      developmentEvents: Array.from({ length: 10 }, (_, i) => ({
        playerId: i + 1,
        playerName: `Player ${i}`,
        type: 'breakout' as const,
        overallDelta: 50,
        newOvr: 400,
      })),
    });
    const summary = makeSummary({ wins: 98, playoffResult: null });
    const moments = generateSeasonMoments(result, summary, 1);
    expect(moments.length).toBeLessThanOrEqual(5);
  });
});

describe('generateSeasonMoments — sorted by weight', () => {
  it('moments are sorted by weight descending', () => {
    const result = makeResult();
    const summary = makeSummary({ playoffResult: 'Champion', wins: 100 });
    const moments = generateSeasonMoments(result, summary, 1);
    for (let i = 1; i < moments.length; i++) {
      expect(moments[i - 1].weight).toBeGreaterThanOrEqual(moments[i].weight);
    }
  });
});
