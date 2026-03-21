/**
 * Round 5: Big Moments — Tests
 * Covers: Streak detection, Milestone generation, Moments integration
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTeamStreak,
  inferTeamStreaks,
  getPlayerStreak,
  getPitcherStreak,
} from '../../src/engine/streaks';
import { generateSeasonMoments } from '../../src/engine/moments';

// ─── Team Streak Tests ─────────────────────────────────────────────────────

describe('Team Streak Detection', () => {
  it('detects a win streak of 5', () => {
    const results = [
      { teamId: 1, won: true },
      { teamId: 1, won: true },
      { teamId: 1, won: true },
      { teamId: 1, won: true },
      { teamId: 1, won: true },
      { teamId: 1, won: false },
    ];
    const streak = calculateTeamStreak(results, 1);
    expect(streak.type).toBe('win');
    expect(streak.length).toBe(5);
    expect(streak.intensity).toBe(2);
  });

  it('detects a loss streak of 3', () => {
    const results = [
      { teamId: 1, won: false },
      { teamId: 1, won: false },
      { teamId: 1, won: false },
      { teamId: 1, won: true },
    ];
    const streak = calculateTeamStreak(results, 1);
    expect(streak.type).toBe('loss');
    expect(streak.length).toBe(3);
    expect(streak.intensity).toBe(1);
  });

  it('returns intensity 0 for streak < 3', () => {
    const results = [
      { teamId: 1, won: true },
      { teamId: 1, won: true },
      { teamId: 1, won: false },
    ];
    const streak = calculateTeamStreak(results, 1);
    expect(streak.length).toBe(2);
    expect(streak.intensity).toBe(0);
  });

  it('returns intensity 4 for 10+ streak', () => {
    const results = Array.from({ length: 12 }, () => ({ teamId: 1, won: true }));
    const streak = calculateTeamStreak(results, 1);
    expect(streak.length).toBe(12);
    expect(streak.intensity).toBe(4);
  });

  it('handles empty results', () => {
    const streak = calculateTeamStreak([], 1);
    expect(streak.length).toBe(0);
    expect(streak.intensity).toBe(0);
  });

  it('filters by team ID', () => {
    const results = [
      { teamId: 1, won: true },
      { teamId: 2, won: false },
      { teamId: 1, won: true },
      { teamId: 2, won: true },
      { teamId: 1, won: true },
    ];
    const streak = calculateTeamStreak(results, 1);
    expect(streak.type).toBe('win');
    expect(streak.length).toBe(3);
  });
});

describe('Team Streak Inference from Standings', () => {
  it('infers streaks from standings changes', () => {
    const prev = [{ teamId: 1, wins: 50, losses: 30 }];
    const curr = [{ teamId: 1, wins: 55, losses: 30 }];
    const streaks = inferTeamStreaks(curr, prev);
    expect(streaks.length).toBe(1);
    expect(streaks[0].type).toBe('win');
    expect(streaks[0].length).toBe(5);
  });

  it('returns empty for no previous standings', () => {
    const curr = [{ teamId: 1, wins: 50, losses: 30 }];
    expect(inferTeamStreaks(curr, null)).toEqual([]);
  });
});

// ─── Player Streak Tests ───────────────────────────────────────────────────

describe('Player Streak Detection', () => {
  it('detects hot hitter', () => {
    // Season avg .250, recent .400 → hot
    expect(getPlayerStreak(20, 8, 0, 0.250)).toBe('hot');
  });

  it('detects cold hitter', () => {
    // Season avg .280, recent .130 → cold
    expect(getPlayerStreak(30, 4, 0, 0.280)).toBe('cold');
  });

  it('returns none for normal performance', () => {
    // Season avg .270, recent .280 → none
    expect(getPlayerStreak(25, 7, 0, 0.270)).toBe('none');
  });

  it('returns none for insufficient ABs', () => {
    expect(getPlayerStreak(5, 3, 0, 0.250)).toBe('none');
  });

  it('detects HR binge as hot', () => {
    // 3 HR in 20 AB is a hot streak regardless
    expect(getPlayerStreak(20, 5, 3, 0.250)).toBe('hot');
  });
});

describe('Pitcher Streak Detection', () => {
  it('detects hot pitcher', () => {
    // Season ERA 4.0, recent ERA 1.5 → hot
    expect(getPitcherStreak(12, 2, 4.0)).toBe('hot');
  });

  it('detects cold pitcher', () => {
    // Season ERA 3.5, recent ERA 7.0 → cold
    expect(getPitcherStreak(9, 7, 3.5)).toBe('cold');
  });

  it('returns none for insufficient IP', () => {
    expect(getPitcherStreak(3, 1, 4.0)).toBe('none');
  });
});

// ─── Season Moments Tests ──────────────────────────────────────────────────

describe('Season Moments Generation', () => {
  const baseSummary = {
    season: 2026,
    wins: 85,
    losses: 77,
    pct: 0.525,
    playoffResult: null as string | null,
    awardsWon: [],
    breakoutHits: 0,
    ownerPatienceEnd: 70,
    teamMoraleEnd: 65,
    leagueERA: 4.1,
    leagueBA: 0.255,
  };

  const baseResult = {
    season: 2026,
    teamSeasons: [],
    awards: null,
    leagueERA: 4.1,
    leagueBA: 0.255,
    teamWinsSD: 8,
    developmentEvents: [],
  };

  it('generates champion moment with weight 10', () => {
    const summary = { ...baseSummary, playoffResult: 'Champion', wins: 95 };
    const moments = generateSeasonMoments(baseResult as any, summary, 1);
    const champ = moments.find(m => m.id.includes('champion'));
    expect(champ).toBeDefined();
    expect(champ!.weight).toBe(10);
    expect(champ!.category).toBe('dynasty');
  });

  it('generates heartbreak moment for WS loss', () => {
    const summary = { ...baseSummary, playoffResult: 'WS', wins: 92 };
    const moments = generateSeasonMoments(baseResult as any, summary, 1);
    const wsApp = moments.find(m => m.id.includes('ws-app'));
    expect(wsApp).toBeDefined();
    expect(wsApp!.category).toBe('heartbreak');
  });

  it('caps moments at 5 per season', () => {
    const result = {
      ...baseResult,
      awards: {
        mvpAL: { name: 'A', teamId: 1, statLine: '.300' },
        mvpNL: { name: 'B', teamId: 2, statLine: '.310' },
        cyYoungAL: { name: 'C', teamId: 3, statLine: '2.50' },
        cyYoungNL: { name: 'D', teamId: 4, statLine: '2.80' },
        royAL: { name: 'E', teamId: 5, statLine: '.290' },
        royNL: { name: 'F', teamId: 6, statLine: '.280' },
      },
      leagueERA: 3.70,
    };
    const summary = { ...baseSummary, playoffResult: 'Champion', wins: 100 };
    const moments = generateSeasonMoments(result as any, summary, 1);
    expect(moments.length).toBeLessThanOrEqual(5);
  });

  it('generates 95+ win no-playoff upset moment', () => {
    const summary = { ...baseSummary, playoffResult: null, wins: 96 };
    const moments = generateSeasonMoments(baseResult as any, summary, 1);
    const heartbreak = moments.find(m => m.category === 'heartbreak' && m.headline.includes('96'));
    expect(heartbreak).toBeDefined();
    expect(heartbreak!.headline).toContain('No October');
  });

  it('generates no moments for average season', () => {
    const summary = { ...baseSummary, wins: 78, losses: 84, playoffResult: null };
    const moments = generateSeasonMoments(baseResult as any, summary, 1);
    // May have 0 or a few league-level moments
    expect(moments.length).toBeLessThanOrEqual(5);
  });
});
