import type { FOStaffMember, FOAction, FOTraitId } from '../types/frontOffice';
import { FO_ROLES } from '../data/frontOffice';

// ─── Staff Bonuses Interface ─────────────────────────────────────────────────

export interface StaffBonuses {
  scoutingAccuracy: number;       // 0.5-1.5 multiplier on noise reduction
  draftBoardQuality: number;      // 0-1, reduces draft bust probability
  hitterDevMultiplier: number;    // multiplied into workEthicFactor for hitters
  pitcherDevMultiplier: number;   // multiplied into workEthicFactor for pitchers
  injuryRateMultiplier: number;   // <1 reduces injury probability
  recoverySpeedMultiplier: number;// <1 speeds up recovery
  tradeValueBonus: number;        // -10 to +10 adjustment to trade threshold
  freeAgencyDiscount: number;     // 0-0.15 percentage discount on FA salary
  moraleBonus: number;            // 0-5 bonus to team morale per season
}

// ─── Trait Synergies ─────────────────────────────────────────────────────────
// When a staff member's trait matches the action domain, they get an extra boost

const TRAIT_SYNERGIES: Partial<Record<FOTraitId, FOAction[]>> = {
  analytical:        ['evaluation', 'prospectEval', 'gameplan'],
  old_school:        ['chemistry', 'lineup'],
  moneyball:         ['freeAgency', 'trades', 'contracts'],
  developer:         ['hitterDev', 'pitcherDev'],
  negotiator:        ['contracts', 'freeAgency', 'trades'],
  talent_scout:      ['drafting', 'prospectEval', 'intlSigning'],
  analytics_guru:    ['evaluation', 'gameplan', 'prospectEval'],
  clubhouse_guy:     ['chemistry'],
  grinder:           ['hitterDev', 'pitcherDev', 'evaluation'],
  visionary:         ['drafting', 'prospectEval'],
  tactician:         ['gameplan', 'bullpenMgmt', 'lineup'],
  medic:             ['injuries', 'recovery', 'durability'],
  recruiter:         ['intlSigning', 'drafting'],
  competitor:        ['chemistry', 'gameplan'],
  pitcher_whisperer: ['pitcherDev'],
};

// ─── Default Bonuses (no staff hired) ────────────────────────────────────────

export const DEFAULT_BONUSES: StaffBonuses = {
  scoutingAccuracy: 1.0,
  draftBoardQuality: 0.5,
  hitterDevMultiplier: 1.0,
  pitcherDevMultiplier: 1.0,
  injuryRateMultiplier: 1.0,
  recoverySpeedMultiplier: 1.0,
  tradeValueBonus: 0,
  freeAgencyDiscount: 0,
  moraleBonus: 0,
};

// ─── Core Bonus Calculation ──────────────────────────────────────────────────

/**
 * Compute the bonus for a specific FOAction from the staff roster.
 * Returns a value centered at 0 — positive is beneficial, negative is harmful.
 * Range: approximately -0.3 to +0.3.
 */
export function getActionBonus(
  staff: FOStaffMember[],
  action: FOAction,
): number {
  // Find all staff whose role affects this action
  const relevant = staff.filter(member => {
    const role = FO_ROLES.find(r => r.id === member.roleId);
    return role?.affects.includes(action);
  });

  if (relevant.length === 0) return 0;

  // Average OVR of relevant staff, normalized to -0.3..+0.3
  // 40 OVR → -0.12, 67.5 OVR → 0, 95 OVR → +0.12
  const avgOvr = relevant.reduce((s, m) => s + m.ovr, 0) / relevant.length;
  const ovrBonus = ((avgOvr - 67.5) / 67.5) * 0.3;

  // Trait synergy: +0.05 if any relevant staff has a synergistic trait
  const hasSynergy = relevant.some(m => {
    const synergies = TRAIT_SYNERGIES[m.traitId];
    return synergies?.includes(action);
  });
  const traitBonus = hasSynergy ? 0.05 : 0;

  return ovrBonus + traitBonus;
}

// ─── Aggregate All Bonuses ───────────────────────────────────────────────────

export function computeStaffBonuses(staff: FOStaffMember[]): StaffBonuses {
  if (staff.length === 0) return { ...DEFAULT_BONUSES };

  // Scouting accuracy: affected by scout_dir, analytics, intl_scout
  const scoutBonus = getActionBonus(staff, 'prospectEval');
  const scoutingAccuracy = Math.max(0.5, Math.min(1.5, 1.0 + scoutBonus));

  // Draft board: affected by scout_dir + drafting action
  const draftBonus = getActionBonus(staff, 'drafting');
  const draftBoardQuality = Math.max(0, Math.min(1, 0.5 + draftBonus));

  // Hitter development: affected by hitting_coach
  const hitterDevBonus = getActionBonus(staff, 'hitterDev');
  const hitterDevMultiplier = Math.max(0.7, Math.min(1.3, 1.0 + hitterDevBonus));

  // Pitcher development: affected by pitching_coach
  const pitcherDevBonus = getActionBonus(staff, 'pitcherDev');
  const pitcherDevMultiplier = Math.max(0.7, Math.min(1.3, 1.0 + pitcherDevBonus));

  // Injury rate: affected by trainer (injuries action)
  const injuryBonus = getActionBonus(staff, 'injuries');
  // Negative injuryBonus is bad (more injuries), positive is good (fewer injuries)
  const injuryRateMultiplier = Math.max(0.7, Math.min(1.3, 1.0 - injuryBonus));

  // Recovery speed: affected by trainer (recovery action)
  const recoveryBonus = getActionBonus(staff, 'recovery');
  const recoverySpeedMultiplier = Math.max(0.7, Math.min(1.3, 1.0 - recoveryBonus));

  // Trade value: affected by GM (trades action)
  const tradeBonus = getActionBonus(staff, 'trades');
  const tradeValueBonus = Math.round(tradeBonus * 30); // -9 to +9 range

  // FA discount: affected by GM (freeAgency action)
  const faBonus = getActionBonus(staff, 'freeAgency');
  const freeAgencyDiscount = Math.max(0, Math.min(0.15, faBonus * 0.4));

  // Morale: affected by manager (chemistry action)
  const chemistryBonus = getActionBonus(staff, 'chemistry');
  const moraleBonus = Math.max(0, Math.min(5, Math.round(chemistryBonus * 15)));

  return {
    scoutingAccuracy,
    draftBoardQuality,
    hitterDevMultiplier,
    pitcherDevMultiplier,
    injuryRateMultiplier,
    recoverySpeedMultiplier,
    tradeValueBonus,
    freeAgencyDiscount,
    moraleBonus,
  };
}
