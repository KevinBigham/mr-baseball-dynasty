import { describe, it, expect } from 'vitest';
import { applyDevProgram, getProgramsForPlayer, DEV_PROGRAMS } from '../../src/engine/devPrograms';
import type { Player } from '../../src/types/player';

function makePlayer(isPitcher: boolean): Player {
  return {
    playerId: 1, teamId: 1, name: 'Test', firstName: 'T', lastName: 'P',
    age: 22, position: isPitcher ? 'SP' : 'SS', bats: 'R', throws: 'R',
    nationality: 'american', isPitcher,
    hitterAttributes: isPitcher ? null : {
      contact: 300, power: 300, eye: 300, speed: 300,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 300,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: isPitcher ? {
      stuff: 300, movement: 300, command: 300, stamina: 300,
      pitchArsenalCount: 4, gbFbTendency: 50, holdRunners: 275,
      durability: 300, recoveryRate: 300, platoonTendency: 0,
      pitchTypeMix: { fastball: 0.5, breaking: 0.3, offspeed: 0.2 },
      pitchingIQ: 300, workEthic: 50, mentalToughness: 50,
    } : null,
    overall: 300, potential: 400,
    development: { theta: 0, sigma: 0, phase: 'prospect' },
    rosterData: {
      rosterStatus: 'MINORS_AA', isOn40Man: false,
      optionYearsRemaining: 3, optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0, demotionsThisSeason: 0,
      serviceTimeDays: 0, serviceTimeCurrentTeamDays: 0,
      rule5Selected: false, signedSeason: 2024, signedAge: 20,
      contractYearsRemaining: 6, salary: 700_000,
      arbitrationEligible: false, freeAgentEligible: false,
      hasTenAndFive: false,
    },
  } as Player;
}

describe('getProgramsForPlayer', () => {
  it('returns hitter programs + balanced for position players', () => {
    const programs = getProgramsForPlayer(false);
    expect(programs.some(p => p.id === 'power_focus')).toBe(true);
    expect(programs.some(p => p.id === 'contact_focus')).toBe(true);
    expect(programs.some(p => p.id === 'balanced')).toBe(true);
    expect(programs.some(p => p.id === 'stuff_development')).toBe(false);
  });

  it('returns pitcher programs + balanced for pitchers', () => {
    const programs = getProgramsForPlayer(true);
    expect(programs.some(p => p.id === 'stuff_development')).toBe(true);
    expect(programs.some(p => p.id === 'command_work')).toBe(true);
    expect(programs.some(p => p.id === 'balanced')).toBe(true);
    expect(programs.some(p => p.id === 'power_focus')).toBe(false);
  });
});

describe('applyDevProgram', () => {
  it('boosts the target attribute for a hitter', () => {
    const player = makePlayer(false);
    const result = applyDevProgram(player, 'power_focus');
    expect(result).not.toBeNull();
    expect(result!.boosted).toBe('power');
    expect(player.hitterAttributes!.power).toBe(307); // 300 + 7
    expect(player.hitterAttributes!.contact).toBe(298); // 300 - 2
  });

  it('boosts the target attribute for a pitcher', () => {
    const player = makePlayer(true);
    const result = applyDevProgram(player, 'stuff_development');
    expect(result).not.toBeNull();
    expect(result!.boosted).toBe('stuff');
    expect(player.pitcherAttributes!.stuff).toBe(307);
    expect(player.pitcherAttributes!.command).toBe(298);
  });

  it('returns null for balanced program', () => {
    const player = makePlayer(false);
    const result = applyDevProgram(player, 'balanced');
    expect(result).toBeNull();
  });

  it('rejects pitcher program for a hitter', () => {
    const player = makePlayer(false);
    const result = applyDevProgram(player, 'stuff_development');
    expect(result).toBeNull();
  });

  it('rejects hitter program for a pitcher', () => {
    const player = makePlayer(true);
    const result = applyDevProgram(player, 'power_focus');
    expect(result).toBeNull();
  });

  it('clamps boost at 550 max', () => {
    const player = makePlayer(false);
    player.hitterAttributes!.power = 548;
    applyDevProgram(player, 'power_focus');
    expect(player.hitterAttributes!.power).toBe(550);
  });

  it('clamps penalty at 0 min', () => {
    const player = makePlayer(false);
    player.hitterAttributes!.contact = 1;
    applyDevProgram(player, 'power_focus');
    expect(player.hitterAttributes!.contact).toBe(0);
  });
});

describe('DEV_PROGRAMS', () => {
  it('has 10 programs total', () => {
    expect(DEV_PROGRAMS.length).toBe(10);
  });

  it('every non-balanced program has a boost and penalty', () => {
    for (const p of DEV_PROGRAMS) {
      if (p.id === 'balanced') continue;
      expect(p.boostAttr).toBeTruthy();
      expect(p.penaltyAttr).toBeTruthy();
      expect(p.boostAmount).toBeGreaterThan(0);
      expect(p.penaltyAmount).toBeLessThan(0);
    }
  });
});
