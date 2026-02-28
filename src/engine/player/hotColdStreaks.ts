/**
 * Hot/Cold Streaks System
 *
 * Tracks player hot and cold streaks based on recent performance.
 * Streak status affects in-game OVR adjustments and provides
 * visual indicators for lineup decisions.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type StreakType = 'on_fire' | 'hot' | 'warm' | 'neutral' | 'cold' | 'ice_cold';

export const STREAK_DISPLAY: Record<StreakType, { label: string; emoji: string; color: string; ovrMod: number }> = {
  on_fire:   { label: 'On Fire',    emoji: '🔥', color: '#ef4444', ovrMod: +5 },
  hot:       { label: 'Hot',        emoji: '🌡️', color: '#f97316', ovrMod: +3 },
  warm:      { label: 'Warm',       emoji: '☀️', color: '#eab308', ovrMod: +1 },
  neutral:   { label: 'Neutral',    emoji: '➖', color: '#6b7280', ovrMod: 0 },
  cold:      { label: 'Cold',       emoji: '❄️', color: '#3b82f6', ovrMod: -2 },
  ice_cold:  { label: 'Ice Cold',   emoji: '🥶', color: '#1d4ed8', ovrMod: -4 },
};

export interface StreakPlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  adjustedOvr: number;
  streak: StreakType;
  streakLength: number;  // games
  last10: { gp: number; avg: string; hr: number; rbi: number; ops: string } | null;
  last10Pitching: { gp: number; era: string; k: number; whip: string } | null;
  isPitcher: boolean;
  trending: 'up' | 'down' | 'stable';
  recentGames: Array<{ date: string; result: string; highlight: string }>;
}

export interface StreakSummary {
  onFire: number;
  hot: number;
  cold: number;
  iceCold: number;
  avgAdjustment: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getAdjustedOvr(baseOvr: number, streak: StreakType): number {
  return Math.min(99, Math.max(30, baseOvr + STREAK_DISPLAY[streak].ovrMod));
}

export function getStreakSummary(players: StreakPlayer[]): StreakSummary {
  const totalMod = players.reduce((s, p) => s + STREAK_DISPLAY[p.streak].ovrMod, 0);
  return {
    onFire: players.filter(p => p.streak === 'on_fire').length,
    hot: players.filter(p => p.streak === 'hot').length,
    cold: players.filter(p => p.streak === 'cold').length,
    iceCold: players.filter(p => p.streak === 'ice_cold').length,
    avgAdjustment: Math.round((totalMod / players.length) * 10) / 10,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const HITTER_DATA: Array<{ name: string; pos: string; ovr: number; streak: StreakType; len: number; avg: string; hr: number; rbi: number; ops: string }> = [
  { name: 'Aaron Judge', pos: 'RF', ovr: 92, streak: 'on_fire', len: 12, avg: '.385', hr: 6, rbi: 14, ops: '1.250' },
  { name: 'Shohei Ohtani', pos: 'DH', ovr: 95, streak: 'hot', len: 8, avg: '.340', hr: 4, rbi: 10, ops: '1.080' },
  { name: 'Mookie Betts', pos: '2B', ovr: 88, streak: 'warm', len: 5, avg: '.310', hr: 2, rbi: 7, ops: '.920' },
  { name: 'Freddie Freeman', pos: '1B', ovr: 87, streak: 'neutral', len: 0, avg: '.270', hr: 1, rbi: 5, ops: '.780' },
  { name: 'Ronald Acuna Jr.', pos: 'CF', ovr: 90, streak: 'cold', len: 7, avg: '.180', hr: 0, rbi: 2, ops: '.520' },
  { name: 'Fernando Tatis Jr.', pos: 'RF', ovr: 86, streak: 'ice_cold', len: 11, avg: '.145', hr: 0, rbi: 1, ops: '.410' },
  { name: 'Corey Seager', pos: 'SS', ovr: 85, streak: 'hot', len: 6, avg: '.350', hr: 3, rbi: 9, ops: '1.020' },
  { name: 'Yordan Alvarez', pos: 'DH', ovr: 87, streak: 'warm', len: 4, avg: '.300', hr: 2, rbi: 6, ops: '.890' },
];

const PITCHER_DATA: Array<{ name: string; pos: string; ovr: number; streak: StreakType; len: number; era: string; k: number; whip: string }> = [
  { name: 'Gerrit Cole', pos: 'SP', ovr: 89, streak: 'on_fire', len: 5, era: '1.45', k: 42, whip: '0.82' },
  { name: 'Spencer Strider', pos: 'SP', ovr: 84, streak: 'cold', len: 4, era: '5.80', k: 18, whip: '1.55' },
  { name: 'Zack Wheeler', pos: 'SP', ovr: 86, streak: 'hot', len: 3, era: '2.10', k: 30, whip: '0.95' },
  { name: 'Emmanuel Clase', pos: 'CP', ovr: 82, streak: 'neutral', len: 0, era: '3.20', k: 12, whip: '1.10' },
];

const GAME_HIGHLIGHTS = [
  '2-4, HR, 3 RBI', '3-5, 2B, 2 RBI', '0-4, 3 K', '1-3, BB, SB',
  '4-5, 2 HR, 5 RBI', '0-3, BB', '2-4, 2B, RBI', '1-4, HR',
  '7 IP, 1 ER, 10 K', '5 IP, 5 ER, 3 BB', '6 IP, 2 ER, 8 K', '1 IP, 0 ER, SV',
];

export function generateDemoStreaks(): StreakPlayer[] {
  const hitters: StreakPlayer[] = HITTER_DATA.map((p, i) => ({
    id: i,
    name: p.name,
    pos: p.pos,
    overall: p.ovr,
    adjustedOvr: getAdjustedOvr(p.ovr, p.streak),
    streak: p.streak,
    streakLength: p.len,
    last10: { gp: 10, avg: p.avg, hr: p.hr, rbi: p.rbi, ops: p.ops },
    last10Pitching: null,
    isPitcher: false,
    trending: p.streak === 'on_fire' || p.streak === 'hot' ? 'up' : p.streak === 'cold' || p.streak === 'ice_cold' ? 'down' : 'stable',
    recentGames: Array.from({ length: 3 }, (_, j) => ({
      date: `2024-08-${String(25 + j).padStart(2, '0')}`,
      result: j % 3 === 2 ? 'L 3-5' : 'W 6-2',
      highlight: GAME_HIGHLIGHTS[(i * 3 + j) % GAME_HIGHLIGHTS.length],
    })),
  }));

  const pitchers: StreakPlayer[] = PITCHER_DATA.map((p, i) => ({
    id: 100 + i,
    name: p.name,
    pos: p.pos,
    overall: p.ovr,
    adjustedOvr: getAdjustedOvr(p.ovr, p.streak),
    streak: p.streak,
    streakLength: p.len,
    last10: null,
    last10Pitching: { gp: p.pos === 'CP' ? 8 : 4, era: p.era, k: p.k, whip: p.whip },
    isPitcher: true,
    trending: p.streak === 'on_fire' || p.streak === 'hot' ? 'up' : p.streak === 'cold' || p.streak === 'ice_cold' ? 'down' : 'stable',
    recentGames: Array.from({ length: 3 }, (_, j) => ({
      date: `2024-08-${String(22 + j * 4).padStart(2, '0')}`,
      result: j === 1 ? 'L 2-6' : 'W 4-1',
      highlight: GAME_HIGHLIGHTS[(8 + i * 3 + j) % GAME_HIGHLIGHTS.length],
    })),
  }));

  return [...hitters, ...pitchers];
}
