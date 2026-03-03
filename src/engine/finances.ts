import type { Player } from '../types/player';
import type { Team } from '../types/team';

// ─── CBT Thresholds (2026 projected) ────────────────────────────────────────

export const CBT_TIER_1 = 237_000_000;
export const CBT_TIER_2 = 257_000_000;
export const CBT_TIER_3 = 277_000_000;
export const REPEATER_SURCHARGE = 0.12; // +12% for consecutive years

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PayrollReport {
  teamId: number;
  totalPayroll: number;
  budget: number;
  cbtTier: 0 | 1 | 2 | 3;
  taxRate: number;
  taxPenalty: number;
  isRepeater: boolean;
  repeaterSurcharge: number;
  totalPenalty: number;
  draftPickPenalty: number;    // Spots moved back for tier 3
  budgetRemaining: number;
  payrollPct: number;          // Pct of budget used
}

export interface ArbitrationCase {
  playerId: number;
  playerName: string;
  position: string;
  age: number;
  overall: number;
  currentSalary: number;
  teamOffer: number;
  playerAsk: number;
  hearingResult: number;        // Deterministic outcome
  serviceYears: number;
}

// ─── Payroll Computation ─────────────────────────────────────────────────────

export function computeTeamPayroll(players: Player[], teamId: number): number {
  return players
    .filter(p => p.teamId === teamId && p.rosterData.salary > 0)
    .reduce((s, p) => s + p.rosterData.salary, 0);
}

export function computePayrollReport(
  players: Player[],
  team: Team,
  consecutiveCbtYears = 0,
): PayrollReport {
  const totalPayroll = computeTeamPayroll(players, team.teamId);

  // Determine CBT tier
  let cbtTier: 0 | 1 | 2 | 3 = 0;
  if (totalPayroll > CBT_TIER_3) cbtTier = 3;
  else if (totalPayroll > CBT_TIER_2) cbtTier = 2;
  else if (totalPayroll > CBT_TIER_1) cbtTier = 1;

  // Tax rates
  const taxRates: Record<number, number> = { 0: 0, 1: 0.20, 2: 0.42, 3: 0.50 };
  const taxRate = taxRates[cbtTier];

  // Tax penalty on excess over tier 1 threshold
  const excess = Math.max(0, totalPayroll - CBT_TIER_1);
  const taxPenalty = Math.round(excess * taxRate);

  // Repeater surcharge
  const isRepeater = consecutiveCbtYears >= 1 && cbtTier > 0;
  const repeaterSurcharge = isRepeater ? Math.round(excess * REPEATER_SURCHARGE) : 0;

  // Total penalty
  const totalPenalty = taxPenalty + repeaterSurcharge;

  // Draft pick penalty: tier 3 = 10 spots back
  const draftPickPenalty = cbtTier >= 3 ? 10 : 0;

  return {
    teamId: team.teamId,
    totalPayroll,
    budget: team.budget,
    cbtTier,
    taxRate,
    taxPenalty,
    isRepeater,
    repeaterSurcharge,
    totalPenalty,
    draftPickPenalty,
    budgetRemaining: Math.max(0, team.budget - totalPayroll),
    payrollPct: team.budget > 0 ? totalPayroll / team.budget : 0,
  };
}

// ─── Arbitration ─────────────────────────────────────────────────────────────

/**
 * Generate arbitration cases for all eligible players on a team.
 * Players with 3-5 service years who are arbitration-eligible.
 */
export function generateArbitrationCases(
  players: Player[],
  teamId: number,
): ArbitrationCase[] {
  const eligible = players.filter(
    p => p.teamId === teamId &&
    p.rosterData.arbitrationEligible &&
    !p.rosterData.freeAgentEligible &&
    p.rosterData.rosterStatus === 'MLB_ACTIVE',
  );

  return eligible.map(p => {
    const serviceYears = Math.floor(p.rosterData.serviceTimeDays / 172);
    const currentSalary = p.rosterData.salary;

    // Base raise: performance-based
    let raiseMultiplier: number;
    if (p.overall >= 400) raiseMultiplier = 2.5;       // Elite: big raise
    else if (p.overall >= 350) raiseMultiplier = 1.8;   // Above average
    else if (p.overall >= 300) raiseMultiplier = 1.3;   // Average
    else raiseMultiplier = 1.1;                          // Below average: modest raise

    // Service year adjustment (later years = higher salaries)
    const yearFactor = 1 + (serviceYears - 3) * 0.15;

    // Player asks for more, team offers less
    const fairValue = Math.round(currentSalary * raiseMultiplier * yearFactor);
    const playerAsk = Math.round(fairValue * 1.15);
    const teamOffer = Math.round(fairValue * 0.85);

    // Hearing result is deterministic from playerId + overall
    // Slightly favors team for below-average players, player for above-average
    const favorPlayer = p.overall >= 350;
    const hearingResult = favorPlayer
      ? Math.round(teamOffer + (playerAsk - teamOffer) * 0.6)
      : Math.round(teamOffer + (playerAsk - teamOffer) * 0.4);

    return {
      playerId: p.playerId,
      playerName: p.name,
      position: p.position,
      age: p.age,
      overall: p.overall,
      currentSalary,
      teamOffer,
      playerAsk,
      hearingResult,
      serviceYears,
    };
  });
}

/**
 * Resolve an arbitration case: accept team offer, player ask, or go to hearing.
 */
export function resolveArbitration(
  player: Player,
  resolvedSalary: number,
): void {
  player.rosterData.salary = resolvedSalary;
  player.rosterData.contractYearsRemaining = 1; // Arb is always 1-year
}

// ─── AI Payroll Enforcement ──────────────────────────────────────────────────

/**
 * Check if a team can afford to make a move (signing/trade) given budget.
 */
export function canAffordMove(
  players: Player[],
  team: Team,
  additionalSalary: number,
): boolean {
  const currentPayroll = computeTeamPayroll(players, team.teamId);
  // Allow up to 110% of budget (slight flexibility)
  return (currentPayroll + additionalSalary) <= team.budget * 1.1;
}
