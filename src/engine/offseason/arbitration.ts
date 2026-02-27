/**
 * Arbitration Engine — Mr. Baseball Dynasty
 *
 * Handles salary arbitration for pre-free-agency players:
 *   - Super Two: Top 22% of 2-3 year service players get extra arb year
 *   - Arb-eligible: 3-6 years service time (before free agency at 6)
 *   - Salary based on performance, comparables, and service time
 *   - Player files vs team files with hearing outcomes
 *
 * Inspired by OOTP's arbitration system.
 */

import type { Player } from '../../types/player';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ArbitrationCase {
  playerId:       number;
  name:           string;
  position:       string;
  age:            number;
  teamId:         number;
  isPitcher:      boolean;
  serviceYears:   number;      // How many years of MLB service
  arbYear:        number;      // 1st, 2nd, 3rd, or 4th arb year
  currentSalary:  number;
  playerFiling:   number;      // What the player asks for
  teamFiling:     number;      // What the team offers
  midpoint:       number;
  projectedSalary: number;     // Final outcome
  isSettled:      boolean;     // Settled before hearing?
  playerWon?:     boolean;     // If hearing, who won?
  isSuperTwo:     boolean;
}

export interface ArbitrationResult {
  cases:         ArbitrationCase[];
  totalPayroll:  number;       // New total after arb
}

// ─── Identify arb-eligible players ──────────────────────────────────────────────

export function identifyArbEligible(players: Player[], teamId?: number): Player[] {
  return players.filter(p => {
    if (teamId !== undefined && p.teamId !== teamId) return false;
    if (p.rosterData.rosterStatus === 'RETIRED') return false;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') return false;
    if (p.teamId <= 0) return false;

    const serviceYears = p.rosterData.serviceTimeDays / 172;

    // Arb eligible: 3-6 years service (6+ = free agency)
    // Super Two: 2.5-3 years for top performers
    if (serviceYears >= 2.5 && serviceYears < 6) return true;
    return false;
  });
}

// ─── Project arbitration salary ─────────────────────────────────────────────────

function projectArbSalary(player: Player): number {
  const serviceYears = player.rosterData.serviceTimeDays / 172;
  const overall = toScoutingScale(player.overall);
  const currentSalary = Math.max(720_000, player.rosterData.salary);

  // Base raise percentage by arb year
  const arbYear = Math.min(4, Math.max(1, Math.floor(serviceYears) - 2));
  const baseRaisePercents: Record<number, number> = {
    1: 0.40,  // 40% raise year 1
    2: 0.50,  // 50% raise year 2
    3: 0.60,  // 60% raise year 3
    4: 0.65,  // 65% raise year 4
  };
  const baseRaise = baseRaisePercents[arbYear] ?? 0.50;

  // Performance modifier
  const perfMult = overall >= 70 ? 2.0  // Star players get bigger raises
    : overall >= 60 ? 1.5
    : overall >= 50 ? 1.0
    : overall >= 40 ? 0.7
    : 0.5;

  // Age factor: younger players get slightly more (more upside)
  const ageFactor = player.age <= 27 ? 1.1 : player.age <= 30 ? 1.0 : 0.9;

  const projectedSalary = Math.round(currentSalary * (1 + baseRaise * perfMult * ageFactor));

  // Floor: minimum salary
  return Math.max(720_000, projectedSalary);
}

// ─── Run arbitration for a team ─────────────────────────────────────────────────

export function processArbitration(
  players: Player[],
  teamId?: number,
): ArbitrationResult {
  const eligible = identifyArbEligible(players, teamId);
  const cases: ArbitrationCase[] = [];

  for (const player of eligible) {
    const serviceYears = player.rosterData.serviceTimeDays / 172;
    const arbYear = Math.min(4, Math.max(1, Math.floor(serviceYears) - 2));
    const isSuperTwo = serviceYears >= 2.5 && serviceYears < 3;

    const projected = projectArbSalary(player);

    // Player files ~10% above projected, team files ~10% below
    const playerFiling = Math.round(projected * 1.10);
    const teamFiling = Math.round(projected * 0.90);
    const midpoint = Math.round((playerFiling + teamFiling) / 2);

    // 70% chance of settling (midpoint), 30% goes to hearing
    const settleRoll = Math.random();
    const isSettled = settleRoll < 0.70;

    let finalSalary: number;
    let playerWon: boolean | undefined;

    if (isSettled) {
      finalSalary = midpoint;
    } else {
      // Hearing: 50/50 — winner's filing is the salary
      playerWon = Math.random() < 0.50;
      finalSalary = playerWon ? playerFiling : teamFiling;
    }

    // Apply the salary
    player.rosterData.salary = finalSalary;
    player.rosterData.contractYearsRemaining = 1; // Arb is year-to-year
    player.rosterData.arbitrationEligible = true;

    cases.push({
      playerId: player.playerId,
      name: player.name,
      position: player.position,
      age: player.age,
      teamId: player.teamId,
      isPitcher: player.isPitcher,
      serviceYears: Number(serviceYears.toFixed(1)),
      arbYear,
      currentSalary: player.rosterData.salary,
      playerFiling,
      teamFiling,
      midpoint,
      projectedSalary: finalSalary,
      isSettled,
      playerWon,
      isSuperTwo,
    });
  }

  // Calculate new total payroll
  const targetPlayers = teamId !== undefined
    ? players.filter(p => p.teamId === teamId)
    : players;
  const totalPayroll = targetPlayers
    .filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE' || p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60')
    .reduce((sum, p) => sum + p.rosterData.salary, 0);

  return { cases, totalPayroll };
}
