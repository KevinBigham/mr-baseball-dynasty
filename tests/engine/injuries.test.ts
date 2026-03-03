import { describe, it, expect } from 'vitest';
import { injuryProbability, processSeasonInjuries } from '../../src/engine/injuries';
import type { Player } from '../../src/types/player';

// ─── Mock player builder ─────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Player',
    age: 28,
    position: 'CF',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    isPitcher: false,
    hitterAttributes: {
      contact: 350, power: 350, eye: 350, speed: 350,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 275,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 350,
    potential: 400,
    development: { theta: 0, sigma: 20, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 1,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 2,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  };
}

function makePitcherPlayer(overrides: Partial<Player> = {}): Player {
  return makePlayer({
    isPitcher: true,
    position: 'SP',
    hitterAttributes: null,
    pitcherAttributes: {
      stuff: 350, movement: 350, command: 350, stamina: 350,
      pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 275,
      durability: 275, recoveryRate: 300, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.5, breaking: 0.3, offspeed: 0.2 },
      pitchingIQ: 300, workEthic: 50, mentalToughness: 50,
    },
    ...overrides,
  });
}

// ─── injuryProbability tests ─────────────────────────────────────────────────

describe('injuryProbability — durability factor', () => {
  it('returns a number between 0 and 1', () => {
    const prob = injuryProbability(makePlayer());
    expect(prob).toBeGreaterThan(0);
    expect(prob).toBeLessThan(1);
  });

  it('higher durability = lower injury probability', () => {
    const fragile = makePlayer({
      hitterAttributes: {
        contact: 350, power: 350, eye: 350, speed: 350,
        baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 50,
        platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
        workEthic: 50, mentalToughness: 50,
      },
    });
    const durable = makePlayer({
      hitterAttributes: {
        contact: 350, power: 350, eye: 350, speed: 350,
        baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 500,
        platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
        workEthic: 50, mentalToughness: 50,
      },
    });
    expect(injuryProbability(fragile)).toBeGreaterThan(injuryProbability(durable));
  });

  it('max durability (550) produces lowest base rate', () => {
    const ironman = makePlayer({
      hitterAttributes: {
        contact: 350, power: 350, eye: 350, speed: 350,
        baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 550,
        platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
        workEthic: 50, mentalToughness: 50,
      },
    });
    // With max durability: durabilityFactor = 1.0 - (550/550)*0.7 = 0.3
    // baseRate * 0.3 * 1.0 (no age) * 1.0 (not pitcher) = 0.0006
    const prob = injuryProbability(ironman);
    expect(prob).toBeCloseTo(0.0006, 4);
  });
});

describe('injuryProbability — age factor', () => {
  it('players under 30 have no age penalty', () => {
    const young = makePlayer({ age: 25 });
    const almost30 = makePlayer({ age: 30 });
    expect(injuryProbability(young)).toBe(injuryProbability(almost30));
  });

  it('players over 30 have increasing injury risk', () => {
    const age30 = makePlayer({ age: 30 });
    const age35 = makePlayer({ age: 35 });
    const age40 = makePlayer({ age: 40 });
    expect(injuryProbability(age35)).toBeGreaterThan(injuryProbability(age30));
    expect(injuryProbability(age40)).toBeGreaterThan(injuryProbability(age35));
  });

  it('age 35 has 25% more risk than age 30', () => {
    const age30 = makePlayer({ age: 30 });
    const age35 = makePlayer({ age: 35 });
    const ratio = injuryProbability(age35) / injuryProbability(age30);
    expect(ratio).toBeCloseTo(1.25, 2);
  });
});

describe('injuryProbability — pitcher factor', () => {
  it('pitchers have 30% higher injury risk than hitters', () => {
    const hitter = makePlayer();
    const pitcher = makePitcherPlayer();
    const ratio = injuryProbability(pitcher) / injuryProbability(hitter);
    expect(ratio).toBeCloseTo(1.3, 2);
  });
});

// ─── processSeasonInjuries tests ─────────────────────────────────────────────

describe('processSeasonInjuries — basic behavior', () => {
  it('returns an array of injury events', () => {
    const players = [makePlayer(), makePitcherPlayer({ playerId: 2 })];
    const events = processSeasonInjuries(players, 2430, 42, 2026);
    expect(Array.isArray(events)).toBe(true);
  });

  it('only injures MLB_ACTIVE players', () => {
    const minorLeaguer = makePlayer({
      playerId: 3,
      rosterData: {
        ...makePlayer().rosterData,
        rosterStatus: 'MINORS_AAA',
      },
    });
    const events = processSeasonInjuries([minorLeaguer], 2430, 42, 2026);
    expect(events.length).toBe(0);
  });

  it('is deterministic — same seed produces same injuries', () => {
    const players1 = Array.from({ length: 20 }, (_, i) => makePlayer({ playerId: i + 1, teamId: 1 }));
    const players2 = Array.from({ length: 20 }, (_, i) => makePlayer({ playerId: i + 1, teamId: 1 }));
    const events1 = processSeasonInjuries(players1, 2430, 42, 2026);
    const events2 = processSeasonInjuries(players2, 2430, 42, 2026);
    expect(events1.length).toBe(events2.length);
    for (let i = 0; i < events1.length; i++) {
      expect(events1[i].playerId).toBe(events2[i].playerId);
      expect(events1[i].injury.type).toBe(events2[i].injury.type);
    }
  });

  it('different seeds produce different results', () => {
    const makePlayers = () => Array.from({ length: 50 }, (_, i) => makePlayer({ playerId: i + 1, teamId: 1 }));
    const events1 = processSeasonInjuries(makePlayers(), 2430, 1, 2026);
    const events2 = processSeasonInjuries(makePlayers(), 2430, 9999, 2026);
    // Very unlikely to produce identical results with 50 players
    const ids1 = events1.map(e => `${e.playerId}-${e.injury.type}`).join(',');
    const ids2 = events2.map(e => `${e.playerId}-${e.injury.type}`).join(',');
    expect(ids1).not.toBe(ids2);
  });
});

describe('processSeasonInjuries — IL status changes', () => {
  it('places injured players on IL', () => {
    // Use a fragile player to increase chance of at least one injury
    const players = Array.from({ length: 30 }, (_, i) => makePlayer({
      playerId: i + 1,
      teamId: 1,
      hitterAttributes: {
        contact: 350, power: 350, eye: 350, speed: 350,
        baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 30,
        platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
        workEthic: 50, mentalToughness: 50,
      },
    }));
    const events = processSeasonInjuries(players, 2430, 42, 2026);

    // With 30 fragile players over 162 game days, we should get at least a few injuries
    expect(events.length).toBeGreaterThan(0);

    // Check that injury events have valid structure
    for (const event of events) {
      expect(event.injury.type).toBeTruthy();
      expect(event.injury.severity).toMatch(/^(minor|moderate|severe)$/);
      expect(event.injury.ilDays).toBeGreaterThan(0);
      expect(event.injury.season).toBe(2026);
      expect(event.playerName).toBeTruthy();
    }
  });

  it('recovers players whose IL stint expires', () => {
    // Create a player, manually put on IL with 5 days remaining
    const player = makePlayer({
      playerId: 1,
      rosterData: {
        ...makePlayer().rosterData,
        rosterStatus: 'MLB_IL_10',
        currentInjury: {
          type: 'Hamstring tightness',
          description: 'Test injury',
          severity: 'minor',
          ilDays: 10,
          recoveryDaysRemaining: 5,
          gameInjured: 0,
          season: 2026,
        },
      },
    });
    // Use seed that won't cause a new injury on this player
    processSeasonInjuries([player], 2430, 42, 2026);
    // After processing 162 game days with only 5 recovery days,
    // the player should have recovered
    expect(player.rosterData.currentInjury).toBeUndefined();
    // Player should be back to active
    expect(player.rosterData.rosterStatus).toBe('MLB_ACTIVE');
  });
});
