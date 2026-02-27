/**
 * Player Valuation Engine — Mr. Baseball Dynasty
 *
 * Calculates "trade value" for each player on a 0–100 scale.
 * Inspired by OOTP's surplus value model:
 *   Value = (Production Value) + (Contract Value) + (Age/Potential Premium)
 *
 * Used by both the trade AI and free agency contract projection.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { toScoutingScale } from '../player/attributes';

// ─── Position scarcity multipliers ──────────────────────────────────────────────
// Premium positions get a boost; replacement-level positions get less.
const POSITION_SCARCITY: Record<string, number> = {
  'C':  1.15,
  'SS': 1.15,
  'CF': 1.10,
  '2B': 1.05,
  '3B': 1.05,
  'SP': 1.20,   // Starters are king
  'CL': 1.10,
  'RP': 0.85,
  'RF': 1.00,
  'LF': 0.95,
  '1B': 0.85,
  'DH': 0.75,
};

// ─── Age curve for value (peaks at 25, declines sharply after 32) ───────────────
function ageFactor(age: number): number {
  if (age <= 22) return 0.85;
  if (age <= 24) return 0.95;
  if (age <= 27) return 1.00;
  if (age <= 29) return 0.92;
  if (age <= 31) return 0.80;
  if (age <= 33) return 0.65;
  if (age <= 35) return 0.45;
  return 0.25;
}

// ─── Potential premium (young players with high ceiling get a boost) ─────────────
function potentialPremium(age: number, overall: number, potential: number): number {
  const gap = potential - overall;
  if (gap <= 0 || age > 30) return 0;
  // Young + high gap = big premium
  const ageMult = age <= 22 ? 1.5 : age <= 25 ? 1.2 : age <= 28 ? 0.8 : 0.3;
  return Math.min(20, (gap / 550) * 60 * ageMult);
}

// ─── Contract value (cheap + controlled = more valuable) ────────────────────────
function contractValue(player: Player): number {
  const salary = player.rosterData.salary;
  const serviceYears = player.rosterData.serviceTimeDays / 172;

  // Pre-arb players on min salary are extremely valuable
  if (serviceYears < 3) return 15;
  // Arb-eligible players are moderately valuable
  if (serviceYears < 6) return 10 - (salary / 10_000_000);
  // Free agents with big contracts are less tradeable
  if (salary > 20_000_000) return -5;
  if (salary > 10_000_000) return -2;
  return 0;
}

// ─── Main valuation function ────────────────────────────────────────────────────

export function calculatePlayerValue(player: Player): number {
  // Base production value: overall rating mapped to 0-60 range
  const ovrNorm = Math.max(0, (player.overall - 200) / 350) * 60;

  // Position scarcity
  const posScarcity = POSITION_SCARCITY[player.position] ?? 1.0;

  // Age factor
  const ageF = ageFactor(player.age);

  // Potential premium
  const potPremium = potentialPremium(player.age, player.overall, player.potential);

  // Contract value
  const contractVal = contractValue(player);

  // Combine
  const raw = (ovrNorm * posScarcity * ageF) + potPremium + contractVal;

  // Clamp to 0–100
  return Math.max(0, Math.min(100, Math.round(raw)));
}

// ─── Estimate fair market salary for free agency ────────────────────────────────

export function estimateMarketSalary(player: Player): number {
  const ageF = ageFactor(player.age);
  const scouting = toScoutingScale(player.overall);

  // Base salary: exponential curve from overall rating
  // 50 OVR = ~2M, 60 OVR = ~8M, 70 OVR = ~18M, 80 OVR = ~35M
  const baseSalary = Math.pow((scouting - 30) / 50, 2.5) * 35_000_000;

  // Adjust for age (older players get shorter, cheaper deals)
  const adjustedSalary = baseSalary * ageF;

  // Floor at league minimum
  return Math.max(720_000, Math.round(adjustedSalary / 100_000) * 100_000);
}

// ─── Estimate contract years for free agency ────────────────────────────────────

export function estimateContractYears(player: Player): number {
  const scouting = toScoutingScale(player.overall);
  const age = player.age;

  if (scouting >= 70 && age <= 30) return 6;
  if (scouting >= 65 && age <= 31) return 5;
  if (scouting >= 60 && age <= 32) return 4;
  if (scouting >= 55 && age <= 33) return 3;
  if (scouting >= 50 && age <= 34) return 2;
  return 1;
}

// ─── Trade package valuation (sum of player values with diminishing returns) ────

export function calculatePackageValue(players: Player[]): number {
  if (players.length === 0) return 0;
  const values = players.map(p => calculatePlayerValue(p)).sort((a, b) => b - a);
  // Best player counts fully, subsequent players have diminishing returns
  let total = values[0]!;
  for (let i = 1; i < values.length; i++) {
    total += values[i]! * (0.7 ** i); // 70% of value for 2nd, 49% for 3rd, etc.
  }
  return total;
}

// ─── Team needs assessment (what positions does a team need?) ────────────────────

export interface TeamNeeds {
  teamId: number;
  needs: Array<{ position: string; urgency: number }>; // urgency 0-10
  strategy: string;
}

export function assessTeamNeeds(team: Team, players: Player[]): TeamNeeds {
  const teamPlayers = players.filter(p => p.teamId === team.teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE');

  const positionStrength: Record<string, number> = {};
  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];

  for (const pos of positions) {
    const atPos = teamPlayers.filter(p => p.position === pos);
    if (atPos.length === 0) {
      positionStrength[pos] = 0;
    } else {
      const bestOvr = Math.max(...atPos.map(p => p.overall));
      positionStrength[pos] = bestOvr;
    }
  }

  // Calculate needs: low strength = high urgency
  const needs = positions.map(pos => {
    const strength = positionStrength[pos] ?? 0;
    // SP needs are higher (need 5 good ones)
    const spCount = teamPlayers.filter(p => p.position === 'SP').length;
    const spPenalty = pos === 'SP' && spCount < 5 ? 3 : 0;
    const rpCount = teamPlayers.filter(p => p.position === 'RP' || p.position === 'CL').length;
    const rpPenalty = (pos === 'RP' || pos === 'CL') && rpCount < 5 ? 2 : 0;

    const urgency = Math.max(0, Math.min(10,
      10 - (strength / 55) + spPenalty + rpPenalty,
    ));
    return { position: pos, urgency: Math.round(urgency * 10) / 10 };
  }).filter(n => n.urgency > 2).sort((a, b) => b.urgency - a.urgency);

  return { teamId: team.teamId, needs, strategy: team.strategy };
}
