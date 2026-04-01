import Dexie, { type Table } from 'dexie';

export interface SaveData {
  id: string;
  slotNumber: number;
  name: string;
  season: number;
  day: number;
  phase: string;
  gameState: string;
  createdAt: string;
  updatedAt: string;
}

class MBDDatabase extends Dexie {
  saves!: Table<SaveData, string>;

  constructor() {
    super('mbd-saves');
    this.version(1).stores({
      saves: 'id, slotNumber, updatedAt',
    });
  }
}

export const db = new MBDDatabase();

export async function saveGame(
  slot: number,
  name: string,
  state: object
): Promise<void> {
  const now = new Date().toISOString();
  const id = `save-slot-${slot}`;

  const existing = await db.saves.get(id);

  const saveData: SaveData = {
    id,
    slotNumber: slot,
    name,
    season: (state as { season?: number }).season ?? 1,
    day: (state as { day?: number }).day ?? 1,
    phase: (state as { phase?: string }).phase ?? 'preseason',
    gameState: JSON.stringify(state),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.saves.put(saveData);
}

export async function loadGame(
  slot: number
): Promise<SaveData | undefined> {
  const id = `save-slot-${slot}`;
  return db.saves.get(id);
}

export async function listSaves(): Promise<SaveData[]> {
  return db.saves.orderBy('slotNumber').toArray();
}

export async function deleteSave(slot: number): Promise<void> {
  const id = `save-slot-${slot}`;
  await db.saves.delete(id);
}
