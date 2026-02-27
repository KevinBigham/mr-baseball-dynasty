import type { TradeRecord } from '../engine/trade/tradeEngine';
import type { FreeAgent, FreeAgencyResult } from '../engine/offseason/freeAgency';

export type { TradeRecord, FreeAgent, FreeAgencyResult };

// ─── Lineup data ────────────────────────────────────────────────────────────────

export interface LineupData {
  teamId: number;
  battingOrder: number[];     // 9 player IDs in batting order
  rotation: number[];         // 5 SP player IDs in rotation order
  closer: number | null;      // CL player ID
}

// ─── Trade center view data ─────────────────────────────────────────────────────

export interface TradeablePlayer {
  playerId:    number;
  name:        string;
  position:    string;
  age:         number;
  overall:     number;
  potential:   number;
  tradeValue:  number;
  salary:      number;
  contractYrs: number;
  rosterStatus: string;
  isPitcher:   boolean;
}
