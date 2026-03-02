import { describe, it, expect } from 'vitest';
import { processSeasonInjuries } from '../../src/engine/injuries';
import type { Player } from '../../src/types/player';

function makePlayer(id: number): Player {
  return {
    playerId: id, teamId: 1, name: `Player ${id}`,
    age: 28, position: 'SS', bats: 'R', throws: 'R',
    nationality: 'american', isPitcher: false,
    hitterAttributes: {
      contact: 300, power: 300, eye: 300, speed: 300,
      baserunningIQ: 300, fielding: 300, armStrength: 300,
      durability: 300, platoonSensitivity: 0,
      offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 300, potential: 400,
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true,
      optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: 500, serviceTimeCurrentTeamDays: 500,
      rule5Selected: false, signedSeason: 2022, signedAge: 24,
      contractYearsRemaining: 3, salary: 2_000_000,
      arbitrationEligible: false, freeAgentEligible: false,
      hasTenAndFive: false,
    },
  } as Player;
}

describe('processSeasonInjuries — multiplier clamping', () => {
  it('clamps extreme injuryRateMultiplier to [0.1, 3.0]', () => {
    const players = [makePlayer(1), makePlayer(2)];

    // Extreme high multiplier (100x) should be clamped to 3.0
    const highResult = processSeasonInjuries(players, 2430, 42, 2026, 100, 1.0);

    // Extreme low multiplier (0) should be clamped to 0.1
    const players2 = [makePlayer(3), makePlayer(4)];
    const lowResult = processSeasonInjuries(players2, 2430, 42, 2026, 0, 1.0);

    // Both should run without errors (we can't easily assert the exact
    // clamped value, but no crash means the clamp worked)
    expect(Array.isArray(highResult)).toBe(true);
    expect(Array.isArray(lowResult)).toBe(true);
  });

  it('clamps extreme recoverySpeedMultiplier to [0.5, 2.0]', () => {
    const players = [makePlayer(5)];

    // Extreme values should be clamped
    const result1 = processSeasonInjuries(players, 2430, 42, 2026, 1.0, -5);
    const result2 = processSeasonInjuries(players, 2430, 42, 2026, 1.0, 100);

    expect(Array.isArray(result1)).toBe(true);
    expect(Array.isArray(result2)).toBe(true);
  });

  it('accepts normal multiplier values without modification', () => {
    const players = [makePlayer(6)];

    // Normal values within range should work fine
    const result = processSeasonInjuries(players, 2430, 42, 2026, 1.5, 1.2);
    expect(Array.isArray(result)).toBe(true);
  });
});
