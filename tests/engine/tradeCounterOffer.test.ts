import { describe, it, expect } from 'vitest';
import { proposeCounterOffer, type TradePackage, type TradeReputation } from '../../src/ai/tradeAI';
import type { Player } from '../../src/types/player';
import { createPRNG } from '../../src/engine/math/prng';

function makePlayer(id: number, teamId: number, overall: number, potential: number, age = 26): Player {
  return {
    playerId: id,
    teamId,
    name: `Player ${id}`,
    firstName: 'P',
    lastName: `${id}`,
    age,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: {
      contact: overall, power: overall, eye: overall, speed: overall,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 300,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall,
    potential,
    development: { theta: 0, sigma: 25, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 3,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 24,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
  } as Player;
}

describe('proposeCounterOffer — trade negotiation', () => {
  const emptyStrategies = new Map();
  const emptyProfiles = new Map();
  const emptyReputations = new Map<number, TradeReputation>();
  const gen = createPRNG(42);

  it('accepts a fair deal without changes', () => {
    const p1 = makePlayer(1, 10, 400, 450); // user offers good player
    const p2 = makePlayer(2, 20, 380, 420); // AI gives similar player
    const playerMap = new Map([[1, p1], [2, p2]]);

    const pkg: TradePackage = { fromTeamId: 10, toTeamId: 20, playersOffered: [1], playersRequested: [2] };
    const [result] = proposeCounterOffer(pkg, playerMap, emptyStrategies, emptyProfiles, emptyReputations, gen);

    expect(result.evaluation.accepted).toBe(true);
    expect(result.changed).toBe(false);
  });

  it('rejects a wildly unfair deal', () => {
    const p1 = makePlayer(1, 10, 150, 200); // user offers scrub
    const p2 = makePlayer(2, 20, 500, 500); // AI gives superstar
    const playerMap = new Map([[1, p1], [2, p2]]);

    const pkg: TradePackage = { fromTeamId: 10, toTeamId: 20, playersOffered: [1], playersRequested: [2] };
    const [result] = proposeCounterOffer(pkg, playerMap, emptyStrategies, emptyProfiles, emptyReputations, gen);

    expect(result.evaluation.accepted).toBe(false);
    expect(result.changed).toBe(false);
    expect(result.evaluation.reason).toContain('too large');
  });

  it('counters a close-but-not-fair deal by adding a prospect', () => {
    const p1 = makePlayer(1, 10, 300, 350); // user offers decent player
    const p2 = makePlayer(2, 20, 420, 450); // AI gives better player
    // Prospect with value close to the gap
    const prospect = makePlayer(3, 10, 250, 300, 23);
    prospect.rosterData.rosterStatus = 'MINORS_AAA';
    const playerMap = new Map([[1, p1], [2, p2], [3, prospect]]);

    const pkg: TradePackage = { fromTeamId: 10, toTeamId: 20, playersOffered: [1], playersRequested: [2] };
    const [result] = proposeCounterOffer(pkg, playerMap, emptyStrategies, emptyProfiles, emptyReputations, gen);

    expect(result.changed).toBe(true);
    expect(result.package.playersOffered.length).toBeGreaterThan(1);
    expect(result.package.playersOffered).toContain(3); // Prospect was added
  });

  it('does not add 10-and-5 players to counter', () => {
    const p1 = makePlayer(1, 10, 300, 350);
    const p2 = makePlayer(2, 20, 400, 420);
    const veteran = makePlayer(3, 10, 350, 370, 34);
    veteran.rosterData.hasTenAndFive = true;
    const playerMap = new Map([[1, p1], [2, p2], [3, veteran]]);

    const pkg: TradePackage = { fromTeamId: 10, toTeamId: 20, playersOffered: [1], playersRequested: [2] };
    const [result] = proposeCounterOffer(pkg, playerMap, emptyStrategies, emptyProfiles, emptyReputations, gen);

    // 10-and-5 player should NOT be in the counter
    expect(result.package.playersOffered).not.toContain(3);
  });
});
