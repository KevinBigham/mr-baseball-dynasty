/**
 * Qualifying Offer System
 *
 * MLB's qualifying offer (QO) system — teams can make a one-year
 * QO to pending free agents. If rejected and the player signs
 * elsewhere, the team receives a compensatory draft pick.
 * Players can only receive one QO in their career.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type QOStatus = 'eligible' | 'offered' | 'accepted' | 'rejected' | 'not_eligible' | 'pending';

export const STATUS_DISPLAY: Record<QOStatus, { label: string; color: string; emoji: string }> = {
  eligible:     { label: 'Eligible',     color: '#3b82f6', emoji: '📋' },
  offered:      { label: 'Offered',      color: '#f97316', emoji: '📨' },
  accepted:     { label: 'Accepted',     color: '#22c55e', emoji: '✅' },
  rejected:     { label: 'Rejected',     color: '#ef4444', emoji: '❌' },
  not_eligible: { label: 'Not Eligible', color: '#6b7280', emoji: '🚫' },
  pending:      { label: 'Pending',      color: '#eab308', emoji: '⏳' },
};

export interface QOCandidate {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  seasons: number;
  lastSalary: number;      // M
  qoAmount: number;        // M (always the same league-wide value)
  status: QOStatus;
  previousQO: boolean;     // has received QO before (can only get one)
  projectedMarket: number; // estimated FA contract AAV in M
  acceptChance: number;    // % likelihood they accept
  compPickValue: string;   // what comp pick you'd get if rejected
  warLastSeason: number;
}

export interface QOSummary {
  qoAmount: number;         // league-wide QO amount
  eligibleCount: number;
  offeredCount: number;
  acceptedCount: number;
  rejectedCount: number;
  expectedCompPicks: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

const QO_AMOUNT = 21.05; // 2024 QO amount in millions

export function calcAcceptChance(player: QOCandidate): number {
  // Players with lower market value are more likely to accept
  const marketRatio = player.projectedMarket / QO_AMOUNT;
  if (marketRatio >= 2.0) return 5;    // superstar, will definitely test FA
  if (marketRatio >= 1.5) return 15;
  if (marketRatio >= 1.2) return 30;
  if (marketRatio >= 1.0) return 50;
  if (marketRatio >= 0.8) return 70;
  return 85;  // QO is better than their market, likely to accept
}

export function getCompPickValue(overall: number): string {
  if (overall >= 80) return 'After Rd 1 (Tier A)';
  if (overall >= 75) return 'End of Rd 1 (Tier B)';
  if (overall >= 70) return 'After Rd 2 (Tier C)';
  return 'After Rd 4 (Tier D)';
}

export function makeOffer(player: QOCandidate): QOCandidate {
  return { ...player, status: 'offered' };
}

export function resolveOffer(player: QOCandidate): QOCandidate {
  // Simple demo resolution based on accept chance
  const accepted = player.acceptChance >= 50;
  return { ...player, status: accepted ? 'accepted' : 'rejected' };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const PLAYER_DATA = [
  { name: 'Corbin Burns', pos: 'SP', age: 29, overall: 88, war: 6.2, market: 38 },
  { name: 'Pete Alonso', pos: '1B', age: 29, overall: 82, war: 4.1, market: 28 },
  { name: 'Blake Snell', pos: 'SP', age: 31, overall: 80, war: 5.5, market: 30 },
  { name: 'Cody Bellinger', pos: 'CF', age: 28, overall: 76, war: 3.8, market: 22 },
  { name: 'Josh Hader', pos: 'CP', age: 30, overall: 78, war: 2.1, market: 20 },
  { name: 'Matt Chapman', pos: '3B', age: 31, overall: 74, war: 3.4, market: 18 },
  { name: 'Jordan Montgomery', pos: 'SP', age: 31, overall: 72, war: 2.8, market: 16 },
  { name: 'Tyler Glasnow', pos: 'SP', age: 30, overall: 79, war: 4.5, market: 25 },
  { name: 'Teoscar Hernandez', pos: 'LF', age: 31, overall: 73, war: 2.9, market: 15 },
  { name: 'Luis Robert', pos: 'CF', age: 27, overall: 81, war: 3.7, market: 26 },
];

export function generateDemoQOCandidates(): QOCandidate[] {
  return PLAYER_DATA.map((p, i) => {
    const projectedMarket = p.market;
    const candidate: QOCandidate = {
      id: i,
      name: p.name,
      pos: p.pos,
      age: p.age,
      overall: p.overall,
      seasons: 5 + (i % 6),
      lastSalary: Math.round((p.market * 0.8) * 10) / 10,
      qoAmount: QO_AMOUNT,
      status: i < 3 ? 'offered' : i < 5 ? 'eligible' : 'eligible',
      previousQO: i === 7, // one player previously received QO
      projectedMarket,
      acceptChance: 0,
      compPickValue: getCompPickValue(p.overall),
      warLastSeason: p.war,
    };
    candidate.acceptChance = calcAcceptChance(candidate);
    if (candidate.previousQO) candidate.status = 'not_eligible';
    return candidate;
  });
}

export function getQOSummary(candidates: QOCandidate[]): QOSummary {
  return {
    qoAmount: QO_AMOUNT,
    eligibleCount: candidates.filter(c => c.status === 'eligible').length,
    offeredCount: candidates.filter(c => c.status === 'offered' || c.status === 'pending').length,
    acceptedCount: candidates.filter(c => c.status === 'accepted').length,
    rejectedCount: candidates.filter(c => c.status === 'rejected').length,
    expectedCompPicks: candidates.filter(c => c.status === 'rejected').length,
  };
}
