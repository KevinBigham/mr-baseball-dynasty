/**
 * Manager Legacy Tracking
 *
 * Tracks the manager's career record across seasons — wins, losses,
 * pennants, rings, ejections, best seasons, and team history.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LegacyTier = 'legendary' | 'elite' | 'respected' | 'average' | 'struggling' | 'new';

export const TIER_DISPLAY: Record<LegacyTier, { label: string; color: string; emoji: string; minWins: number }> = {
  legendary:  { label: 'Legendary',  color: '#eab308', emoji: '👑', minWins: 1200 },
  elite:      { label: 'Elite',      color: '#22c55e', emoji: '🏆', minWins: 800 },
  respected:  { label: 'Respected',  color: '#3b82f6', emoji: '📋', minWins: 400 },
  average:    { label: 'Average',    color: '#94a3b8', emoji: '📊', minWins: 200 },
  struggling: { label: 'Struggling', color: '#ef4444', emoji: '⚠️', minWins: 50 },
  new:        { label: 'Rookie Mgr', color: '#6b7280', emoji: '🆕', minWins: 0 },
};

export interface SeasonRecord {
  year: number;
  team: string;
  wins: number;
  losses: number;
  wpct: number;
  madePlayoffs: boolean;
  wonPennant: boolean;
  wonWS: boolean;
  ejections: number;
  managerOfYear: boolean;
}

export interface ManagerLegacyState {
  name: string;
  totalWins: number;
  totalLosses: number;
  wpct: number;
  rings: number;
  pennants: number;
  playoffApps: number;
  ejections: number;
  managerOfYearAwards: number;
  seasonsManaged: number;
  teamsManaged: string[];
  seasonHistory: SeasonRecord[];
  bestSeason: SeasonRecord | null;
  currentStreak: { type: 'W' | 'L'; count: number };
  tier: LegacyTier;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getTier(totalWins: number): LegacyTier {
  if (totalWins >= 1200) return 'legendary';
  if (totalWins >= 800) return 'elite';
  if (totalWins >= 400) return 'respected';
  if (totalWins >= 200) return 'average';
  if (totalWins >= 50) return 'struggling';
  return 'new';
}

export function calcWpct(w: number, l: number): number {
  return w + l > 0 ? Math.round((w / (w + l)) * 1000) / 1000 : 0;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoLegacy(): ManagerLegacyState {
  const seasons: SeasonRecord[] = [
    { year: 2020, team: 'NYM', wins: 72, losses: 90, wpct: 0.444, madePlayoffs: false, wonPennant: false, wonWS: false, ejections: 3, managerOfYear: false },
    { year: 2021, team: 'NYM', wins: 85, losses: 77, wpct: 0.525, madePlayoffs: true, wonPennant: false, wonWS: false, ejections: 2, managerOfYear: false },
    { year: 2022, team: 'NYM', wins: 91, losses: 71, wpct: 0.562, madePlayoffs: true, wonPennant: false, wonWS: false, ejections: 4, managerOfYear: false },
    { year: 2023, team: 'NYM', wins: 98, losses: 64, wpct: 0.605, madePlayoffs: true, wonPennant: true, wonWS: false, ejections: 1, managerOfYear: true },
    { year: 2024, team: 'NYM', wins: 103, losses: 59, wpct: 0.636, madePlayoffs: true, wonPennant: true, wonWS: true, ejections: 2, managerOfYear: true },
    { year: 2025, team: 'NYM', wins: 88, losses: 74, wpct: 0.543, madePlayoffs: true, wonPennant: false, wonWS: false, ejections: 3, managerOfYear: false },
  ];

  const totalWins = seasons.reduce((s, r) => s + r.wins, 0);
  const totalLosses = seasons.reduce((s, r) => s + r.losses, 0);
  const best = seasons.reduce((b, s) => s.wpct > (b?.wpct ?? 0) ? s : b, seasons[0]);

  return {
    name: 'Skip Henderson',
    totalWins,
    totalLosses,
    wpct: calcWpct(totalWins, totalLosses),
    rings: seasons.filter(s => s.wonWS).length,
    pennants: seasons.filter(s => s.wonPennant).length,
    playoffApps: seasons.filter(s => s.madePlayoffs).length,
    ejections: seasons.reduce((s, r) => s + r.ejections, 0),
    managerOfYearAwards: seasons.filter(s => s.managerOfYear).length,
    seasonsManaged: seasons.length,
    teamsManaged: ['NYM'],
    seasonHistory: seasons,
    bestSeason: best,
    currentStreak: { type: 'W', count: 3 },
    tier: getTier(totalWins),
  };
}
