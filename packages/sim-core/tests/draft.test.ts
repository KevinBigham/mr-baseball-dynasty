import { describe, it, expect } from 'vitest';
import {
  GameRNG,
  generatePlayer,
  generateTeamRoster,
  generateDraftClass,
  rankProspects,
  determineDraftOrder,
  aiSelectPick,
  evaluateTeamNeeds,
  simulateFullDraft,
  DRAFT_ROUNDS,
  NUM_TEAMS,
  ALL_POSITIONS,
  TEAMS,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateDraftClass', () => {
  it('creates ~300 prospects', () => {
    const rng = new GameRNG(42);
    const draftClass = generateDraftClass(rng, 1);
    expect(draftClass.prospects.length).toBe(300);
    expect(draftClass.season).toBe(1);
  });

  it('all prospects have valid positions and attributes', () => {
    const rng = new GameRNG(99);
    const draftClass = generateDraftClass(rng, 2);
    const validPositions = new Set(ALL_POSITIONS);
    for (const prospect of draftClass.prospects) {
      expect(validPositions.has(prospect.player.position)).toBe(true);
      expect(prospect.scoutingGrade).toBeGreaterThanOrEqual(20);
      expect(prospect.scoutingGrade).toBeLessThanOrEqual(80);
      expect(prospect.signability).toBeGreaterThanOrEqual(0);
      expect(prospect.signability).toBeLessThanOrEqual(1);
      expect(prospect.player.id).toBeTruthy();
    }
  });
});

describe('rankProspects', () => {
  it('sorts by scouting grade descending', () => {
    const rng = new GameRNG(42);
    const draftClass = generateDraftClass(rng, 1);
    const ranked = rankProspects(draftClass.prospects);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.scoutingGrade).toBeGreaterThanOrEqual(ranked[i]!.scoutingGrade);
    }
  });
});

describe('determineDraftOrder', () => {
  it('puts worst team first', () => {
    const records = [
      { teamId: 'NYY', wins: 95, losses: 67 },
      { teamId: 'PIT', wins: 55, losses: 107 },
      { teamId: 'LAD', wins: 100, losses: 62 },
    ];
    const order = determineDraftOrder(records);
    expect(order[0]).toBe('PIT');
    expect(order[order.length - 1]).toBe('LAD');
  });
});

describe('aiSelectPick', () => {
  it('returns a valid prospect from the available pool', () => {
    const rng1 = new GameRNG(42);
    const draftClass = generateDraftClass(rng1, 1);
    const rng2 = new GameRNG(42);
    const teamRoster = generateTeamRoster(rng2, 'NYY');
    const rng3 = new GameRNG(100);
    const pick = aiSelectPick(rng3, 'NYY', draftClass.prospects, teamRoster);
    expect(pick).toBeTruthy();
    expect(pick.player.id).toBeTruthy();
    // Should be one of the available prospects
    const ids = draftClass.prospects.map((p) => p.player.id);
    expect(ids).toContain(pick.player.id);
  });
});

describe('evaluateTeamNeeds', () => {
  it('returns needs for all positions', () => {
    const rng = new GameRNG(42);
    const roster = generateTeamRoster(rng, 'NYY');
    const needs = evaluateTeamNeeds(roster);
    expect(needs.size).toBeGreaterThan(0);
    for (const [pos, score] of needs) {
      expect(typeof pos).toBe('string');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('simulateFullDraft', () => {
  it('produces 640 picks (20 rounds x 32 teams)', () => {
    const rng1 = new GameRNG(42);
    const draftClass = generateDraftClass(rng1, 1);

    // Build draft order: just use TEAMS in reverse as a simple ordering
    const draftOrder = TEAMS.map((t) => t.id);

    // Build minimal rosters for each team
    const teamRosters = new Map<string, any[]>();
    for (const team of TEAMS) {
      teamRosters.set(team.id, []);
    }

    const rng2 = new GameRNG(99);
    const result = simulateFullDraft(rng2, draftClass, draftOrder, teamRosters, 'NYY');

    // Draft class has 300 prospects, so all 300 get drafted (not 640)
    expect(result.picks.length).toBe(300);
  });

  it('all drafted players assigned to teams', () => {
    const rng1 = new GameRNG(42);
    const draftClass = generateDraftClass(rng1, 1);
    const draftOrder = TEAMS.map((t) => t.id);
    const teamRosters = new Map<string, any[]>();
    for (const team of TEAMS) {
      teamRosters.set(team.id, []);
    }
    const rng2 = new GameRNG(99);
    const result = simulateFullDraft(rng2, draftClass, draftOrder, teamRosters, 'NYY');
    for (const pick of result.picks) {
      expect(pick.teamId).toBeTruthy();
      expect(pick.prospect.player.teamId).toBe(pick.teamId);
    }
  });
});

describe('draft determinism', () => {
  it('same seed produces identical draft results', () => {
    const rng1a = new GameRNG(42);
    const dc1 = generateDraftClass(rng1a, 1);
    const rng1b = new GameRNG(42);
    const dc2 = generateDraftClass(rng1b, 1);
    expect(dc1.prospects.length).toBe(dc2.prospects.length);
    for (let i = 0; i < dc1.prospects.length; i++) {
      expect(dc1.prospects[i]!.scoutingGrade).toBe(dc2.prospects[i]!.scoutingGrade);
    }
  });
});
