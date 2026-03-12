import { describe, it, expect } from 'vitest';
import type { LeagueState, SeasonResult } from '../../src/types/league';

describe('LeagueState — seasonResults field', () => {
  it('SeasonResult interface has required fields', () => {
    const result: SeasonResult = {
      season: 2026,
      teamSeasons: [],
      playerSeasons: [],
      boxScores: [],
      leagueBA: 0.250,
      leagueERA: 4.00,
      leagueRPG: 4.5,
      teamWinsSD: 10,
    };
    expect(result.season).toBe(2026);
    expect(result.leagueBA).toBe(0.250);
  });

  it('LeagueState accepts optional seasonResults field', () => {
    const result: SeasonResult = {
      season: 2026,
      teamSeasons: [],
      playerSeasons: [],
      boxScores: [],
      leagueBA: 0.250,
      leagueERA: 4.00,
      leagueRPG: 4.5,
      teamWinsSD: 10,
    };

    // Type-level check: seasonResults can be set on LeagueState
    const state = {
      season: 2026,
      teams: [],
      players: [],
      schedule: [],
      environment: { pitcherBuffFactor: 1, hitterBuffFactor: 1, babipAdjustment: 0 },
      prngState: [0],
      userTeamId: 1,
      seasonResults: [result],
    } as LeagueState;

    expect(state.seasonResults).toHaveLength(1);
    expect(state.seasonResults![0].season).toBe(2026);
  });
});
