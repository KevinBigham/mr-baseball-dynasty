import { describe, it, expect } from 'vitest';
import { extractPersonalityInput, extractPersonalityInputs } from '../../src/engine/personalityBridge';
import type { Player } from '../../src/types/player';

/** Minimal Player factory for testing. */
function makePlayer(overrides: Partial<Player> & { workEthic?: number; mentalToughness?: number; isPitcher?: boolean }): Player {
  const isPitcher = overrides.isPitcher ?? false;
  const workEthic = overrides.workEthic ?? 60;
  const mentalToughness = overrides.mentalToughness ?? 55;

  const hitterAttrs = !isPitcher
    ? {
        contact: 300, power: 280, eye: 260, speed: 240,
        baserunningIQ: 250, fielding: 270, armStrength: 260,
        durability: 300, platoonSensitivity: 0,
        offensiveIQ: 280, defensiveIQ: 270,
        workEthic,
        mentalToughness,
      }
    : null;

  const pitcherAttrs = isPitcher
    ? {
        stuff: 350, movement: 320, command: 300, stamina: 280,
        pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 250,
        durability: 300, recoveryRate: 280, platoonTendency: 0,
        pitchTypeMix: { fastball: 0.55, breaking: 0.25, offspeed: 0.20 },
        pitchingIQ: 290,
        workEthic,
        mentalToughness,
      }
    : null;

  return {
    playerId: 1,
    teamId: 1,
    name: 'Test Player',
    firstName: 'Test',
    lastName: 'Player',
    age: 28,
    position: 'SS',
    bats: 'R',
    throws: 'R',
    nationality: 'american',
    leagueLevel: 'MLB',
    isPitcher,
    hitterAttributes: hitterAttrs,
    pitcherAttributes: pitcherAttrs,
    overall: 400,
    potential: 450,
    development: { theta: 0, sigma: 0.1, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 2,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 500,
      serviceTimeCurrentTeamDays: 500,
      rule5Selected: false,
      signedSeason: 2024,
      signedAge: 26,
      contractYearsRemaining: 3,
      salary: 5_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
    // Re-apply attributes after spread to avoid override conflicts
  } as Player;
}

describe('personalityBridge — extractPersonalityInput', () => {
  it('extracts correct fields from a hitter', () => {
    const player = makePlayer({ workEthic: 80, mentalToughness: 70, age: 32, isPitcher: false });
    // Override age since makePlayer sets it
    player.age = 32;
    player.overall = 420;
    player.position = '3B';

    const input = extractPersonalityInput(player);

    expect(input.workEthic).toBe(80);
    expect(input.mentalToughness).toBe(70);
    expect(input.age).toBe(32);
    expect(input.overall).toBe(420);
    expect(input.position).toBe('3B');
  });

  it('extracts correct fields from a pitcher', () => {
    const player = makePlayer({ workEthic: 45, mentalToughness: 90, isPitcher: true });
    player.age = 25;
    player.overall = 380;
    player.position = 'SP';

    const input = extractPersonalityInput(player);

    expect(input.workEthic).toBe(45);
    expect(input.mentalToughness).toBe(90);
    expect(input.age).toBe(25);
    expect(input.overall).toBe(380);
    expect(input.position).toBe('SP');
  });

  it('defaults to 50 when attribute block is null', () => {
    const player = makePlayer({});
    // Force both attribute blocks to null (edge case)
    player.hitterAttributes = null;
    player.pitcherAttributes = null;

    const input = extractPersonalityInput(player);

    expect(input.workEthic).toBe(50);
    expect(input.mentalToughness).toBe(50);
  });

  it('uses pitcherAttributes when isPitcher is true', () => {
    const player = makePlayer({ workEthic: 85, mentalToughness: 30, isPitcher: true });

    const input = extractPersonalityInput(player);

    expect(input.workEthic).toBe(85);
    expect(input.mentalToughness).toBe(30);
  });
});

describe('personalityBridge — extractPersonalityInputs (batch)', () => {
  it('returns one input per player', () => {
    const players = [
      makePlayer({ workEthic: 70, mentalToughness: 80 }),
      makePlayer({ workEthic: 20, mentalToughness: 25, isPitcher: true }),
      makePlayer({ workEthic: 55, mentalToughness: 65 }),
    ];

    const inputs = extractPersonalityInputs(players);

    expect(inputs).toHaveLength(3);
    expect(inputs[0].workEthic).toBe(70);
    expect(inputs[1].workEthic).toBe(20);
    expect(inputs[2].workEthic).toBe(55);
  });

  it('handles empty roster', () => {
    expect(extractPersonalityInputs([])).toEqual([]);
  });
});
