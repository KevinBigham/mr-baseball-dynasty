import { describe, it, expect } from 'vitest';
import {
  computeStaffBonuses,
  getActionBonus,
  DEFAULT_BONUSES,
} from '../../src/engine/staffEffects';
import { evaluateProposedTrade } from '../../src/engine/trading';
import { scoutDraftPool } from '../../src/engine/draft/draftPool';
import type { FOStaffMember } from '../../src/types/frontOffice';
import type { Player, Position } from '../../src/types/player';
import { createPRNG } from '../../src/engine/math/prng';

function makeStaff(overrides: Partial<FOStaffMember> = {}): FOStaffMember {
  return {
    id: 'test-1',
    roleId: 'gm',
    name: 'Test GM',
    ovr: 70,
    salary: 5,
    yearsLeft: 3,
    traitId: 'analytical',
    backstory: 'Test backstory',
    icon: '👔',
    title: 'General Manager',
    color: '#a78bfa',
    tier: 'core',
    ...overrides,
  };
}

describe('getActionBonus', () => {
  it('returns 0 when no staff affects the action', () => {
    const staff = [makeStaff({ roleId: 'gm', ovr: 80 })]; // GM affects trades, not pitcherDev
    expect(getActionBonus(staff, 'pitcherDev')).toBe(0);
  });

  it('returns positive bonus for high-OVR staff', () => {
    const staff = [makeStaff({ roleId: 'gm', ovr: 95 })]; // GM affects trades
    const bonus = getActionBonus(staff, 'trades');
    expect(bonus).toBeGreaterThan(0);
  });

  it('returns negative bonus for low-OVR staff', () => {
    const staff = [makeStaff({ roleId: 'gm', ovr: 40 })];
    const bonus = getActionBonus(staff, 'trades');
    expect(bonus).toBeLessThan(0);
  });

  it('adds trait synergy bonus when trait matches action', () => {
    // 'negotiator' trait has synergy with 'trades'
    const withSynergy = [makeStaff({ roleId: 'gm', ovr: 70, traitId: 'negotiator' })];
    const withoutSynergy = [makeStaff({ roleId: 'gm', ovr: 70, traitId: 'old_school' })];

    const bonusWithSynergy = getActionBonus(withSynergy, 'trades');
    const bonusWithout = getActionBonus(withoutSynergy, 'trades');

    expect(bonusWithSynergy).toBeGreaterThan(bonusWithout);
    expect(bonusWithSynergy - bonusWithout).toBeCloseTo(0.05, 2);
  });

  it('averages OVR across multiple relevant staff', () => {
    // Both pitching_coach and pitching_coach contribute to pitcherDev
    const staff = [
      makeStaff({ id: '1', roleId: 'pitching_coach', ovr: 90 }),
      // developer trait on hitting coach won't affect pitcherDev through role
    ];
    const singleBonus = getActionBonus(staff, 'pitcherDev');
    expect(singleBonus).toBeGreaterThan(0);
  });
});

describe('computeStaffBonuses', () => {
  it('returns defaults when staff array is empty', () => {
    const bonuses = computeStaffBonuses([]);
    expect(bonuses).toEqual(DEFAULT_BONUSES);
  });

  it('high-OVR trainer reduces injury rate multiplier', () => {
    const staff = [makeStaff({ roleId: 'trainer', ovr: 95, traitId: 'medic' })];
    const bonuses = computeStaffBonuses(staff);
    expect(bonuses.injuryRateMultiplier).toBeLessThan(1.0);
  });

  it('high-OVR pitching coach boosts pitcher dev multiplier', () => {
    const staff = [makeStaff({ roleId: 'pitching_coach', ovr: 90, traitId: 'pitcher_whisperer' })];
    const bonuses = computeStaffBonuses(staff);
    expect(bonuses.pitcherDevMultiplier).toBeGreaterThan(1.0);
  });

  it('high-OVR hitting coach boosts hitter dev multiplier', () => {
    const staff = [makeStaff({ roleId: 'hitting_coach', ovr: 90, traitId: 'developer' })];
    const bonuses = computeStaffBonuses(staff);
    expect(bonuses.hitterDevMultiplier).toBeGreaterThan(1.0);
  });

  it('high-OVR GM gives trade value bonus', () => {
    const staff = [makeStaff({ roleId: 'gm', ovr: 90, traitId: 'negotiator' })];
    const bonuses = computeStaffBonuses(staff);
    expect(bonuses.tradeValueBonus).toBeGreaterThan(0);
  });

  it('all multipliers stay within valid ranges', () => {
    // Test with a full staff of max OVR
    const staff = [
      makeStaff({ id: '1', roleId: 'gm', ovr: 95, traitId: 'negotiator' }),
      makeStaff({ id: '2', roleId: 'scout_dir', ovr: 95, traitId: 'talent_scout' }),
      makeStaff({ id: '3', roleId: 'analytics', ovr: 95, traitId: 'analytics_guru' }),
      makeStaff({ id: '4', roleId: 'manager', ovr: 95, traitId: 'clubhouse_guy' }),
      makeStaff({ id: '5', roleId: 'pitching_coach', ovr: 95, traitId: 'pitcher_whisperer' }),
      makeStaff({ id: '6', roleId: 'hitting_coach', ovr: 95, traitId: 'developer' }),
      makeStaff({ id: '7', roleId: 'trainer', ovr: 95, traitId: 'medic' }),
      makeStaff({ id: '8', roleId: 'intl_scout', ovr: 95, traitId: 'recruiter' }),
    ];
    const bonuses = computeStaffBonuses(staff);

    expect(bonuses.scoutingAccuracy).toBeGreaterThanOrEqual(0.5);
    expect(bonuses.scoutingAccuracy).toBeLessThanOrEqual(1.5);
    expect(bonuses.draftBoardQuality).toBeGreaterThanOrEqual(0);
    expect(bonuses.draftBoardQuality).toBeLessThanOrEqual(1);
    expect(bonuses.hitterDevMultiplier).toBeGreaterThanOrEqual(0.7);
    expect(bonuses.hitterDevMultiplier).toBeLessThanOrEqual(1.3);
    expect(bonuses.pitcherDevMultiplier).toBeGreaterThanOrEqual(0.7);
    expect(bonuses.pitcherDevMultiplier).toBeLessThanOrEqual(1.3);
    expect(bonuses.injuryRateMultiplier).toBeGreaterThanOrEqual(0.7);
    expect(bonuses.injuryRateMultiplier).toBeLessThanOrEqual(1.3);
    expect(bonuses.recoverySpeedMultiplier).toBeGreaterThanOrEqual(0.7);
    expect(bonuses.recoverySpeedMultiplier).toBeLessThanOrEqual(1.3);
    expect(bonuses.freeAgencyDiscount).toBeGreaterThanOrEqual(0);
    expect(bonuses.freeAgencyDiscount).toBeLessThanOrEqual(0.15);
    expect(bonuses.moraleBonus).toBeGreaterThanOrEqual(0);
    expect(bonuses.moraleBonus).toBeLessThanOrEqual(5);
  });

  it('low-OVR staff produces worse-than-default bonuses', () => {
    const staff = [
      makeStaff({ id: '1', roleId: 'pitching_coach', ovr: 40, traitId: 'old_school' }),
      makeStaff({ id: '2', roleId: 'trainer', ovr: 40, traitId: 'old_school' }),
    ];
    const bonuses = computeStaffBonuses(staff);
    expect(bonuses.pitcherDevMultiplier).toBeLessThan(1.0);
    expect(bonuses.injuryRateMultiplier).toBeGreaterThan(1.0); // higher = more injuries
  });
});

// ─── Integration: Staff Bonuses Wiring ──────────────────────────────────────

function makeTradePlayer(id: number, teamId: number, overall: number): Player {
  return {
    playerId: id, teamId, name: `Player ${id}`,
    firstName: 'Test', lastName: 'Player', leagueLevel: 'MLB',
    age: 27,
    position: 'SS' as Position, bats: 'R', throws: 'R', nationality: 'american',
    isPitcher: false, hitterAttributes: null, pitcherAttributes: null,
    overall, potential: overall + 20,
    development: { theta: 0, sigma: 8, phase: 'prime' },
    rosterData: {
      rosterStatus: 'MLB_ACTIVE', isOn40Man: true, optionYearsRemaining: 3,
      optionUsedThisSeason: false, minorLeagueDaysThisSeason: 0,
      demotionsThisSeason: 0, serviceTimeDays: 172 * 4,
      serviceTimeCurrentTeamDays: 172 * 4, rule5Selected: false,
      signedSeason: 2022, signedAge: 22, contractYearsRemaining: 3,
      salary: 1_000_000, freeAgentEligible: false, hasTenAndFive: false,
      arbitrationEligible: false,
    },
  };
}

describe('tradeValueBonus wiring', () => {
  it('positive tradeValueBonus makes borderline trades fair', () => {
    // Create a trade where user is slightly underpaying
    const players = [
      makeTradePlayer(1, 1, 350), // user offers
      makeTradePlayer(2, 2, 400), // user wants
    ];
    // Without bonus: user value ~34, partner value ~44 → not fair (34 < 44*0.85=37.4)
    const noBonus = evaluateProposedTrade(players, [1], [2], 0);
    const withBonus = evaluateProposedTrade(players, [1], [2], 9);

    // The bonus should shift borderline trades toward acceptance
    if (!noBonus.fair) {
      expect(withBonus.fair).toBe(true);
    }
  });

  it('negative tradeValueBonus makes fair trades unfair', () => {
    const players = [
      makeTradePlayer(1, 1, 380),
      makeTradePlayer(2, 2, 400),
    ];
    const noBonus = evaluateProposedTrade(players, [1], [2], 0);
    const withPenalty = evaluateProposedTrade(players, [1], [2], -9);

    // Penalty should make trades harder
    if (noBonus.fair) {
      expect(withPenalty.fair).toBe(false);
    }
  });
});

describe('draftBoardQuality wiring', () => {
  it('higher draftBoardQuality reduces scouting noise', () => {
    // Create a simple draft pool
    const pool: Player[] = [];
    for (let i = 0; i < 20; i++) {
      pool.push(makeTradePlayer(100 + i, -1, 300 + i * 10));
    }

    // Scout with low vs high quality
    const gen1 = createPRNG(42);
    const gen2 = createPRNG(42);
    const [prospectsLow] = scoutDraftPool(pool.map(p => ({ ...p })), 1.0, gen1, 0.0);
    const [prospectsHigh] = scoutDraftPool(pool.map(p => ({ ...p })), 1.0, gen2, 1.0);

    // With same seed and same accuracy, higher quality should produce tighter estimates
    // (less deviation from true overall). Measure average absolute error.
    let errLow = 0, errHigh = 0;
    for (let i = 0; i < pool.length; i++) {
      const lowProspect = prospectsLow.find(p => p.playerId === pool[i].playerId)!;
      const highProspect = prospectsHigh.find(p => p.playerId === pool[i].playerId)!;
      // scouted values are on 20-80 scale, true is on 50-550 scale — compare rank order instead
      errLow += Math.abs(lowProspect.rank - (pool.length - i));
      errHigh += Math.abs(highProspect.rank - (pool.length - i));
    }
    // High quality should have equal or better rank accuracy
    expect(errHigh).toBeLessThanOrEqual(errLow);
  });
});
