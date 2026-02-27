/**
 * Free Agency Engine — Mr. Baseball Dynasty
 *
 * Handles the offseason free agent market:
 *   - Identifies players entering free agency
 *   - Generates contract offers (user + AI)
 *   - Clears the market (AI teams sign remaining FAs)
 *
 * Inspired by OOTP's free agency bidding system.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { calculatePlayerValue, estimateMarketSalary, estimateContractYears, assessTeamNeeds } from '../trade/valuation';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface FreeAgent {
  playerId:       number;
  name:           string;
  age:            number;
  position:       string;
  overall:        number;
  potential:      number;
  isPitcher:      boolean;
  previousTeamId: number;
  tradeValue:     number;
  askingSalary:   number;    // Annual salary the player wants
  askingYears:    number;    // Contract length desired
  scoutGrade:     number;    // 20-80 scouting scale
}

export interface ContractOffer {
  teamId:    number;
  playerId:  number;
  salary:    number;   // Annual
  years:     number;
}

export interface FreeAgencyResult {
  signings: Array<{
    playerId:    number;
    playerName:  string;
    teamId:      number;
    teamName:    string;
    salary:      number;
    years:       number;
    previousTeamId: number;
  }>;
  unsigned: number[];  // Players who didn't sign (retire or minor league deals)
}

// ─── Identify free agents ───────────────────────────────────────────────────────

export function identifyFreeAgents(players: Player[]): FreeAgent[] {
  const fas: FreeAgent[] = [];

  for (const p of players) {
    // Players become FAs when:
    // 1. Contract years remaining hits 0 AND they have 6+ service years
    // 2. They were DFA'd and cleared waivers
    // 3. They are already marked FREE_AGENT
    const isFAEligible =
      (p.rosterData.contractYearsRemaining <= 0 && p.rosterData.serviceTimeDays >= 172 * 6) ||
      p.rosterData.rosterStatus === 'FREE_AGENT';

    if (!isFAEligible) continue;
    if (p.rosterData.rosterStatus === 'RETIRED') continue;
    if (p.age > 42) continue; // Too old

    // Skip players with very low overall (they'd get minor league deals)
    const scouting = toScoutingScale(p.overall);
    if (scouting < 35) continue;

    fas.push({
      playerId:       p.playerId,
      name:           p.name,
      age:            p.age,
      position:       p.position,
      overall:        p.overall,
      potential:      p.potential,
      isPitcher:      p.isPitcher,
      previousTeamId: p.teamId,
      tradeValue:     calculatePlayerValue(p),
      askingSalary:   estimateMarketSalary(p),
      askingYears:    estimateContractYears(p),
      scoutGrade:     scouting,
    });
  }

  // Sort by value (best players first)
  fas.sort((a, b) => b.tradeValue - a.tradeValue);
  return fas;
}

// ─── User signs a free agent ────────────────────────────────────────────────────

export function signFreeAgent(
  player: Player,
  teamId: number,
  salary: number,
  years: number,
): void {
  player.teamId = teamId;
  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.salary = salary;
  player.rosterData.contractYearsRemaining = years;
  player.rosterData.isOn40Man = true;
  player.rosterData.serviceTimeCurrentTeamDays = 0;
  player.rosterData.freeAgentEligible = false;
}

// ─── AI teams sign remaining free agents ────────────────────────────────────────

export function runAIFreeAgency(
  players: Player[],
  teams: Team[],
  userTeamId: number,
): FreeAgencyResult {
  const freeAgents = identifyFreeAgents(players);
  const signings: FreeAgencyResult['signings'] = [];
  const unsigned: number[] = [];

  // AI teams that can sign (exclude user)
  const aiTeams = teams.filter(t => t.teamId !== userTeamId);

  for (const fa of freeAgents) {
    const player = players.find(p => p.playerId === fa.playerId);
    if (!player) continue;
    if (player.teamId === userTeamId && player.rosterData.rosterStatus !== 'FREE_AGENT') continue;

    // Find the AI team with the best fit
    let bestTeam: Team | null = null;
    let bestScore = -Infinity;

    for (const team of aiTeams) {
      const needs = assessTeamNeeds(team, players);
      const posNeed = needs.needs.find(n => n.position === fa.position);
      const needScore = posNeed ? posNeed.urgency : 0;

      // Budget check: can team afford this player?
      const currentPayroll = players
        .filter(p => p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE')
        .reduce((sum, p) => sum + p.rosterData.salary, 0);
      const budgetRoom = team.budget - currentPayroll;
      if (budgetRoom < fa.askingSalary * 0.8) continue;

      // Strategy alignment
      let strategyScore = 0;
      if (team.strategy === 'contender' && fa.age <= 32) strategyScore = 5;
      if (team.strategy === 'rebuilder' && fa.age <= 28) strategyScore = 3;
      if (team.strategy === 'rebuilder' && fa.age > 32) strategyScore = -5;

      const totalScore = needScore + strategyScore + (fa.tradeValue / 10);
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestTeam = team;
      }
    }

    if (bestTeam && bestScore > 3) {
      // Sign the player
      const salary = Math.round(fa.askingSalary * (0.85 + Math.random() * 0.30));
      const years = Math.max(1, fa.askingYears + Math.floor(Math.random() * 2) - 1);

      signFreeAgent(player, bestTeam.teamId, salary, years);

      signings.push({
        playerId: fa.playerId,
        playerName: fa.name,
        teamId: bestTeam.teamId,
        teamName: bestTeam.name,
        salary,
        years,
        previousTeamId: fa.previousTeamId,
      });
    } else {
      // Player goes unsigned — minor league deal or retirement
      if (fa.age > 36 || fa.scoutGrade < 40) {
        player.rosterData.rosterStatus = 'RETIRED';
      } else {
        player.rosterData.rosterStatus = 'FREE_AGENT';
        player.teamId = -1;
      }
      unsigned.push(fa.playerId);
    }
  }

  // Decrement contract years for all non-FA players
  for (const p of players) {
    if (p.rosterData.rosterStatus !== 'FREE_AGENT' && p.rosterData.rosterStatus !== 'RETIRED') {
      if (p.rosterData.contractYearsRemaining > 0) {
        p.rosterData.contractYearsRemaining--;
      }
    }
  }

  return { signings, unsigned };
}
