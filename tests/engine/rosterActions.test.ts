import { describe, it, expect } from 'vitest';
import {
  promotePlayer, demotePlayer, dfaPlayer, releasePlayer,
  countActive, count40Man, getAvailableActions,
  ACTIVE_ROSTER_LIMIT, FORTY_MAN_LIMIT,
} from '../../src/engine/rosterActions';
import type { Player } from '../../src/types/player';

// ─── Factory ────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerId: 1, teamId: 1,
    name: 'Test Player',
    firstName: 'Test',
    lastName: 'Player',
    leagueLevel: 'MLB',
    age: 26,
    position: 'SS', bats: 'R', throws: 'R',
    nationality: 'american', isPitcher: false,
    hitterAttributes: {
      contact: 350, power: 350, eye: 350, speed: 350,
      baserunningIQ: 300, fielding: 300, armStrength: 300, durability: 275,
      platoonSensitivity: 0, offensiveIQ: 300, defensiveIQ: 300,
      workEthic: 50, mentalToughness: 50,
    },
    pitcherAttributes: null,
    overall: 350, potential: 400,
    development: { theta: 0, sigma: 20, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE',
      isOn40Man: true,
      optionYearsRemaining: 2,
      optionUsedThisSeason: false,
      minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0,
      serviceTimeDays: 300,
      serviceTimeCurrentTeamDays: 300,
      rule5Selected: false,
      signedSeason: 2024, signedAge: 24,
      contractYearsRemaining: 3,
      salary: 1_000_000,
      arbitrationEligible: false,
      freeAgentEligible: false,
      hasTenAndFive: false,
    },
    ...overrides,
  };
}

// ─── promotePlayer ──────────────────────────────────────────────────────────

describe('promotePlayer', () => {
  it('promotes AAA player to MLB_ACTIVE', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AAA' } });
    const result = promotePlayer(p, 'MLB_ACTIVE', [p]);
    expect(result.ok).toBe(true);
    expect(p.rosterData.rosterStatus).toBe('MLB_ACTIVE');
    expect(p.rosterData.isOn40Man).toBe(true);
  });

  it('rejects promotion to lower level', () => {
    const p = makePlayer(); // MLB_ACTIVE
    const result = promotePlayer(p, 'MINORS_AAA', [p]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('higher');
  });

  it('rejects when active roster is full', () => {
    const existing: Player[] = [];
    for (let i = 0; i < 26; i++) {
      existing.push(makePlayer({ playerId: i }));
    }
    const prospect = makePlayer({
      playerId: 27,
      rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    });
    const result = promotePlayer(prospect, 'MLB_ACTIVE', [...existing, prospect]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('full');
  });

  it('rejects when 40-man is full and player is not on it', () => {
    const existing: Player[] = [];
    for (let i = 0; i < 40; i++) {
      existing.push(makePlayer({ playerId: i }));
    }
    const prospect = makePlayer({
      playerId: 41,
      rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: false },
    });
    // Remove enough active players so active roster isn't full
    existing.length = 20;
    for (let i = 20; i < 40; i++) {
      existing.push(makePlayer({
        playerId: i,
        rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
      }));
    }
    const result = promotePlayer(prospect, 'MLB_ACTIVE', [...existing, prospect]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('40-man');
  });
});

// ─── demotePlayer ───────────────────────────────────────────────────────────

describe('demotePlayer', () => {
  it('demotes MLB player to AAA', () => {
    const p = makePlayer();
    const result = demotePlayer(p, 'MINORS_AAA');
    expect(result.ok).toBe(true);
    expect(p.rosterData.rosterStatus).toBe('MINORS_AAA');
  });

  it('consumes an option year', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, optionYearsRemaining: 2 } });
    demotePlayer(p, 'MINORS_AAA');
    expect(p.rosterData.optionYearsRemaining).toBe(1);
    expect(p.rosterData.optionUsedThisSeason).toBe(true);
  });

  it('does not double-consume options in same season', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, optionYearsRemaining: 2, optionUsedThisSeason: true } });
    demotePlayer(p, 'MINORS_AAA');
    // Should still be 2 because optionUsedThisSeason was already true
    expect(p.rosterData.optionYearsRemaining).toBe(2);
  });

  it('rejects demotion when no options remain for veteran', () => {
    const p = makePlayer({
      rosterData: {
        ...makePlayer().rosterData,
        optionYearsRemaining: 0,
        serviceTimeDays: 172 * 3, // 3 years
      },
    });
    const result = demotePlayer(p, 'MINORS_AAA');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('option');
  });

  it('increments demotionsThisSeason', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, demotionsThisSeason: 1 } });
    demotePlayer(p, 'MINORS_AAA');
    expect(p.rosterData.demotionsThisSeason).toBe(2);
  });
});

// ─── dfaPlayer ──────────────────────────────────────────────────────────────

describe('dfaPlayer', () => {
  it('DFAs an active player', () => {
    const p = makePlayer();
    const result = dfaPlayer(p);
    expect(result.ok).toBe(true);
    expect(p.rosterData.rosterStatus).toBe('DFA');
    expect(p.rosterData.isOn40Man).toBe(false);
  });

  it('rejects DFA of already-DFA player', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, rosterStatus: 'DFA' } });
    const result = dfaPlayer(p);
    expect(result.ok).toBe(false);
  });

  it('rejects DFA of free agent', () => {
    const p = makePlayer({ rosterData: { ...makePlayer().rosterData, rosterStatus: 'FREE_AGENT' } });
    const result = dfaPlayer(p);
    expect(result.ok).toBe(false);
  });
});

// ─── releasePlayer ──────────────────────────────────────────────────────────

describe('releasePlayer', () => {
  it('releases an active player', () => {
    const p = makePlayer();
    const result = releasePlayer(p);
    expect(result.ok).toBe(true);
    expect(p.rosterData.rosterStatus).toBe('FREE_AGENT');
    expect(p.rosterData.isOn40Man).toBe(false);
    expect(p.teamId).toBe(-1);
  });

  it('rejects release of already-free-agent', () => {
    const p = makePlayer({
      teamId: -1,
      rosterData: { ...makePlayer().rosterData, rosterStatus: 'FREE_AGENT' },
    });
    const result = releasePlayer(p);
    expect(result.ok).toBe(false);
  });
});

// ─── Counting helpers ───────────────────────────────────────────────────────

describe('countActive / count40Man', () => {
  it('counts active players correctly', () => {
    const players = [
      makePlayer({ playerId: 1, teamId: 1 }),
      makePlayer({ playerId: 2, teamId: 1 }),
      makePlayer({ playerId: 3, teamId: 2 }),
    ];
    expect(countActive(players, 1)).toBe(2);
    expect(countActive(players, 2)).toBe(1);
  });

  it('counts 40-man players correctly', () => {
    const players = [
      makePlayer({ playerId: 1, teamId: 1 }),
      makePlayer({ playerId: 2, teamId: 1, rosterData: { ...makePlayer().rosterData, isOn40Man: false } }),
    ];
    expect(count40Man(players, 1)).toBe(1);
  });
});

// ─── getAvailableActions ────────────────────────────────────────────────────

describe('getAvailableActions', () => {
  it('offers promote, demote, dfa, release for AAA player', () => {
    const p = makePlayer({
      rosterData: { ...makePlayer().rosterData, rosterStatus: 'MINORS_AAA', isOn40Man: true },
    });
    const actions = getAvailableActions(p, [p]);
    expect(actions.map(a => a.action)).toContain('promote');
    expect(actions.map(a => a.action)).toContain('demote');
    expect(actions.map(a => a.action)).toContain('dfa');
    expect(actions.map(a => a.action)).toContain('release');
  });

  it('offers demote and dfa for MLB_ACTIVE player', () => {
    const p = makePlayer();
    const actions = getAvailableActions(p, [p]);
    expect(actions.map(a => a.action)).toContain('demote');
    expect(actions.map(a => a.action)).toContain('dfa');
    expect(actions.map(a => a.action)).toContain('release');
  });
});

// ─── Constants ──────────────────────────────────────────────────────────────

describe('roster limits', () => {
  it('ACTIVE_ROSTER_LIMIT is 26', () => {
    expect(ACTIVE_ROSTER_LIMIT).toBe(26);
  });
  it('FORTY_MAN_LIMIT is 40', () => {
    expect(FORTY_MAN_LIMIT).toBe(40);
  });
});
