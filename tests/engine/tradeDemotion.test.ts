import { describe, it, expect } from 'vitest';
import { executeTrade } from '../../src/engine/trading';
import type { Player } from '../../src/types/player';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1, teamId: 1, name: 'Test Player',
    age: 27, position: 'SS', bats: 'R', throws: 'R',
    nationality: 'american', isPitcher: false,
    hitterAttributes: {
      contactL: 300, contactR: 300, powerL: 300, powerR: 300,
      patience: 300, speed: 300, baserunningIQ: 300,
      fielding: 300, armStrength: 300,
      offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 350, potential: 400,
    development: { theta: 0, sigma: 0, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true,
      optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: 1000, serviceTimeCurrentTeamDays: 500,
      rule5Selected: false, signedSeason: 2020, signedAge: 21,
      contractYearsRemaining: 3, salary: 5_000_000,
      arbitrationEligible: false, freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  } as Player;
}

describe('executeTrade — roster status preservation', () => {
  it('preserves MLB_ACTIVE status after trade', () => {
    const userPlayer = makePlayer({ playerId: 1, teamId: 1, name: 'User Star' });
    const partnerPlayer = makePlayer({ playerId: 2, teamId: 2, name: 'Partner Star' });
    userPlayer.rosterData.rosterStatus = 'MLB_ACTIVE';
    partnerPlayer.rosterData.rosterStatus = 'MLB_ACTIVE';

    const players = [userPlayer, partnerPlayer];
    const result = executeTrade(players, 1, 2, [1], [2]);

    expect(result.ok).toBe(true);
    expect(userPlayer.rosterData.rosterStatus).toBe('MLB_ACTIVE');
    expect(partnerPlayer.rosterData.rosterStatus).toBe('MLB_ACTIVE');
  });

  it('preserves MINORS_AAA status after trade', () => {
    const userPlayer = makePlayer({ playerId: 1, teamId: 1 });
    const partnerPlayer = makePlayer({ playerId: 2, teamId: 2 });
    userPlayer.rosterData.rosterStatus = 'MINORS_AAA';
    partnerPlayer.rosterData.rosterStatus = 'MINORS_AAA';

    const players = [userPlayer, partnerPlayer];
    const result = executeTrade(players, 1, 2, [1], [2]);

    expect(result.ok).toBe(true);
    expect(userPlayer.rosterData.rosterStatus).toBe('MINORS_AAA');
    expect(partnerPlayer.rosterData.rosterStatus).toBe('MINORS_AAA');
  });

  it('sets isOn40Man for incoming players', () => {
    const userPlayer = makePlayer({ playerId: 1, teamId: 1 });
    const partnerPlayer = makePlayer({ playerId: 2, teamId: 2 });
    partnerPlayer.rosterData.isOn40Man = false;

    const players = [userPlayer, partnerPlayer];
    const result = executeTrade(players, 1, 2, [1], [2]);

    expect(result.ok).toBe(true);
    // Partner player incoming to user team gets isOn40Man set
    expect(partnerPlayer.rosterData.isOn40Man).toBe(true);
    // Team assignments swapped
    expect(userPlayer.teamId).toBe(2);
    expect(partnerPlayer.teamId).toBe(1);
  });
});
