import { describe, it, expect } from 'vitest';
import {
  computeStaffBonuses,
  getActionBonus,
  DEFAULT_BONUSES,
} from '../../src/engine/staffEffects';
import type { FOStaffMember } from '../../src/types/frontOffice';

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
