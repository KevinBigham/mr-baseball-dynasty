/**
 * Round 8: Legacy Engine — Tests
 */
import { describe, it, expect } from 'vitest';
import { calculateLegacyScore, getLegacyTier, evaluateGMSkills, evaluateAchievements } from '../../src/engine/legacyEngine';
import type { SeasonSummary } from '../../src/store/leagueStore';

function makeSeason(overrides: Partial<SeasonSummary> = {}): SeasonSummary {
  return {
    season: 2026, wins: 85, losses: 77, pct: 0.525, playoffResult: null,
    awardsWon: [], breakoutHits: 0, ownerPatienceEnd: 70, teamMoraleEnd: 65,
    leagueERA: 4.1, leagueBA: 0.255, keyMoment: '', ...overrides,
  };
}

describe('Legacy Score', () => {
  it('returns zero for empty history', () => {
    const score = calculateLegacyScore([]);
    expect(score.total).toBe(0);
  });

  it('championships are heavily weighted', () => {
    const withChamp = calculateLegacyScore([makeSeason({ playoffResult: 'Champion', wins: 95 })]);
    const without = calculateLegacyScore([makeSeason({ wins: 95 })]);
    expect(withChamp.total).toBeGreaterThan(without.total + 200);
  });

  it('sustained winning adds consistency bonus', () => {
    const history = Array.from({ length: 5 }, () => makeSeason({ wins: 90, losses: 72 }));
    const score = calculateLegacyScore(history);
    expect(score.consistency).toBeGreaterThan(0);
  });

  it('score increases with more seasons', () => {
    const one = calculateLegacyScore([makeSeason({ wins: 90 })]);
    const three = calculateLegacyScore([makeSeason({ wins: 90 }), makeSeason({ wins: 88 }), makeSeason({ wins: 92 })]);
    expect(three.total).toBeGreaterThan(one.total);
  });
});

describe('Legacy Tier', () => {
  it('returns LEGENDARY for 1000+', () => {
    expect(getLegacyTier(1000).tier).toBe('LEGENDARY');
  });
  it('returns UNPROVEN for 0', () => {
    expect(getLegacyTier(0).tier).toBe('UNPROVEN');
  });
});

describe('GM Skills', () => {
  it('unlocks eagle_eye at 3 seasons', () => {
    const skills = evaluateGMSkills({ tradesCompleted: 0, prospectsPromoted: 0, playoffAppearances: 0, championships: 0, seasonsManaged: 3, awards: 0, winStreakBest: 0, divisionsWon: 0, moneyballSeasons: 0 });
    expect(skills.find(s => s.id === 'eagle_eye')?.unlocked).toBe(true);
  });

  it('trade_shark requires 10 trades', () => {
    const locked = evaluateGMSkills({ tradesCompleted: 5, prospectsPromoted: 0, playoffAppearances: 0, championships: 0, seasonsManaged: 1, awards: 0, winStreakBest: 0, divisionsWon: 0, moneyballSeasons: 0 });
    expect(locked.find(s => s.id === 'trade_shark')?.unlocked).toBe(false);
    const unlocked = evaluateGMSkills({ tradesCompleted: 10, prospectsPromoted: 0, playoffAppearances: 0, championships: 0, seasonsManaged: 1, awards: 0, winStreakBest: 0, divisionsWon: 0, moneyballSeasons: 0 });
    expect(unlocked.find(s => s.id === 'trade_shark')?.unlocked).toBe(true);
  });

  it('returns 15 skills total', () => {
    const skills = evaluateGMSkills({ tradesCompleted: 0, prospectsPromoted: 0, playoffAppearances: 0, championships: 0, seasonsManaged: 0, awards: 0, winStreakBest: 0, divisionsWon: 0, moneyballSeasons: 0 });
    expect(skills.length).toBe(15);
  });
});

describe('Achievements', () => {
  it('first_ring earned with championship', () => {
    const history = [makeSeason({ playoffResult: 'Champion' })];
    const achs = evaluateAchievements(history, 1, 0, 0, 70);
    expect(achs.find(a => a.id === 'first_ring')?.earned).toBe(true);
  });

  it('century earned with 100+ wins', () => {
    const history = [makeSeason({ wins: 102, losses: 60 })];
    const achs = evaluateAchievements(history, 1, 0, 0, 70);
    expect(achs.find(a => a.id === 'century')?.earned).toBe(true);
  });

  it('iron_man needs 10 seasons', () => {
    const achs = evaluateAchievements([], 9, 0, 0, 70);
    expect(achs.find(a => a.id === 'iron_man')?.earned).toBe(false);
    const achs10 = evaluateAchievements([], 10, 0, 0, 70);
    expect(achs10.find(a => a.id === 'iron_man')?.earned).toBe(true);
  });

  it('tracks progress for in-progress achievements', () => {
    const achs = evaluateAchievements([], 5, 12, 0, 70);
    const wheeler = achs.find(a => a.id === 'wheeler_dealer');
    expect(wheeler?.earned).toBe(false);
    expect(wheeler?.progress).toBeCloseTo(12 / 25);
  });

  it('returns 25 achievements', () => {
    const achs = evaluateAchievements([], 0, 0, 0, 70);
    expect(achs.length).toBe(25);
  });
});
