/**
 * Financial System — Mr. Baseball Dynasty
 *
 * Team finances with OOTP-inspired depth:
 *   - Revenue: gate, media, merch, revenue sharing
 *   - Expenses: payroll, operations, scouting, intl bonus pool
 *   - Luxury tax (CBT) threshold and penalties
 *   - Budget recommendations based on team strategy
 *   - Profit/loss tracking per season
 *
 * Market sizes affect revenue. Small-market teams get revenue sharing.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TeamFinancials {
  teamId:        number;
  teamName:      string;
  season:        number;

  // Revenue breakdown
  gateRevenue:       number;  // Ticket sales
  mediaRevenue:      number;  // TV/streaming deals
  merchRevenue:      number;  // Merch + sponsorships
  revenueSharingIn:  number;  // Received from pool
  totalRevenue:      number;

  // Expense breakdown
  payroll:           number;  // Player salaries
  minorLeagueOps:    number;  // Minor league costs
  scoutingBudget:    number;  // Scouting department
  coachingBudget:    number;  // Coaching staff
  operations:        number;  // Facilities, travel, admin
  revenueSharingOut: number;  // Paid into pool
  totalExpenses:     number;

  // Derived
  operatingIncome:   number;  // Revenue - expenses
  cashOnHand:        number;  // Accumulated over seasons

  // Luxury tax
  luxuryTaxPayroll:  number;  // CBT payroll (avg annual value)
  luxuryTaxThreshold: number;
  luxuryTaxPenalty:  number;
  luxuryTaxYears:    number;  // Consecutive years over threshold

  // Budget
  totalBudget:       number;  // Owner-approved spending limit
  budgetRemaining:   number;
}

export interface FinancialHistory {
  season:  number;
  revenue: number;
  expenses: number;
  profit:  number;
  payroll: number;
  wins:    number;
}

// ─── Market sizes (affects revenue) ─────────────────────────────────────────────
// 1.0 = average, >1.0 = large market, <1.0 = small market

const MARKET_SIZES: Record<number, number> = {};
// Set programmatically based on team IDs (1-30)
// Top markets: NYC (2 teams), LA (2 teams), Chicago (2 teams), etc.
function initMarketSizes() {
  const sizes: [number[], number][] = [
    [[1, 2], 1.5],     // New York teams
    [[3, 4], 1.4],     // Los Angeles teams
    [[5, 6], 1.25],    // Chicago teams
    [[7], 1.2],        // Boston
    [[8], 1.15],       // Houston
    [[9], 1.1],        // San Francisco
    [[10], 1.1],       // Philadelphia
    [[11, 12], 1.0],   // Average markets
    [[13, 14], 1.0],
    [[15, 16], 0.95],
    [[17, 18], 0.95],
    [[19, 20], 0.90],
    [[21, 22], 0.85],
    [[23, 24], 0.85],
    [[25, 26], 0.80],
    [[27, 28], 0.80],
    [[29, 30], 0.75],  // Smallest markets
  ];

  for (const [ids, size] of sizes) {
    for (const id of ids) {
      MARKET_SIZES[id] = size;
    }
  }
}
initMarketSizes();

// ─── Constants ──────────────────────────────────────────────────────────────────

const BASE_GATE_REVENUE      = 60_000_000;   // $60M average gate
const BASE_MEDIA_REVENUE     = 80_000_000;   // $80M average media
const BASE_MERCH_REVENUE     = 25_000_000;   // $25M average merch
const MINOR_LEAGUE_OPS_COST  = 20_000_000;   // $20M minor league ops
const BASE_SCOUTING_COST     = 8_000_000;    // $8M scouting
const BASE_COACHING_COST     = 5_000_000;    // $5M coaching
const BASE_OPERATIONS_COST   = 30_000_000;   // $30M operations
const LUXURY_TAX_THRESHOLD   = 230_000_000;  // $230M CBT threshold
const LUXURY_TAX_RATE_YEAR1  = 0.20;         // 20% first year over
const LUXURY_TAX_RATE_YEAR2  = 0.30;         // 30% second year
const LUXURY_TAX_RATE_YEAR3  = 0.50;         // 50% third+ year
const REVENUE_SHARING_RATE   = 0.48;         // 48% of local revenue goes to pool

// ─── Compute payroll ────────────────────────────────────────────────────────────

export function computePayroll(players: Player[], teamId: number): number {
  return players
    .filter(p => p.teamId === teamId && (
      p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
      p.rosterData.rosterStatus === 'MLB_IL_10' ||
      p.rosterData.rosterStatus === 'MLB_IL_60'
    ))
    .reduce((sum, p) => sum + p.rosterData.salary, 0);
}

export function computeFullPayroll(players: Player[], teamId: number): number {
  return players
    .filter(p => p.teamId === teamId && p.rosterData.rosterStatus !== 'RETIRED' && p.rosterData.rosterStatus !== 'FREE_AGENT')
    .reduce((sum, p) => sum + p.rosterData.salary, 0);
}

// ─── Compute team financials ────────────────────────────────────────────────────

export function computeTeamFinancials(
  team: Team,
  players: Player[],
  season: number,
  prevCash: number,
  luxuryTaxYears: number,
): TeamFinancials {
  const marketSize = MARKET_SIZES[team.teamId] ?? 1.0;

  // Win bonus to revenue (winning teams draw more fans)
  const winPct = team.seasonRecord.wins / Math.max(1, team.seasonRecord.wins + team.seasonRecord.losses);
  const winBonus = 1 + (winPct - 0.500) * 0.4; // +/-20% revenue based on W%

  // Revenue
  const gateRevenue      = Math.round(BASE_GATE_REVENUE * marketSize * winBonus);
  const mediaRevenue     = Math.round(BASE_MEDIA_REVENUE * marketSize);
  const merchRevenue     = Math.round(BASE_MERCH_REVENUE * marketSize * winBonus);
  const localRevenue     = gateRevenue + mediaRevenue + merchRevenue;

  // Revenue sharing: big markets pay in, small markets receive
  const leagueAvgRevenue = BASE_GATE_REVENUE + BASE_MEDIA_REVENUE + BASE_MERCH_REVENUE;
  const revenueSharingOut = marketSize > 1.05
    ? Math.round(localRevenue * REVENUE_SHARING_RATE * 0.10) // Big markets contribute
    : 0;
  const revenueSharingIn = marketSize < 0.95
    ? Math.round(leagueAvgRevenue * REVENUE_SHARING_RATE * 0.05 * (1.1 - marketSize)) // Small markets receive
    : 0;

  const totalRevenue = localRevenue + revenueSharingIn;

  // Expenses
  const payroll         = computePayroll(players, team.teamId);
  const minorLeagueOps  = MINOR_LEAGUE_OPS_COST;
  const scoutingBudget  = Math.round(BASE_SCOUTING_COST * (0.8 + team.scoutingQuality * 0.4));
  const coachingBudget  = Math.round(BASE_COACHING_COST * (0.8 + (team.coaching.hittingCoachQuality + team.coaching.pitchingCoachQuality)));
  const operations      = BASE_OPERATIONS_COST;

  // Luxury tax
  const luxuryTaxPayroll = payroll; // Simplified: just MLB payroll
  let luxuryTaxPenalty = 0;
  let newLuxuryTaxYears = luxuryTaxYears;

  if (luxuryTaxPayroll > LUXURY_TAX_THRESHOLD) {
    newLuxuryTaxYears = luxuryTaxYears + 1;
    const overage = luxuryTaxPayroll - LUXURY_TAX_THRESHOLD;
    const rate = newLuxuryTaxYears >= 3 ? LUXURY_TAX_RATE_YEAR3
      : newLuxuryTaxYears >= 2 ? LUXURY_TAX_RATE_YEAR2
      : LUXURY_TAX_RATE_YEAR1;
    luxuryTaxPenalty = Math.round(overage * rate);
  } else {
    newLuxuryTaxYears = 0; // Reset consecutive count
  }

  const totalExpenses = payroll + minorLeagueOps + scoutingBudget + coachingBudget + operations + revenueSharingOut + luxuryTaxPenalty;
  const operatingIncome = totalRevenue - totalExpenses;
  const cashOnHand = prevCash + operatingIncome;

  return {
    teamId: team.teamId,
    teamName: team.name,
    season,
    gateRevenue,
    mediaRevenue,
    merchRevenue,
    revenueSharingIn,
    totalRevenue,
    payroll,
    minorLeagueOps,
    scoutingBudget,
    coachingBudget,
    operations,
    revenueSharingOut,
    totalExpenses,
    operatingIncome,
    cashOnHand,
    luxuryTaxPayroll,
    luxuryTaxThreshold: LUXURY_TAX_THRESHOLD,
    luxuryTaxPenalty,
    luxuryTaxYears: newLuxuryTaxYears,
    totalBudget: team.budget,
    budgetRemaining: team.budget - payroll,
  };
}

// ─── League-wide financial summary ──────────────────────────────────────────────

export interface LeagueFinancialSummary {
  season:          number;
  totalRevenue:    number;
  totalPayroll:    number;
  avgPayroll:      number;
  maxPayroll:      { teamName: string; amount: number };
  minPayroll:      { teamName: string; amount: number };
  luxuryTaxTeams:  number;
  totalLuxuryTax:  number;
}

export function computeLeagueFinancials(
  teams: Team[],
  players: Player[],
  season: number,
): LeagueFinancialSummary {
  const payrolls: Array<{ teamName: string; amount: number }> = [];
  let totalRevenue = 0;
  let totalPayroll = 0;
  let luxuryTaxTeams = 0;
  let totalLuxuryTax = 0;

  for (const team of teams) {
    const financials = computeTeamFinancials(team, players, season, 0, 0);
    payrolls.push({ teamName: team.name, amount: financials.payroll });
    totalRevenue += financials.totalRevenue;
    totalPayroll += financials.payroll;
    if (financials.luxuryTaxPenalty > 0) {
      luxuryTaxTeams++;
      totalLuxuryTax += financials.luxuryTaxPenalty;
    }
  }

  payrolls.sort((a, b) => b.amount - a.amount);

  return {
    season,
    totalRevenue,
    totalPayroll,
    avgPayroll: Math.round(totalPayroll / teams.length),
    maxPayroll: payrolls[0] ?? { teamName: '???', amount: 0 },
    minPayroll: payrolls[payrolls.length - 1] ?? { teamName: '???', amount: 0 },
    luxuryTaxTeams,
    totalLuxuryTax,
  };
}
