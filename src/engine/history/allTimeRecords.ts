/**
 * All-Time Records Tracker
 *
 * Tracks franchise records across batting, pitching, and team
 * categories. Shows current leaders, historical records, and
 * active players on pace to break records.
 *
 * Ported/inspired from football dynasty all-time-records.js,
 * fully adapted for baseball stat categories.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type RecordCategory = 'batting' | 'pitching' | 'team';

export interface RecordEntry {
  id: string;
  label: string;
  category: RecordCategory;
  stat: string;
  record: number;
  holderName: string;
  holderSeason: number;
  isActive: boolean;
  format: 'integer' | 'decimal' | 'pct';
  higherIsBetter: boolean;
}

export interface RecordChase {
  recordId: string;
  recordLabel: string;
  recordValue: number;
  holderName: string;
  chaserName: string;
  chaserValue: number;
  pace: number;
  pctOfRecord: number;
  gamesRemaining: number;
}

// ── Record definitions ──────────────────────────────────────────────────────

export const RECORD_DEFS: RecordEntry[] = [
  // Batting
  { id: 'season_hr',  label: 'Home Runs (Season)',    category: 'batting',  stat: 'hr',   record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_rbi', label: 'RBI (Season)',          category: 'batting',  stat: 'rbi',  record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_avg', label: 'Batting Average (Season)', category: 'batting', stat: 'avg', record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'decimal', higherIsBetter: true },
  { id: 'season_hits', label: 'Hits (Season)',        category: 'batting',  stat: 'hits', record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_sb',  label: 'Stolen Bases (Season)', category: 'batting',  stat: 'sb',   record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_runs', label: 'Runs (Season)',        category: 'batting',  stat: 'runs', record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_bb',  label: 'Walks (Season)',        category: 'batting',  stat: 'bb',   record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_ops', label: 'OPS (Season)',          category: 'batting',  stat: 'ops',  record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'decimal', higherIsBetter: true },
  // Pitching
  { id: 'season_wins', label: 'Wins (Season)',        category: 'pitching', stat: 'w',    record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_era',  label: 'ERA (Season)',         category: 'pitching', stat: 'era',  record: 99, holderName: '—', holderSeason: 0, isActive: false, format: 'decimal', higherIsBetter: false },
  { id: 'season_so',   label: 'Strikeouts (Season)',  category: 'pitching', stat: 'so',   record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_saves', label: 'Saves (Season)',      category: 'pitching', stat: 'sv',   record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'season_whip', label: 'WHIP (Season)',        category: 'pitching', stat: 'whip', record: 99, holderName: '—', holderSeason: 0, isActive: false, format: 'decimal', higherIsBetter: false },
  // Team
  { id: 'team_wins',    label: 'Team Wins (Season)',     category: 'team', stat: 'tw',  record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'team_runs_for', label: 'Runs Scored (Season)',  category: 'team', stat: 'rs',  record: 0, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: true },
  { id: 'team_runs_ag', label: 'Fewest Runs Allowed',   category: 'team', stat: 'ra',  record: 9999, holderName: '—', holderSeason: 0, isActive: false, format: 'integer', higherIsBetter: false },
];

// ── Demo population ─────────────────────────────────────────────────────────

export function populateDemoRecords(): RecordEntry[] {
  return RECORD_DEFS.map(r => {
    switch (r.id) {
      case 'season_hr':   return { ...r, record: 44, holderName: 'Marcus Bell', holderSeason: 2 };
      case 'season_rbi':  return { ...r, record: 118, holderName: 'Marcus Bell', holderSeason: 2 };
      case 'season_avg':  return { ...r, record: 0.328, holderName: 'Carlos Reyes', holderSeason: 3 };
      case 'season_hits': return { ...r, record: 198, holderName: 'Carlos Reyes', holderSeason: 3 };
      case 'season_sb':   return { ...r, record: 42, holderName: 'Carlos Reyes', holderSeason: 3 };
      case 'season_runs': return { ...r, record: 112, holderName: 'Marcus Bell', holderSeason: 2 };
      case 'season_bb':   return { ...r, record: 94, holderName: 'David Chen', holderSeason: 3 };
      case 'season_ops':  return { ...r, record: 0.952, holderName: 'Marcus Bell', holderSeason: 2 };
      case 'season_wins': return { ...r, record: 18, holderName: "James O'Brien", holderSeason: 2 };
      case 'season_era':  return { ...r, record: 2.68, holderName: "James O'Brien", holderSeason: 2 };
      case 'season_so':   return { ...r, record: 224, holderName: "James O'Brien", holderSeason: 2 };
      case 'season_saves':return { ...r, record: 38, holderName: 'Ryan Parker', holderSeason: 3 };
      case 'season_whip': return { ...r, record: 1.02, holderName: "James O'Brien", holderSeason: 2 };
      case 'team_wins':   return { ...r, record: 98, holderName: 'Season 3', holderSeason: 3 };
      case 'team_runs_for': return { ...r, record: 812, holderName: 'Season 2', holderSeason: 2 };
      case 'team_runs_ag':  return { ...r, record: 618, holderName: 'Season 3', holderSeason: 3 };
      default: return r;
    }
  });
}

// ── Record chase detection ──────────────────────────────────────────────────

export function detectRecordChases(
  records: RecordEntry[],
  currentStats: Array<{ name: string; stat: string; value: number; games: number }>,
  totalGames: number = 162,
): RecordChase[] {
  const chases: RecordChase[] = [];

  for (const cs of currentStats) {
    const record = records.find(r => r.stat === cs.stat);
    if (!record) continue;

    const gamesRemaining = Math.max(0, totalGames - cs.games);
    const pace = cs.games > 0 ? Math.round((cs.value / cs.games) * totalGames * 100) / 100 : 0;

    const isChasing = record.higherIsBetter
      ? pace > record.record * 0.9
      : pace < record.record * 1.1 && pace > 0;

    if (isChasing && record.record > 0) {
      const pctOfRecord = record.higherIsBetter
        ? Math.round((cs.value / record.record) * 100)
        : Math.round((record.record / Math.max(0.01, cs.value)) * 100);

      chases.push({
        recordId: record.id,
        recordLabel: record.label,
        recordValue: record.record,
        holderName: record.holderName,
        chaserName: cs.name,
        chaserValue: cs.value,
        pace,
        pctOfRecord: Math.min(100, pctOfRecord),
        gamesRemaining,
      });
    }
  }

  return chases.sort((a, b) => b.pctOfRecord - a.pctOfRecord);
}

export const CATEGORY_DISPLAY: Record<RecordCategory, { label: string; color: string; icon: string }> = {
  batting:  { label: 'BATTING',  color: '#f97316', icon: '⚾' },
  pitching: { label: 'PITCHING', color: '#3b82f6', icon: '💨' },
  team:     { label: 'TEAM',     color: '#22c55e', icon: '🏟️' },
};
