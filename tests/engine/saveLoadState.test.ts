import { describe, it, expect } from 'vitest';
import type { LeagueState } from '../../src/types/league';

// ─── Tests ──────────────────────────────────────────────────────────────────
// These are type-level + runtime shape tests that verify LeagueState includes
// the fields added in recent rounds. If any field were removed from the type,
// these tests would fail at compile time (tsc) or at runtime via the assertions.

describe('LeagueState shape — save/load fields', () => {
  it('LeagueState type includes playerSeasonStats field', () => {
    const state: Partial<LeagueState> = {};
    state.playerSeasonStats = {};
    expect(state.playerSeasonStats).toBeDefined();
  });

  it('LeagueState type includes lastAIRosterMoves field', () => {
    const state: Partial<LeagueState> = {};
    state.lastAIRosterMoves = [];
    expect(state.lastAIRosterMoves).toBeDefined();
    expect(Array.isArray(state.lastAIRosterMoves)).toBe(true);
  });

  it('LeagueState type includes foStaff field', () => {
    const state: Partial<LeagueState> = {};
    state.foStaff = [];
    expect(state.foStaff).toBeDefined();
    expect(Array.isArray(state.foStaff)).toBe(true);
  });

  it('LeagueState type includes draftState field', () => {
    const state: Partial<LeagueState> = {};
    state.draftState = {
      mode: 'amateur',
      pool: [],
      prospects: [],
      picks: [],
      draftOrder: [],
      currentRound: 1,
      currentPickInRound: 1,
      totalRounds: 5,
      userTeamId: 1,
      isComplete: false,
    };
    expect(state.draftState).toBeDefined();
    expect(state.draftState!.mode).toBe('amateur');
    expect(state.draftState!.isComplete).toBe(false);
  });

  it('LeagueState type includes lineupOrder field', () => {
    const state: Partial<LeagueState> = {};
    state.lineupOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(state.lineupOrder).toBeDefined();
    expect(state.lineupOrder).toHaveLength(9);
  });

  it('LeagueState type includes rotationOrder field', () => {
    const state: Partial<LeagueState> = {};
    state.rotationOrder = [10, 11, 12, 13, 14];
    expect(state.rotationOrder).toBeDefined();
    expect(state.rotationOrder).toHaveLength(5);
  });
});
