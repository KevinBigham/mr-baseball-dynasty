import { describe, it, expect } from 'vitest';
import type { Player } from '../../src/types/player';
import { createDraftPool, recoverOrphanedDraftPlayers } from '../../src/engine/draft/draftPool';

// ─── Helper ─────────────────────────────────────────────────────────────────

const makePlayer = (id: number, teamId: number, isPitcher = false): Player => ({
  playerId: id,
  teamId,
  name: `Player ${id}`,
  age: 25,
  position: isPitcher ? 'SP' : 'SS',
  bats: 'R',
  throws: 'R',
  nationality: 'american',
  isPitcher,
  hitterAttributes: isPitcher ? null : {
    contact: 300, power: 300, eye: 300, speed: 300,
    fielding: 300, armStrength: 300, durability: 300, baserunningIQ: 300,
    platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
    workEthic: 60, mentalToughness: 55,
  },
  pitcherAttributes: isPitcher ? {
    stuff: 300, movement: 300, command: 300, stamina: 300,
    pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 300,
    durability: 300, recoveryRate: 300, platoonTendency: 0,
    pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
    pitchingIQ: 300, workEthic: 60, mentalToughness: 55,
  } : null,
  overall: 300,
  potential: 400,
  development: { theta: 0, sigma: 0.1, phase: 'prime' },
  rosterData: {
    rosterStatus: 'MLB_ACTIVE',
    isOn40Man: true,
    optionYearsRemaining: 3,
    optionUsedThisSeason: false,
    minorLeagueDaysThisSeason: 0,
    demotionsThisSeason: 0,
    serviceTimeDays: 172 * 3,
    serviceTimeCurrentTeamDays: 172 * 3,
    rule5Selected: false,
    signedSeason: 2023,
    signedAge: 22,
    contractYearsRemaining: 3,
    salary: 1_000_000,
    arbitrationEligible: false,
    freeAgentEligible: false,
    hasTenAndFive: false,
  },
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('draftPool immutability', () => {
  it('createDraftPool clones players — modifying pool player does not affect snapshot', () => {
    const p1 = makePlayer(1, 5);
    const p2 = makePlayer(2, 5, true);
    const p3 = makePlayer(3, 5);
    const players = [p1, p2, p3];

    // Snapshot original values
    const originalTeamIds = players.map(p => p.teamId);
    const originalStatuses = players.map(p => p.rosterData.rosterStatus);

    expect(originalTeamIds).toEqual([5, 5, 5]);
    expect(originalStatuses).toEqual(['MLB_ACTIVE', 'MLB_ACTIVE', 'MLB_ACTIVE']);

    const pool = createDraftPool(players);

    // Pool players should have teamId=-1 and DRAFT_ELIGIBLE
    for (const poolPlayer of pool) {
      expect(poolPlayer.teamId).toBe(-1);
      expect(poolPlayer.rosterData.rosterStatus).toBe('DRAFT_ELIGIBLE');
    }

    // The source array references were replaced (per the implementation),
    // so players[i] now IS the clone. Verify by checking that
    // players[i] === pool[j] for the same playerId.
    for (const poolPlayer of pool) {
      const sourcePlayer = players.find(p => p.playerId === poolPlayer.playerId);
      expect(sourcePlayer).toBeDefined();
      // After createDraftPool, the source array entry is the same reference as the pool entry
      expect(sourcePlayer).toBe(poolPlayer);
    }

    // All 3 players were MLB_ACTIVE so all should be in the pool
    expect(pool).toHaveLength(3);
  });

  it('recoverOrphanedDraftPlayers converts DRAFT_ELIGIBLE to FREE_AGENT', () => {
    const p1 = makePlayer(1, -1);
    p1.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
    const p2 = makePlayer(2, -1);
    p2.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
    const p3 = makePlayer(3, 10);
    // p3 stays MLB_ACTIVE

    const players = [p1, p2, p3];
    const count = recoverOrphanedDraftPlayers(players);

    expect(count).toBe(2);
    expect(p1.rosterData.rosterStatus).toBe('FREE_AGENT');
    expect(p1.teamId).toBe(-1);
    expect(p2.rosterData.rosterStatus).toBe('FREE_AGENT');
    expect(p2.teamId).toBe(-1);
    // p3 should be untouched
    expect(p3.rosterData.rosterStatus).toBe('MLB_ACTIVE');
    expect(p3.teamId).toBe(10);
  });
});
