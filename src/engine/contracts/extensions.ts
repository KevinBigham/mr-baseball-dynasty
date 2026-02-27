/**
 * Contract Extensions — Mr. Baseball Dynasty
 *
 * Allows teams to extend player contracts before free agency:
 *   - Pre-arb extensions (buy out arb years + FA years at discount)
 *   - Arb-year extensions (lock up pending arb-eligible players)
 *   - Mid-career extensions (extend current contracts)
 *   - AI evaluates extension willingness based on age/performance/market
 *
 * Inspired by OOTP's contract negotiation system.
 */

import type { Player } from '../../types/player';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ExtensionOffer {
  playerId:      number;
  teamId:        number;
  years:         number;     // Total years
  aav:           number;     // Average annual value
  totalValue:    number;     // Total guaranteed money
  noTradeClause: boolean;
  optOutYear?:   number;     // Player opt-out after year X
}

export interface ExtensionResult {
  accepted:    boolean;
  playerId:    number;
  playerName:  string;
  years:       number;
  aav:         number;
  totalValue:  number;
  reason?:     string;   // Why rejected (if applicable)
}

export interface ExtensionCandidate {
  playerId:      number;
  name:          string;
  position:      string;
  age:           number;
  overall:       number;
  potential:     number;
  isPitcher:     boolean;
  serviceYears:  number;
  currentSalary: number;
  contractYears: number;
  projectedAAV:  number;     // What the market would pay
  projectedYears: number;    // Projected FA contract length
  willingness:   number;     // 0-100 how willing to extend
  discount:      number;     // % discount vs FA market (positive = cheaper than FA)
}

// ─── Project market value for extensions ────────────────────────────────────────

function projectMarketAAV(player: Player): number {
  const scouting = toScoutingScale(player.overall);
  const age = player.age;

  // Base AAV from talent level
  let baseAAV: number;
  if (scouting >= 75) baseAAV = 35_000_000;      // Superstar
  else if (scouting >= 70) baseAAV = 28_000_000;  // Star
  else if (scouting >= 65) baseAAV = 22_000_000;  // All-Star
  else if (scouting >= 60) baseAAV = 16_000_000;  // Above Average
  else if (scouting >= 55) baseAAV = 10_000_000;  // Average
  else if (scouting >= 50) baseAAV = 6_000_000;   // Useful
  else baseAAV = 2_000_000;                        // Replacement

  // Age adjustment
  if (age <= 25) baseAAV *= 0.85;  // Young = cheaper extensions
  else if (age <= 28) baseAAV *= 1.0;
  else if (age <= 30) baseAAV *= 0.95;
  else if (age <= 33) baseAAV *= 0.80;
  else baseAAV *= 0.60;

  return Math.round(baseAAV / 100_000) * 100_000;
}

function projectMarketYears(player: Player): number {
  const scouting = toScoutingScale(player.overall);
  const age = player.age;

  if (scouting >= 70 && age <= 28) return 8;
  if (scouting >= 65 && age <= 29) return 6;
  if (scouting >= 60 && age <= 30) return 5;
  if (scouting >= 55 && age <= 31) return 4;
  if (scouting >= 50 && age <= 33) return 3;
  if (scouting >= 45) return 2;
  return 1;
}

// ─── Calculate extension willingness ────────────────────────────────────────────

function calculateWillingness(player: Player): number {
  const scouting = toScoutingScale(player.overall);
  const serviceYears = player.rosterData.serviceTimeDays / 172;
  const age = player.age;

  let willingness = 50; // Base 50%

  // Young pre-arb players more willing (security matters)
  if (serviceYears < 3) willingness += 15;
  // Mid-arb players moderately willing
  else if (serviceYears < 5) willingness += 5;
  // Near-FA players less willing (want to test market)
  else if (serviceYears >= 5.5) willingness -= 20;

  // Age: older players want security
  if (age >= 30) willingness += 15;
  else if (age >= 28) willingness += 5;
  else if (age <= 24) willingness += 10; // Very young want security too

  // Superstars want to test the market
  if (scouting >= 70) willingness -= 15;
  else if (scouting >= 60) willingness -= 5;

  // Low performers want guaranteed money
  if (scouting < 50) willingness += 15;

  return Math.max(10, Math.min(90, willingness));
}

// ─── Identify extension candidates ──────────────────────────────────────────────

export function getExtensionCandidates(players: Player[], teamId: number): ExtensionCandidate[] {
  const candidates: ExtensionCandidate[] = [];

  for (const p of players) {
    if (p.teamId !== teamId) continue;
    if (p.rosterData.rosterStatus === 'RETIRED') continue;
    if (p.rosterData.rosterStatus === 'FREE_AGENT') continue;
    if (p.rosterData.rosterStatus === 'DFA') continue;

    const serviceYears = p.rosterData.serviceTimeDays / 172;

    // Must have some track record (1+ year service) and not too far from arb/FA
    if (serviceYears < 1) continue;

    // Skip players already on long-term deals (4+ years remaining)
    if (p.rosterData.contractYearsRemaining >= 4) continue;

    const projectedAAV = projectMarketAAV(p);
    const projectedYears = projectMarketYears(p);
    const willingness = calculateWillingness(p);

    // Extension discount: pre-arb players give bigger discount, near-FA less
    let discount: number;
    if (serviceYears < 3) discount = 25;        // Pre-arb: ~25% discount
    else if (serviceYears < 4.5) discount = 15;  // Early arb: ~15% discount
    else if (serviceYears < 6) discount = 5;     // Late arb: ~5% discount
    else discount = -5;                           // Near FA: might need premium

    candidates.push({
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      age: p.age,
      overall: p.overall,
      potential: p.potential,
      isPitcher: p.isPitcher,
      serviceYears: Number(serviceYears.toFixed(1)),
      currentSalary: p.rosterData.salary,
      contractYears: p.rosterData.contractYearsRemaining,
      projectedAAV,
      projectedYears,
      willingness,
      discount,
    });
  }

  // Sort by overall talent descending
  return candidates.sort((a, b) => b.overall - a.overall);
}

// ─── Evaluate an extension offer ────────────────────────────────────────────────

export function evaluateExtension(
  offer: ExtensionOffer,
  player: Player,
): ExtensionResult {
  const projectedAAV = projectMarketAAV(player);
  const projectedYears = projectMarketYears(player);
  const willingness = calculateWillingness(player);

  // Player evaluates: is the total value >= what they'd get on the market (with discount)?
  const discountFactor = 1 - (willingness - 50) / 200; // Higher willingness = more discount tolerance
  const marketTotal = projectedAAV * projectedYears * discountFactor;
  const offerTotal = offer.aav * offer.years;

  // Years check: player wants at least projected years minus 1
  const yearsOk = offer.years >= projectedYears - 1;

  // No-trade clause sweetener
  const ntcBonus = offer.noTradeClause ? 1.05 : 1.0;
  const adjustedValueOk = offerTotal * ntcBonus >= marketTotal * 0.85;

  // Random factor based on willingness
  const willingnessRoll = Math.random() * 100;
  const willingnessOk = willingnessRoll <= willingness;

  const accepted = yearsOk && adjustedValueOk && willingnessOk;

  if (accepted) {
    // Apply the extension
    player.rosterData.salary = offer.aav;
    player.rosterData.contractYearsRemaining = offer.years;
    player.rosterData.arbitrationEligible = false;
    player.rosterData.freeAgentEligible = false;
  }

  return {
    accepted,
    playerId: player.playerId,
    playerName: player.name,
    years: offer.years,
    aav: offer.aav,
    totalValue: offerTotal,
    reason: !accepted
      ? !yearsOk ? 'Wants more years.' : !adjustedValueOk ? 'Wants more money.' : 'Not interested right now.'
      : undefined,
  };
}

// ─── AI teams extend their stars ────────────────────────────────────────────────

export function runAIExtensions(
  players: Player[],
  teams: { teamId: number; name: string; budget: number; strategy: string }[],
  userTeamId: number,
): ExtensionResult[] {
  const results: ExtensionResult[] = [];

  for (const team of teams) {
    if (team.teamId === userTeamId) continue;

    const candidates = getExtensionCandidates(players, team.teamId);
    // AI only extends their top 2-3 candidates
    const topCandidates = candidates
      .filter(c => c.willingness >= 40 && c.projectedAAV <= team.budget * 0.25)
      .slice(0, 3);

    for (const cand of topCandidates) {
      const player = players.find(p => p.playerId === cand.playerId);
      if (!player) continue;

      // AI offers slightly above minimum acceptance
      const discountedAAV = Math.round(cand.projectedAAV * (1 - cand.discount / 100) * 1.05 / 100_000) * 100_000;
      const years = Math.max(2, cand.projectedYears);

      const offer: ExtensionOffer = {
        playerId: cand.playerId,
        teamId: team.teamId,
        years,
        aav: discountedAAV,
        totalValue: discountedAAV * years,
        noTradeClause: cand.serviceYears >= 5,
      };

      const result = evaluateExtension(offer, player);
      if (result.accepted) {
        results.push(result);
      }
    }
  }

  return results;
}
