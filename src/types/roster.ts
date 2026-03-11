/**
 * Roster transaction types.
 * Stub — Sprint 04 branch surgery.
 */

import type { RosterStatus } from './player';

export type RosterTransactionType =
  | 'CALL_UP'
  | 'OPTION'
  | 'DFA'
  | 'PLACE_IL'
  | 'ACTIVATE_IL'
  | 'WAIVER_CLAIM'
  | 'OUTRIGHT'
  | 'RELEASE'
  | 'SIGN_FA'
  | 'DRAFT_PICK'
  | 'RULE_5_SELECT'
  | 'RULE_5_RETURN'
  | 'ADD_TO_40_MAN'
  | 'RETIREMENT'
  | 'TRADE';

export type RosterTransaction =
  | { type: 'TRADE'; playerIds: number[]; fromTeamId: number; toTeamId: number }
  | { type: 'CALL_UP'; playerId: number }
  | { type: 'OPTION'; playerId: number }
  | { type: 'DFA'; playerId: number }
  | { type: 'PLACE_IL'; playerId: number }
  | { type: 'ACTIVATE_IL'; playerId: number }
  | { type: 'WAIVER_CLAIM'; playerId: number }
  | { type: 'OUTRIGHT'; playerId: number }
  | { type: 'RELEASE'; playerId: number }
  | { type: 'SIGN_FA'; playerId: number; teamId: number; years: number; salary: number }
  | { type: 'DRAFT_PICK'; playerId: number; teamId: number; round: number; pick: number }
  | { type: 'RULE_5_SELECT'; playerId: number; selectingTeamId: number }
  | { type: 'RULE_5_RETURN'; playerId: number }
  | { type: 'ADD_TO_40_MAN'; playerId: number }
  | { type: 'RETIREMENT'; playerId: number };

export interface TransactionLogEntry {
  date: number;
  season: number;
  teamId: number;
  transaction: RosterTransaction;
  description: string;
}

export { RosterStatus };
