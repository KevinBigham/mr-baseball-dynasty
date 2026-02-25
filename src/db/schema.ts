import Dexie, { type Table } from 'dexie';
import type { LeagueState } from '../types/league';

// ─── Save slot record ─────────────────────────────────────────────────────────
export interface SaveSlot {
  id?: number;
  name: string;
  season: number;
  userTeamName: string;
  timestamp: number; // Date.now()
  stateBlob: string; // JSON-stringified LeagueState (gzipped in cold tier)
}

// ─── Mr. Baseball Dynasty database ───────────────────────────────────────────
class MRBDDatabase extends Dexie {
  saves!: Table<SaveSlot, number>;

  constructor() {
    super('MrBaseballDynasty');
    this.version(1).stores({
      saves: '++id, name, season, timestamp',
    });
  }
}

export const db = new MRBDDatabase();

// ─── Save helpers ─────────────────────────────────────────────────────────────
export async function saveGame(
  state: LeagueState,
  slotName: string,
  userTeamName: string,
): Promise<number> {
  const slot: SaveSlot = {
    name: slotName,
    season: state.season,
    userTeamName,
    timestamp: Date.now(),
    stateBlob: JSON.stringify(state),
  };
  return db.saves.add(slot);
}

export async function loadGame(id: number): Promise<LeagueState | null> {
  const slot = await db.saves.get(id);
  if (!slot) return null;
  return JSON.parse(slot.stateBlob) as LeagueState;
}

export async function listSaves(): Promise<Omit<SaveSlot, 'stateBlob'>[]> {
  const slots = await db.saves.orderBy('timestamp').reverse().toArray();
  return slots.map(({ stateBlob: _b, ...rest }) => rest);
}

export async function deleteSave(id: number): Promise<void> {
  await db.saves.delete(id);
}
