/**
 * Ring of Honor — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's ring-of-honor system.
 * Tracks retired player honors per team:
 *   - Players with OVR 65+ are automatically nominated when they leave
 *   - Franchise legends (OVR 75+) get special recognition
 *   - Number retirement, induction year, reason for honor
 *   - Team-specific ring of honor display
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RingOfHonorEntry {
  name:       string;
  position:   string;
  number:     number;
  year:       number;      // Year inducted
  peakOvr:    number;
  seasons:    number;       // Seasons with the team
  reason:     string;
  tier:       'legend' | 'star' | 'fan_favorite';
}

export type RingOfHonorDB = Record<number, RingOfHonorEntry[]>; // teamId → entries

// ─── Nominate for Ring of Honor ───────────────────────────────────────────────

export function nominateForRing(
  db: RingOfHonorDB,
  teamId: number,
  player: {
    name: string;
    position: string;
    overall: number;
    age: number;
    seasonsWithTeam?: number;
  },
  year: number,
): boolean {
  if (!db[teamId]) db[teamId] = [];

  // No duplicates
  if (db[teamId]!.some(h => h.name === player.name)) return false;

  // Minimum OVR threshold
  if (player.overall < 65) return false;

  const tier: RingOfHonorEntry['tier'] =
    player.overall >= 75 ? 'legend' :
    player.overall >= 70 ? 'star' :
    'fan_favorite';

  const reason =
    player.overall >= 75 ? 'Franchise legend — defined an era' :
    player.overall >= 70 ? 'Star performer — fan favorite for years' :
    'Beloved veteran — earned the respect of the clubhouse';

  // Deterministic jersey number based on position
  const baseNumbers: Record<string, number> = {
    'C': 8, 'SS': 2, '2B': 4, '3B': 5, '1B': 25, 'LF': 7, 'CF': 1, 'RF': 21, 'DH': 34,
    'SP': 32, 'RP': 47, 'CL': 42,
  };
  const base = baseNumbers[player.position] ?? 15;
  const offset = db[teamId]!.length;
  const number = base + offset;

  db[teamId]!.push({
    name: player.name,
    position: player.position,
    number,
    year,
    peakOvr: player.overall,
    seasons: player.seasonsWithTeam ?? 1,
    reason,
    tier,
  });

  return true;
}

// ─── Auto-induct after retirement ─────────────────────────────────────────────

export function autoRingOfHonor(
  db: RingOfHonorDB,
  retiredPlayers: Array<{
    name: string;
    position: string;
    overall: number;
    age: number;
    teamId: number;
    seasonsWithTeam?: number;
  }>,
  year: number,
): RingOfHonorEntry[] {
  const inducted: RingOfHonorEntry[] = [];

  for (const p of retiredPlayers) {
    if (p.overall >= 65) {
      const success = nominateForRing(db, p.teamId, p, year);
      if (success) {
        const entries = db[p.teamId] ?? [];
        const last = entries[entries.length - 1];
        if (last) inducted.push(last);
      }
    }
  }

  return inducted;
}

// ─── Get Ring of Honor for a team ─────────────────────────────────────────────

export function getRingOfHonor(
  db: RingOfHonorDB,
  teamId: number,
): RingOfHonorEntry[] {
  return (db[teamId] ?? []).slice().sort((a, b) => b.peakOvr - a.peakOvr);
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const TIER_DISPLAY: Record<RingOfHonorEntry['tier'], { label: string; color: string; icon: string }> = {
  legend:       { label: 'FRANCHISE LEGEND', color: '#fbbf24', icon: '👑' },
  star:         { label: 'STAR',             color: '#3b82f6', icon: '⭐' },
  fan_favorite: { label: 'FAN FAVORITE',     color: '#22c55e', icon: '❤️' },
};
