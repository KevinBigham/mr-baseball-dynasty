import { describe, it, expect } from 'vitest';
import type { Player, Position } from '../../src/types/player';
import type { Team } from '../../src/types/team';
import { createDraftPool, scoutDraftPool, getDraftRounds, generateAnnualDraftClass } from '../../src/engine/draft/draftPool';
import {
  generateDraftOrder, getPickingTeam, getOverallPick,
  aiSelectPlayer, fillRemainingRosters,
} from '../../src/engine/draft/draftAI';
import type { DraftPick } from '../../src/engine/draft/draftAI';
import type { DraftProspect } from '../../src/engine/draft/draftPool';
import { createPRNG } from '../../src/engine/math/prng';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { playerId: number; position: Position }): Player {
  const isPitcher = ['SP', 'RP', 'CL'].includes(overrides.position);
  return {
    playerId: overrides.playerId,
    teamId: overrides.teamId ?? 1,
    name: overrides.name ?? `Player ${overrides.playerId}`,
    firstName: 'Test',
    lastName: 'Player',
    leagueLevel: 'MLB',
    age: overrides.age ?? 27,
    position: overrides.position,
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher,
    hitterAttributes: isPitcher ? null : {
      contact: 350, power: 350, eye: 350, speed: 300, fielding: 300,
      armStrength: 300, durability: 350, baserunningIQ: 300,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 60, mentalToughness: 55,
    },
    pitcherAttributes: isPitcher ? {
      stuff: 350, movement: 350, command: 350, stamina: 350,
      pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 300,
      durability: 350, recoveryRate: 300, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
      pitchingIQ: 300, workEthic: 60, mentalToughness: 55,
    } : null,
    overall: overrides.overall ?? 350,
    potential: overrides.potential ?? 380,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: overrides.rosterData?.rosterStatus ?? 'MLB_ACTIVE',
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
      salary: 5_000_000,
      arbitrationEligible: true,
      freeAgentEligible: false,
      hasTenAndFive: false,
      ...overrides.rosterData,
    },
  };
}

function makeTeam(teamId: number, abbr: string): Team {
  return {
    teamId,
    name: `Team ${abbr}`,
    abbreviation: abbr,
    city: `City ${abbr}`,
    league: teamId <= 15 ? 'AL' : 'NL',
    division: 'East',
    conferenceId: 0,
    divisionId: 0,
    parkFactorId: 0,
    budget: 150_000_000,
    scoutingQuality: 0.7,
    coaching: { hittingCoachQuality: 0.5, pitchingCoachQuality: 0.5 },
    strategy: 'fringe',
    seasonRecord: { wins: 81, losses: 81, runsScored: 700, runsAllowed: 700 },
    rotationIndex: 0,
    bullpenReliefCounter: 0,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getDraftRounds', () => {
  it('returns correct rounds for each mode', () => {
    expect(getDraftRounds('snake10')).toBe(10);
    expect(getDraftRounds('snake25')).toBe(25);
    expect(getDraftRounds('snake26')).toBe(26);
    expect(getDraftRounds('annual')).toBe(5);
    expect(getDraftRounds('instant')).toBe(0);
  });
});

describe('createDraftPool', () => {
  it('extracts MLB_ACTIVE players and marks them DRAFT_ELIGIBLE', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS' }),
      makePlayer({ playerId: 2, position: 'SP' }),
      makePlayer({ playerId: 3, position: 'CF', rosterData: { rosterStatus: 'MINORS_AAA' } as Player['rosterData'] }),
    ];

    const pool = createDraftPool(players);
    expect(pool).toHaveLength(2);
    expect(pool[0].rosterData.rosterStatus).toBe('DRAFT_ELIGIBLE');
    expect(pool[0].teamId).toBe(-1);
    // Minor leaguer should not be in pool
    expect(players[2].rosterData.rosterStatus).toBe('MINORS_AAA');
    expect(players[2].teamId).toBe(1);
  });

  it('sorts pool by overall descending', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS', overall: 300 }),
      makePlayer({ playerId: 2, position: 'SP', overall: 400 }),
      makePlayer({ playerId: 3, position: 'CF', overall: 350 }),
    ];

    const pool = createDraftPool(players);
    expect(pool[0].overall).toBe(400);
    expect(pool[1].overall).toBe(350);
    expect(pool[2].overall).toBe(300);
  });
});

describe('scoutDraftPool', () => {
  it('produces scouted prospects with ranks', () => {
    const players = [
      makePlayer({ playerId: 1, position: 'SS', overall: 400 }),
      makePlayer({ playerId: 2, position: 'SP', overall: 350 }),
    ];
    // Mark as DRAFT_ELIGIBLE
    for (const p of players) {
      p.teamId = -1;
      p.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
    }

    const gen = createPRNG(42);
    const [prospects] = scoutDraftPool(players, 1.0, gen);

    expect(prospects).toHaveLength(2);
    expect(prospects[0].rank).toBe(1);
    expect(prospects[1].rank).toBe(2);
    // Scouted OVR should be in 20-80 range
    expect(prospects[0].scoutedOvr).toBeGreaterThanOrEqual(20);
    expect(prospects[0].scoutedOvr).toBeLessThanOrEqual(80);
  });

  it('higher scouting accuracy produces less noisy grades', () => {
    const players = Array.from({ length: 50 }, (_, i) =>
      makePlayer({ playerId: i + 1, position: 'SS', overall: 350 }),
    );
    for (const p of players) {
      p.teamId = -1;
      p.rosterData.rosterStatus = 'DRAFT_ELIGIBLE';
    }

    const gen = createPRNG(42);
    const [prospectsHigh] = scoutDraftPool(players, 1.5, gen);
    const [prospectsLow] = scoutDraftPool(players, 0.5, gen);

    // Compute variance of scouted OVR
    const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = (arr: number[]) => {
      const m = mean(arr);
      return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
    };

    const highVar = variance(prospectsHigh.map(p => p.scoutedOvr));
    const lowVar = variance(prospectsLow.map(p => p.scoutedOvr));

    // Lower accuracy should produce MORE variance (more noisy)
    expect(lowVar).toBeGreaterThan(highVar);
  });
});

describe('generateDraftOrder', () => {
  it('returns all team IDs in shuffled order', () => {
    const teams = [makeTeam(1, 'AAA'), makeTeam(2, 'BBB'), makeTeam(3, 'CCC')];
    const gen = createPRNG(42);
    const [order] = generateDraftOrder(teams, gen);

    expect(order).toHaveLength(3);
    expect(order.sort()).toEqual([1, 2, 3]);
  });

  it('produces different orders with different seeds', () => {
    const teams = Array.from({ length: 10 }, (_, i) => makeTeam(i + 1, `T${i}`));
    const [order1] = generateDraftOrder(teams, createPRNG(1));
    const [order2] = generateDraftOrder(teams, createPRNG(2));

    // Very unlikely to produce the same order with different seeds
    expect(order1.join(',')).not.toBe(order2.join(','));
  });
});

describe('getPickingTeam (snake order)', () => {
  const order = [10, 20, 30]; // 3 teams

  it('round 1 goes forward: 10, 20, 30', () => {
    expect(getPickingTeam(order, 1, 0)).toBe(10);
    expect(getPickingTeam(order, 1, 1)).toBe(20);
    expect(getPickingTeam(order, 1, 2)).toBe(30);
  });

  it('round 2 reverses: 30, 20, 10', () => {
    expect(getPickingTeam(order, 2, 0)).toBe(30);
    expect(getPickingTeam(order, 2, 1)).toBe(20);
    expect(getPickingTeam(order, 2, 2)).toBe(10);
  });

  it('round 3 goes forward again', () => {
    expect(getPickingTeam(order, 3, 0)).toBe(10);
    expect(getPickingTeam(order, 3, 2)).toBe(30);
  });
});

describe('getOverallPick', () => {
  it('computes correct overall pick numbers', () => {
    expect(getOverallPick(1, 0, 30)).toBe(1);
    expect(getOverallPick(1, 29, 30)).toBe(30);
    expect(getOverallPick(2, 0, 30)).toBe(31);
    expect(getOverallPick(3, 14, 30)).toBe(75);
  });
});

describe('aiSelectPlayer', () => {
  function makeProspect(id: number, pos: Position, rank: number, ovr: number): DraftProspect {
    return {
      playerId: id, name: `P${id}`, position: pos, age: 25,
      scoutedOvr: ovr, scoutedPot: ovr + 5, isPitcher: ['SP', 'RP', 'CL'].includes(pos),
      bats: 'R', throws: 'R', rank,
    };
  }

  it('selects the top-ranked available player in early rounds (BPA)', () => {
    const available: DraftProspect[] = [
      makeProspect(1, 'SS', 1, 75),
      makeProspect(2, 'SP', 2, 72),
      makeProspect(3, 'CF', 3, 70),
    ];
    const teamPicks: DraftPick[] = [];
    const selected = aiSelectPlayer(available, teamPicks, 1);
    expect(selected).toBe(1); // Best ranked
  });

  it('factors in positional need in later rounds', () => {
    const available: DraftProspect[] = [
      makeProspect(1, 'SS', 1, 75), // Top rank but SS already filled
      makeProspect(2, 'SP', 2, 72), // SP is a need
    ];
    // Team already has 2 SS — filled
    const teamPicks: DraftPick[] = [
      { round: 1, pickNumber: 1, teamId: 1, teamAbbr: 'T1', playerId: 10, playerName: 'X', position: 'SS', scoutedOvr: 70 },
      { round: 2, pickNumber: 31, teamId: 1, teamAbbr: 'T1', playerId: 11, playerName: 'Y', position: 'SS', scoutedOvr: 68 },
    ];

    // In late round (round 15), need matters more
    const selected = aiSelectPlayer(available, teamPicks, 15);
    expect(selected).toBe(2); // SP fills a need
  });

  it('returns first available if no better option', () => {
    const available: DraftProspect[] = [
      makeProspect(5, 'DH', 50, 55),
    ];
    const selected = aiSelectPlayer(available, [], 1);
    expect(selected).toBe(5);
  });

  it('returns -1 for empty available list', () => {
    expect(aiSelectPlayer([], [], 1)).toBe(-1);
  });
});

describe('fillRemainingRosters', () => {
  it('assigns undrafted players to teams with roster gaps', () => {
    const teams = [makeTeam(1, 'T1'), makeTeam(2, 'T2')];

    // Team 1 has some players, team 2 has none
    const players = [
      makePlayer({ playerId: 1, position: 'SP', teamId: 1, rosterData: { rosterStatus: 'MLB_ACTIVE' } as Player['rosterData'] }),
      // Undrafted pool
      makePlayer({ playerId: 10, position: 'SP', teamId: -1, overall: 300, rosterData: { rosterStatus: 'DRAFT_ELIGIBLE' } as Player['rosterData'] }),
      makePlayer({ playerId: 11, position: 'C', teamId: -1, overall: 280, rosterData: { rosterStatus: 'DRAFT_ELIGIBLE' } as Player['rosterData'] }),
    ];

    fillRemainingRosters(players, teams);

    // Undrafted players should have been assigned
    const assigned = players.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE' && p.teamId > 0);
    expect(assigned.length).toBeGreaterThan(1);
  });

  it('makes remaining undrafted players free agents', () => {
    const teams = [makeTeam(1, 'T1')];

    // Create enough players at one position to exceed what teams need
    const players: Player[] = [];
    for (let i = 1; i <= 10; i++) {
      players.push(makePlayer({
        playerId: i, position: 'SS', teamId: -1, overall: 300 + i,
        rosterData: { rosterStatus: 'DRAFT_ELIGIBLE' } as Player['rosterData'],
      }));
    }

    fillRemainingRosters(players, teams);

    const fas = players.filter(p => p.rosterData.rosterStatus === 'FREE_AGENT');
    // Team 1 needs 2 SS (ideal), so 8 should be FAs
    expect(fas.length).toBe(8);
  });
});

// ─── Annual Amateur Draft Class ──────────────────────────────────────────────

describe('generateAnnualDraftClass', () => {
  it('generates the specified number of prospects', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027, 100);
    expect(prospects).toHaveLength(100);
  });

  it('defaults to 150 prospects', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027);
    expect(prospects).toHaveLength(150);
  });

  it('all prospects are DRAFT_ELIGIBLE with no team', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027, 50);
    for (const p of prospects) {
      expect(p.rosterData.rosterStatus).toBe('DRAFT_ELIGIBLE');
      expect(p.teamId).toBe(-1);
      expect(p.rosterData.isOn40Man).toBe(false);
      expect(p.rosterData.contractYearsRemaining).toBe(0);
    }
  });

  it('produces college-age (21-22) and HS-age (18-19) players', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027, 200);
    const college = prospects.filter(p => p.age >= 21 && p.age <= 22);
    const hs = prospects.filter(p => p.age >= 18 && p.age <= 19);
    // Should have a mix of both
    expect(college.length).toBeGreaterThan(0);
    expect(hs.length).toBeGreaterThan(0);
    // 60/40 split means college should outnumber HS on average
    expect(college.length).toBeGreaterThan(hs.length * 0.5);
  });

  it('HS players have higher potential than their overall', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027, 200);
    const hs = prospects.filter(p => p.age >= 18 && p.age <= 19);
    // On average, HS players should have higher potential gap
    const avgGap = hs.reduce((s, p) => s + (p.potential - p.overall), 0) / hs.length;
    expect(avgGap).toBeGreaterThan(0);
  });

  it('prospects are sorted by weighted score (OVR*0.4 + POT*0.6)', () => {
    const gen = createPRNG(42);
    const [prospects] = generateAnnualDraftClass(gen, 2027, 50);
    for (let i = 1; i < prospects.length; i++) {
      const scorePrev = prospects[i - 1].overall * 0.4 + prospects[i - 1].potential * 0.6;
      const scoreCurr = prospects[i].overall * 0.4 + prospects[i].potential * 0.6;
      expect(scorePrev).toBeGreaterThanOrEqual(scoreCurr);
    }
  });

  it('is deterministic with the same seed', () => {
    const [a] = generateAnnualDraftClass(createPRNG(99), 2027, 30);
    const [b] = generateAnnualDraftClass(createPRNG(99), 2027, 30);
    expect(a.map(p => p.overall)).toEqual(b.map(p => p.overall));
    expect(a.map(p => p.position)).toEqual(b.map(p => p.position));
  });

  it('produces different results with different seeds', () => {
    const [a] = generateAnnualDraftClass(createPRNG(1), 2027, 30);
    const [b] = generateAnnualDraftClass(createPRNG(2), 2027, 30);
    // Very unlikely to produce identical results
    expect(a.map(p => p.overall).join(',')).not.toBe(b.map(p => p.overall).join(','));
  });
});
