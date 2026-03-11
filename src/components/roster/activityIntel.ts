/**
 * Activity intel aggregation.
 * Stub — Sprint 04 branch surgery.
 */

import type { TransactionLogEntry } from '../../types/roster';

export interface ActivityIntelQuery {
  teamId?: number;
  conferenceId?: number;
  divisionId?: number;
  limit?: number;
}

export interface ActivityIntelResponse {
  transactions: TransactionLogEntry[];
  totalCount: number;
}

export interface ActivityIntelInput {
  transactionLog: TransactionLogEntry[];
  teams: Array<{ teamId: number; conferenceId: number; divisionId: number }>;
  request: ActivityIntelQuery;
  maxHistoryLimit: number;
}

export function computeActivityIntelAggregate(input: ActivityIntelInput): ActivityIntelResponse {
  let filtered = input.transactionLog;
  if (input.request.teamId != null) {
    filtered = filtered.filter(e => e.teamId === input.request.teamId);
  }
  const limit = input.request.limit ?? input.maxHistoryLimit;
  return {
    transactions: filtered.slice(-limit),
    totalCount: filtered.length,
  };
}
