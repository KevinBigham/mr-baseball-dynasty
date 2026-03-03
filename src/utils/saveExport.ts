import pako from 'pako';
import type { LeagueState } from '../types/league';

const REQUIRED_FIELDS = ['season', 'teams', 'players', 'schedule'] as const;

export function validateSaveState(data: unknown): data is LeagueState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return REQUIRED_FIELDS.every(f => f in obj);
}

export async function exportSave(state: LeagueState): Promise<void> {
  const json = JSON.stringify(state);
  const compressed = pako.gzip(json);
  const blob = new Blob([compressed], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `mrbd-s${state.season}.mrbd.gz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importSave(file: File): Promise<LeagueState> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let json: string;
  try {
    // Try gzip first
    const decompressed = pako.ungzip(bytes, { to: 'string' });
    json = decompressed;
  } catch {
    // Maybe raw JSON
    json = new TextDecoder().decode(bytes);
  }

  const data = JSON.parse(json);

  if (!validateSaveState(data)) {
    throw new Error('Invalid save file: missing required fields (season, teams, players, schedule)');
  }

  return data as LeagueState;
}
