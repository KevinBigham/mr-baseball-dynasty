/**
 * Game Score Tracker
 *
 * Bill James Game Score calculation for starting pitcher
 * performances. Tracks season-best/worst, historical context,
 * and quality start rates.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PerformanceLevel = 'gem' | 'dominant' | 'quality' | 'decent' | 'bad' | 'disaster';

export const PERFORMANCE_DISPLAY: Record<PerformanceLevel, { label: string; color: string; emoji: string }> = {
  gem:      { label: 'Gem',       color: '#22c55e', emoji: '💎' },
  dominant: { label: 'Dominant',  color: '#3b82f6', emoji: '🔥' },
  quality:  { label: 'Quality',   color: '#eab308', emoji: '✅' },
  decent:   { label: 'Decent',    color: '#f97316', emoji: '➖' },
  bad:      { label: 'Bad',       color: '#ef4444', emoji: '👎' },
  disaster: { label: 'Disaster',  color: '#7f1d1d', emoji: '💣' },
};

export function getPerformanceLevel(gameScore: number): PerformanceLevel {
  if (gameScore >= 80) return 'gem';
  if (gameScore >= 65) return 'dominant';
  if (gameScore >= 50) return 'quality';
  if (gameScore >= 35) return 'decent';
  if (gameScore >= 20) return 'bad';
  return 'disaster';
}

export interface GameScoreEntry {
  date: string;
  opponent: string;
  ip: number;
  h: number;
  er: number;
  bb: number;
  k: number;
  hr: number;
  gameScore: number;
  level: PerformanceLevel;
  decision: string;          // W, L, ND
}

export interface PitcherGameScores {
  id: number;
  name: string;
  team: string;
  overall: number;
  starts: number;
  avgGameScore: number;
  bestGameScore: number;
  worstGameScore: number;
  qualityStartPct: number;   // % of starts that are QS
  gemCount: number;
  disasterCount: number;
  recentStarts: GameScoreEntry[];
}

export interface GameScoreSummary {
  teamAvgGameScore: number;
  teamQSPct: number;
  totalGems: number;
  totalDisasters: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function calculateGameScore(ip: number, h: number, er: number, bb: number, k: number, hr: number): number {
  const outs = Math.floor(ip) * 3 + Math.round((ip % 1) * 10);
  let score = 50;
  score += outs;
  score += k * 2;
  score -= h * 2;
  score -= er * 4;
  score -= bb * 2;
  score -= hr * 6;
  // Bonus for going deep
  if (ip >= 7) score += 5;
  if (ip >= 8) score += 5;
  if (ip >= 9) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function getGameScoreSummary(pitchers: PitcherGameScores[]): GameScoreSummary {
  const n = pitchers.length;
  return {
    teamAvgGameScore: Math.round(pitchers.reduce((s, p) => s + p.avgGameScore, 0) / n),
    teamQSPct: Math.round(pitchers.reduce((s, p) => s + p.qualityStartPct, 0) / n),
    totalGems: pitchers.reduce((s, p) => s + p.gemCount, 0),
    totalDisasters: pitchers.reduce((s, p) => s + p.disasterCount, 0),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makeEntry(date: string, opp: string, ip: number, h: number, er: number, bb: number, k: number, hr: number, dec: string): GameScoreEntry {
  const gs = calculateGameScore(ip, h, er, bb, k, hr);
  return { date, opponent: opp, ip, h, er, bb, k, hr, gameScore: gs, level: getPerformanceLevel(gs), decision: dec };
}

export function generateDemoGameScores(): PitcherGameScores[] {
  return [
    {
      id: 0, name: 'Gerrit Cole', team: 'NYY', overall: 89, starts: 28,
      avgGameScore: 62, bestGameScore: 88, worstGameScore: 28, qualityStartPct: 72, gemCount: 5, disasterCount: 1,
      recentStarts: [
        makeEntry('Aug 25', 'BOS', 7, 4, 1, 1, 10, 0, 'W'),
        makeEntry('Aug 19', 'CLE', 6, 6, 3, 2, 7, 1, 'ND'),
        makeEntry('Aug 13', 'TB', 8, 2, 0, 0, 12, 0, 'W'),
        makeEntry('Aug 7', 'TEX', 5, 8, 5, 3, 4, 2, 'L'),
        makeEntry('Aug 1', 'BAL', 7, 5, 2, 1, 9, 1, 'W'),
      ],
    },
    {
      id: 1, name: 'Zack Wheeler', team: 'PHI', overall: 87, starts: 29,
      avgGameScore: 64, bestGameScore: 92, worstGameScore: 32, qualityStartPct: 75, gemCount: 6, disasterCount: 0,
      recentStarts: [
        makeEntry('Aug 24', 'ATL', 8, 3, 1, 0, 11, 0, 'W'),
        makeEntry('Aug 18', 'MIL', 7, 5, 2, 1, 8, 1, 'W'),
        makeEntry('Aug 12', 'ARI', 6, 7, 4, 2, 6, 1, 'L'),
        makeEntry('Aug 6', 'WSH', 9, 1, 0, 0, 13, 0, 'W'),
        makeEntry('Jul 31', 'NYM', 7, 4, 2, 2, 9, 0, 'W'),
      ],
    },
    {
      id: 2, name: 'Spencer Strider', team: 'ATL', overall: 85, starts: 22,
      avgGameScore: 58, bestGameScore: 85, worstGameScore: 18, qualityStartPct: 60, gemCount: 3, disasterCount: 2,
      recentStarts: [
        makeEntry('Aug 23', 'PHI', 5, 5, 3, 3, 9, 1, 'ND'),
        makeEntry('Aug 17', 'SD', 7, 3, 1, 1, 12, 0, 'W'),
        makeEntry('Aug 11', 'COL', 6, 6, 4, 4, 8, 1, 'L'),
        makeEntry('Aug 5', 'NYM', 4, 7, 6, 2, 5, 2, 'L'),
        makeEntry('Jul 30', 'HOU', 8, 2, 0, 1, 14, 0, 'W'),
      ],
    },
    {
      id: 3, name: 'Logan Webb', team: 'SF', overall: 82, starts: 30,
      avgGameScore: 60, bestGameScore: 82, worstGameScore: 35, qualityStartPct: 68, gemCount: 2, disasterCount: 0,
      recentStarts: [
        makeEntry('Aug 25', 'LAD', 7, 5, 2, 0, 6, 1, 'W'),
        makeEntry('Aug 19', 'PIT', 8, 3, 1, 1, 7, 0, 'W'),
        makeEntry('Aug 13', 'CHC', 6, 6, 3, 2, 5, 0, 'ND'),
        makeEntry('Aug 7', 'ARI', 7, 4, 2, 1, 8, 1, 'W'),
        makeEntry('Aug 1', 'MIA', 6, 5, 3, 3, 4, 0, 'L'),
      ],
    },
  ];
}
