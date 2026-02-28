/**
 * Trade Deadline Engine — Mr. Baseball Dynasty
 *
 * Mid-season trade deadline simulation:
 *   - Identifies buyers (contenders) and sellers (rebuilders)
 *   - Generates realistic deadline deals
 *   - Rental players, prospect-for-veteran swaps
 *   - Trade deadline is after ~100 games (game 100 of 162)
 *
 * Inspired by OOTP's trade deadline events.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { calculatePlayerValue, assessTeamNeeds } from './valuation';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface DeadlineDeal {
  buyerTeamId:    number;
  buyerTeamName:  string;
  sellerTeamId:   number;
  sellerTeamName: string;
  playersTobuyer:  Array<{ playerId: number; name: string; position: string; overall: number }>;
  playersToSeller: Array<{ playerId: number; name: string; position: string; overall: number }>;
  headline:       string;
}

export interface TradeDeadlineResult {
  deals:        DeadlineDeal[];
  buyerTeams:   number[];  // teamIds
  sellerTeams:  number[];
}

// ─── Categorize teams ───────────────────────────────────────────────────────────

function categorizeTeams(teams: Team[]): { buyers: Team[]; sellers: Team[]; neutral: Team[] } {
  // After ~100 games, classify by record
  const sorted = [...teams].sort((a, b) => {
    const aPct = a.seasonRecord.wins / Math.max(1, a.seasonRecord.wins + a.seasonRecord.losses);
    const bPct = b.seasonRecord.wins / Math.max(1, b.seasonRecord.wins + b.seasonRecord.losses);
    return bPct - aPct;
  });

  const buyers: Team[] = [];
  const sellers: Team[] = [];
  const neutral: Team[] = [];

  for (const team of sorted) {
    const total = team.seasonRecord.wins + team.seasonRecord.losses;
    if (total < 50) { neutral.push(team); continue; } // Not enough games played

    const winPct = team.seasonRecord.wins / total;

    if (winPct >= 0.540) buyers.push(team);       // On pace for 87+ wins
    else if (winPct <= 0.460) sellers.push(team);  // On pace for 75- wins
    else neutral.push(team);
  }

  return { buyers, sellers, neutral };
}

// ─── Generate deadline deals ────────────────────────────────────────────────────

export function simulateTradeDeadline(
  players: Player[],
  teams: Team[],
  userTeamId: number,
): TradeDeadlineResult {
  const { buyers, sellers } = categorizeTeams(teams);
  const deals: DeadlineDeal[] = [];

  // Skip user team from AI deals (user manages their own trades)
  const aiBuyers = buyers.filter(t => t.teamId !== userTeamId);
  const aiSellers = sellers.filter(t => t.teamId !== userTeamId);

  for (const buyer of aiBuyers) {
    // Each buyer tries to make one deal
    if (aiSellers.length === 0) break;

    const buyerNeeds = assessTeamNeeds(buyer, players);
    const topNeed = buyerNeeds.needs[0];
    if (!topNeed || topNeed.urgency < 3) continue;

    // Find a seller with a player matching the need
    for (const seller of aiSellers) {
      const sellerPlayers = players.filter(p =>
        p.teamId === seller.teamId &&
        p.rosterData.rosterStatus === 'MLB_ACTIVE' &&
        p.position === topNeed.position &&
        calculatePlayerValue(p) >= 30
      );

      if (sellerPlayers.length === 0) continue;

      // Best player at the needed position
      const target = sellerPlayers.sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a))[0];

      // Find prospects to send back
      const buyerProspects = players.filter(p =>
        p.teamId === buyer.teamId &&
        p.rosterData.rosterStatus.startsWith('MINORS_') &&
        calculatePlayerValue(p) >= 15
      ).sort((a, b) => calculatePlayerValue(b) - calculatePlayerValue(a));

      if (buyerProspects.length === 0) continue;

      // Value matching: send enough prospects to roughly match
      const targetValue = calculatePlayerValue(target);
      let packageValue = 0;
      const prospectsToSend: Player[] = [];

      for (const prospect of buyerProspects) {
        if (packageValue >= targetValue * 0.7) break;
        prospectsToSend.push(prospect);
        packageValue += calculatePlayerValue(prospect);
        if (prospectsToSend.length >= 3) break; // Max 3 prospects per deal
      }

      if (packageValue < targetValue * 0.5) continue; // Not enough

      // Execute the deal
      target.teamId = buyer.teamId;
      for (const p of prospectsToSend) {
        p.teamId = seller.teamId;
      }

      const deal: DeadlineDeal = {
        buyerTeamId: buyer.teamId,
        buyerTeamName: buyer.name,
        sellerTeamId: seller.teamId,
        sellerTeamName: seller.name,
        playersTobuyer: [{
          playerId: target.playerId,
          name: target.name,
          position: target.position,
          overall: target.overall,
        }],
        playersToSeller: prospectsToSend.map(p => ({
          playerId: p.playerId,
          name: p.name,
          position: p.position,
          overall: p.overall,
        })),
        headline: `${buyer.name} acquire ${target.position} ${target.name} from ${seller.name}`,
      };

      deals.push(deal);
      break; // One deal per buyer
    }
  }

  return {
    deals,
    buyerTeams: buyers.map(t => t.teamId),
    sellerTeams: sellers.map(t => t.teamId),
  };
}
