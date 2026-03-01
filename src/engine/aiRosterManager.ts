/**
 * aiRosterManager.ts — AI mid-season roster management.
 *
 * After injury processing each season, AI teams need to:
 * 1. Fill open active roster spots caused by injuries (call up AAA prospects)
 * 2. Option underperforming MLB players when a prospect is clearly better
 * 3. Respect option years, 40-man limits, and service time rules
 *
 * This module is called from worker.ts after processSeasonInjuries().
 * The user team is never touched — only AI-controlled teams.
 */

import type { Player, Position, RosterStatus } from '../types/player';
import type { Team } from '../types/team';
import {
  promotePlayer, demotePlayer, dfaPlayer,
  countActive, count40Man,
  ACTIVE_ROSTER_LIMIT, FORTY_MAN_LIMIT,
} from './rosterActions';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AIRosterMoveType = 'call_up' | 'option' | 'dfa' | 'swap';

export interface AIRosterMove {
  teamId: number;
  teamAbbr: string;
  type: AIRosterMoveType;
  playerId: number;
  playerName: string;
  playerPosition: Position;
  playerOvr: number;
  fromStatus: RosterStatus;
  toStatus: RosterStatus;
  reason: string;
  /** For swaps: the player going the other direction */
  relatedPlayerId?: number;
  relatedPlayerName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTeamMLBPlayers(players: Player[], teamId: number): Player[] {
  return players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE');
}

function getTeamILPlayers(players: Player[], teamId: number): Player[] {
  return players.filter(p =>
    p.teamId === teamId &&
    (p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60')
  );
}

function getTeamAAAPlayers(players: Player[], teamId: number): Player[] {
  return players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus === 'MINORS_AAA');
}

function getPositionNeed(activePlayers: Player[], ilPlayers: Player[]): Position | null {
  // Find positions that were lost to injury and not covered
  const activePositions = new Map<string, number>();
  for (const p of activePlayers) {
    activePositions.set(p.position, (activePositions.get(p.position) ?? 0) + 1);
  }

  const minCounts: Record<string, number> = {
    C: 1, '1B': 1, '2B': 1, SS: 1, '3B': 1,
    LF: 1, CF: 1, RF: 1, SP: 4, RP: 4,
  };

  // Check which injured positions are now below minimums
  for (const ilPlayer of ilPlayers) {
    const pos = ilPlayer.position;
    const current = activePositions.get(pos) ?? 0;
    const minimum = minCounts[pos] ?? 1;
    if (current < minimum) {
      return pos as Position;
    }
  }

  return null;
}

function findBestProspect(
  aaaPlayers: Player[],
  position: Position | null,
  allPlayers: Player[],
  teamId: number,
): Player | null {
  let candidates = aaaPlayers;

  // Prefer matching position if specified
  if (position) {
    const posMatches = candidates.filter(p => p.position === position);
    if (posMatches.length > 0) {
      candidates = posMatches;
    }
  }

  // Sort by overall descending
  candidates.sort((a, b) => b.overall - a.overall);

  // Find one that can actually be promoted (40-man check)
  for (const prospect of candidates) {
    if (prospect.rosterData.isOn40Man) {
      return prospect; // Already on 40-man, can promote
    }
    // Check if 40-man has room
    if (count40Man(allPlayers, teamId) < FORTY_MAN_LIMIT) {
      return prospect;
    }
  }

  return null;
}

// ─── Underperformer detection ────────────────────────────────────────────────

interface SwapCandidate {
  mlbPlayer: Player;
  prospect: Player;
  ovrGap: number;
}

/**
 * Find MLB players who could be optioned in favor of a better AAA prospect.
 * Only considers players with option years remaining.
 */
function findSwapCandidates(
  activePlayers: Player[],
  aaaPlayers: Player[],
): SwapCandidate[] {
  const swaps: SwapCandidate[] = [];

  for (const mlb of activePlayers) {
    // Skip if no options remaining or already used option this season
    if (mlb.rosterData.optionYearsRemaining <= 0) continue;
    // Skip if veteran (3+ years service) with no options
    if (mlb.rosterData.serviceTimeDays >= 172 * 3 && mlb.rosterData.optionYearsRemaining <= 0) continue;

    // Find AAA prospects at same position with significantly higher OVR
    const betterProspects = aaaPlayers.filter(p =>
      p.position === mlb.position && p.overall > mlb.overall + 80 // ~13 scouting grade points
    );

    if (betterProspects.length > 0) {
      const best = betterProspects.reduce((a, b) => b.overall > a.overall ? b : a);
      swaps.push({
        mlbPlayer: mlb,
        prospect: best,
        ovrGap: best.overall - mlb.overall,
      });
    }
  }

  // Sort by biggest OVR gap (most impactful swaps first)
  swaps.sort((a, b) => b.ovrGap - a.ovrGap);
  return swaps;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Process AI roster moves for all non-user teams.
 * Called after injury processing in worker.ts simulateSeason().
 *
 * @param players  — all players in the league (mutated in place)
 * @param teams    — all teams
 * @param userTeamId — user's team ID (skipped)
 * @param seed     — deterministic seed for move ordering
 * @returns array of roster moves for display
 */
export function processAIRosterMoves(
  players: Player[],
  teams: Team[],
  userTeamId: number,
  seed: number,
): AIRosterMove[] {
  const moves: AIRosterMove[] = [];

  // Process teams in deterministic order based on seed
  const teamOrder = teams
    .filter(t => t.teamId !== userTeamId)
    .sort((a, b) => {
      const hashA = (a.teamId * 7919 + seed) % 10000;
      const hashB = (b.teamId * 7919 + seed) % 10000;
      return hashA - hashB;
    });

  for (const team of teamOrder) {
    const tid = team.teamId;
    const ilPlayers = getTeamILPlayers(players, tid);
    const aaaPlayers = getTeamAAAPlayers(players, tid);
    const activeCount = countActive(players, tid);

    // ── Phase 1: Fill empty roster spots from injuries ───────────────────
    if (activeCount < ACTIVE_ROSTER_LIMIT && aaaPlayers.length > 0) {
      const spotsToFill = Math.min(
        ACTIVE_ROSTER_LIMIT - activeCount,
        3, // Cap at 3 call-ups per team per season to be realistic
      );

      for (let i = 0; i < spotsToFill; i++) {
        const posNeed = getPositionNeed(
          getTeamMLBPlayers(players, tid),
          ilPlayers,
        );
        const prospect = findBestProspect(
          getTeamAAAPlayers(players, tid),
          posNeed,
          players,
          tid,
        );

        if (!prospect) break;

        const fromStatus = prospect.rosterData.rosterStatus;
        const result = promotePlayer(prospect, 'MLB_ACTIVE', players);

        if (result.ok) {
          const reason = posNeed
            ? `Called up to fill ${posNeed} gap from IL`
            : 'Called up to fill active roster spot';

          moves.push({
            teamId: tid,
            teamAbbr: team.abbreviation,
            type: 'call_up',
            playerId: prospect.playerId,
            playerName: prospect.name,
            playerPosition: prospect.position,
            playerOvr: prospect.overall,
            fromStatus,
            toStatus: 'MLB_ACTIVE',
            reason,
          });
        }
      }
    }

    // ── Phase 2: Swap underperformers for better prospects ───────────────
    // Only do 1 swap per team per season to avoid roster churn
    const refreshedActive = getTeamMLBPlayers(players, tid);
    const refreshedAAA = getTeamAAAPlayers(players, tid);
    const swapCandidates = findSwapCandidates(refreshedActive, refreshedAAA);

    if (swapCandidates.length > 0) {
      const swap = swapCandidates[0]; // Best swap only
      const mlb = swap.mlbPlayer;
      const prospect = swap.prospect;

      // Demote the underperformer
      const mlbFromStatus = mlb.rosterData.rosterStatus;
      const demoteResult = demotePlayer(mlb, 'MINORS_AAA');

      if (demoteResult.ok) {
        // Promote the prospect
        const prospectFromStatus = prospect.rosterData.rosterStatus;
        const promoteResult = promotePlayer(prospect, 'MLB_ACTIVE', players);

        if (promoteResult.ok) {
          moves.push({
            teamId: tid,
            teamAbbr: team.abbreviation,
            type: 'option',
            playerId: mlb.playerId,
            playerName: mlb.name,
            playerPosition: mlb.position,
            playerOvr: mlb.overall,
            fromStatus: mlbFromStatus,
            toStatus: 'MINORS_AAA',
            reason: `Optioned to make room for ${prospect.name}`,
            relatedPlayerId: prospect.playerId,
            relatedPlayerName: prospect.name,
          });
          moves.push({
            teamId: tid,
            teamAbbr: team.abbreviation,
            type: 'call_up',
            playerId: prospect.playerId,
            playerName: prospect.name,
            playerPosition: prospect.position,
            playerOvr: prospect.overall,
            fromStatus: prospectFromStatus,
            toStatus: 'MLB_ACTIVE',
            reason: `Promoted to replace ${mlb.name}`,
            relatedPlayerId: mlb.playerId,
            relatedPlayerName: mlb.name,
          });
        }
      }
    }

    // ── Phase 3: DFA severely underperforming veterans on 40-man ─────────
    // Only DFA a player if they're very low OVR (<150) and on 40-man
    // This frees 40-man spots for prospects
    const fortyManCount = count40Man(players, tid);
    if (fortyManCount >= FORTY_MAN_LIMIT - 2) {
      // 40-man is nearly full — look for dead weight
      const fortyManPlayers = players.filter(p =>
        p.teamId === tid &&
        p.rosterData.isOn40Man &&
        p.rosterData.rosterStatus !== 'MLB_ACTIVE' &&
        p.rosterData.rosterStatus !== 'MLB_IL_10' &&
        p.rosterData.rosterStatus !== 'MLB_IL_60' &&
        p.overall < 150 // Very low OVR = below replacement
      );

      // DFA at most 1 per season
      if (fortyManPlayers.length > 0) {
        const worst = fortyManPlayers.reduce((a, b) => a.overall < b.overall ? a : b);
        const fromStatus = worst.rosterData.rosterStatus;
        const dfaResult = dfaPlayer(worst);

        if (dfaResult.ok) {
          moves.push({
            teamId: tid,
            teamAbbr: team.abbreviation,
            type: 'dfa',
            playerId: worst.playerId,
            playerName: worst.name,
            playerPosition: worst.position,
            playerOvr: worst.overall,
            fromStatus,
            toStatus: 'DFA',
            reason: '40-man roster crunch — designated for assignment',
          });
        }
      }
    }
  }

  return moves;
}
