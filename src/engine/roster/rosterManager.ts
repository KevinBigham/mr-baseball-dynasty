/**
 * Roster transaction validation & execution.
 * Stub — Sprint 04 branch surgery.
 */

import type { Player } from '../../types/player';
import type { RosterTransaction, TransactionLogEntry } from '../../types/roster';

export interface ValidationResult {
  valid: boolean;
  reason: string;
}

export function validateTransaction(
  _tx: RosterTransaction,
  _teamId: number,
  _playerMap: Map<number, Player>,
): ValidationResult {
  return { valid: true, reason: '' };
}

export function executeTransaction(
  _tx: RosterTransaction,
  _teamId: number,
  _playerMap: Map<number, Player>,
  _gameDay: number,
  _season: number,
  _log: TransactionLogEntry[],
): void {
  // stub
}

export function countFortyMan(playersOrTeamId: Player[] | number, teamIdOrPlayerMap?: number | Map<number, Player>): number {
  if (Array.isArray(playersOrTeamId)) {
    const players = playersOrTeamId;
    const teamId = teamIdOrPlayerMap as number;
    return players.filter(p => p.teamId === teamId && p.rosterData.isOn40Man).length;
  }
  const teamId = playersOrTeamId;
  const playerMap = teamIdOrPlayerMap as Map<number, Player>;
  let count = 0;
  for (const p of playerMap.values()) {
    if (p.teamId === teamId && p.rosterData.isOn40Man) count++;
  }
  return count;
}

export function countTwentySix(playersOrTeamId: Player[] | number, teamIdOrPlayerMap?: number | Map<number, Player>): number {
  if (Array.isArray(playersOrTeamId)) {
    const players = playersOrTeamId;
    const teamId = teamIdOrPlayerMap as number;
    return players.filter(p =>
      p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
    ).length;
  }
  const teamId = playersOrTeamId;
  const playerMap = teamIdOrPlayerMap as Map<number, Player>;
  let count = 0;
  for (const p of playerMap.values()) {
    if (p.teamId === teamId && p.rosterData.rosterStatus === 'MLB_ACTIVE') count++;
  }
  return count;
}
