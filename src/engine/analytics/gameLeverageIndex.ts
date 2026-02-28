/**
 * gameLeverageIndex.ts – Game leverage index tracker
 *
 * Tracks leverage index (LI) throughout game situations,
 * identifying high-leverage moments, clutch performances,
 * and bullpen usage in critical spots.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeverageLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

export interface LeverageMoment {
  inning: number;
  half: 'top' | 'bot';
  outs: number;
  runners: string;      // e.g. "1B, 3B"
  score: string;        // e.g. "3-2"
  li: number;           // leverage index
  level: LeverageLevel;
  batter: string;
  pitcher: string;
  result: string;
  wpaSwing: number;     // WPA change from this event
}

export interface GameLeverageData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  finalScore: string;
  totalMoments: number;
  peakLI: number;
  avgLI: number;
  clutchMoments: number;  // moments with LI >= 2.0
  moments: LeverageMoment[];
  mvpPlayer: string;
  mvpWPA: number;
  notes: string;
}

export const LEVERAGE_DISPLAY: Record<LeverageLevel, { label: string; color: string }> = {
  very_high: { label: 'VERY HIGH', color: '#ef4444' },
  high: { label: 'HIGH', color: '#f97316' },
  medium: { label: 'MEDIUM', color: '#facc15' },
  low: { label: 'LOW', color: '#a3e635' },
  very_low: { label: 'VERY LOW', color: '#22c55e' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function liToLevel(li: number): LeverageLevel {
  if (li >= 3.0) return 'very_high';
  if (li >= 2.0) return 'high';
  if (li >= 1.0) return 'medium';
  if (li >= 0.5) return 'low';
  return 'very_low';
}

export function leverageColor(li: number): string {
  return LEVERAGE_DISPLAY[liToLevel(li)].color;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface GameLeverageSummary {
  totalGames: number;
  avgPeakLI: number;
  mostClutchPlayer: string;
  highLeveragePct: number;
  biggestMoment: string;
}

export function getGameLeverageSummary(games: GameLeverageData[]): GameLeverageSummary {
  const avgPeak = games.reduce((s, g) => s + g.peakLI, 0) / games.length;
  const playerWPA: Record<string, number> = {};

  let biggestLI = 0;
  let biggestDesc = '';

  for (const g of games) {
    for (const m of g.moments) {
      playerWPA[m.batter] = (playerWPA[m.batter] || 0) + Math.max(0, m.wpaSwing);
      if (m.li > biggestLI) {
        biggestLI = m.li;
        biggestDesc = `${m.batter} vs ${m.pitcher} (LI ${m.li.toFixed(1)})`;
      }
    }
  }

  const totalMoments = games.reduce((s, g) => s + g.totalMoments, 0);
  const highMoments = games.reduce((s, g) => s + g.clutchMoments, 0);
  const clutchPlayer = Object.entries(playerWPA).sort((a, b) => b[1] - a[1])[0][0];

  return {
    totalGames: games.length,
    avgPeakLI: Math.round(avgPeak * 10) / 10,
    mostClutchPlayer: clutchPlayer,
    highLeveragePct: Math.round((highMoments / totalMoments) * 100),
    biggestMoment: biggestDesc,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoGameLeverage(): GameLeverageData[] {
  const games: Omit<GameLeverageData, 'id'>[] = [
    {
      homeTeam: 'NYY', awayTeam: 'BOS', date: '2025-07-04', finalScore: '5-4',
      totalMoments: 14, peakLI: 5.8, avgLI: 1.8, clutchMoments: 5,
      moments: [
        { inning: 1, half: 'top', outs: 0, runners: '', score: '0-0', li: 0.9, level: 'low', batter: 'Turner', pitcher: 'Cole', result: 'Single', wpaSwing: 0.03 },
        { inning: 3, half: 'bot', outs: 1, runners: '1B, 2B', score: '1-0', li: 1.8, level: 'medium', batter: 'Judge', pitcher: 'Whitlock', result: '2-run Double', wpaSwing: 0.12 },
        { inning: 5, half: 'top', outs: 2, runners: '2B', score: '3-1', li: 1.2, level: 'medium', batter: 'Devers', pitcher: 'Cole', result: 'RBI Single', wpaSwing: -0.06 },
        { inning: 7, half: 'top', outs: 1, runners: '1B, 3B', score: '3-2', li: 3.2, level: 'very_high', batter: 'Yoshida', pitcher: 'Holmes', result: 'Sac Fly', wpaSwing: -0.08 },
        { inning: 8, half: 'bot', outs: 2, runners: '2B', score: '3-3', li: 4.5, level: 'very_high', batter: 'Soto', pitcher: 'Jansen', result: 'Go-ahead RBI Single', wpaSwing: 0.22 },
        { inning: 9, half: 'top', outs: 1, runners: '1B', score: '4-3', li: 3.8, level: 'very_high', batter: 'Devers', pitcher: 'Clay Holmes', result: 'RBI Double', wpaSwing: -0.18 },
        { inning: 9, half: 'bot', outs: 2, runners: '2B', score: '4-4', li: 5.8, level: 'very_high', batter: 'Judge', pitcher: 'Brasier', result: 'Walk-off RBI Single', wpaSwing: 0.45 },
      ],
      mvpPlayer: 'Judge', mvpWPA: 0.57,
      notes: 'Classic rivalry game. Judge delivered in the biggest moments with +.57 WPA. Peak leverage 5.8 in the 9th.',
    },
    {
      homeTeam: 'LAD', awayTeam: 'SF', date: '2025-07-12', finalScore: '2-1',
      totalMoments: 11, peakLI: 4.2, avgLI: 1.5, clutchMoments: 3,
      moments: [
        { inning: 2, half: 'bot', outs: 0, runners: '', score: '0-0', li: 0.8, level: 'low', batter: 'Freeman', pitcher: 'Webb', result: 'Solo HR', wpaSwing: 0.08 },
        { inning: 5, half: 'top', outs: 1, runners: '2B', score: '1-0', li: 1.5, level: 'medium', batter: 'Chapman', pitcher: 'Glasnow', result: 'RBI Single', wpaSwing: -0.09 },
        { inning: 7, half: 'bot', outs: 2, runners: '1B, 3B', score: '1-1', li: 3.5, level: 'very_high', batter: 'Betts', pitcher: 'Hicks', result: 'Go-ahead Sac Fly', wpaSwing: 0.18 },
        { inning: 9, half: 'top', outs: 2, runners: '1B', score: '2-1', li: 4.2, level: 'very_high', batter: 'Crawford', pitcher: 'Treinen', result: 'Flyout — Game Over', wpaSwing: 0.15 },
      ],
      mvpPlayer: 'Betts', mvpWPA: 0.33,
      notes: 'Pitcher\'s duel settled by Betts clutch sac fly in the 7th. Treinen slams the door.',
    },
    {
      homeTeam: 'ATL', awayTeam: 'PHI', date: '2025-08-02', finalScore: '8-7',
      totalMoments: 18, peakLI: 6.2, avgLI: 2.1, clutchMoments: 7,
      moments: [
        { inning: 1, half: 'top', outs: 0, runners: '1B', score: '0-0', li: 1.1, level: 'medium', batter: 'Harper', pitcher: 'Fried', result: '2-run HR', wpaSwing: -0.10 },
        { inning: 3, half: 'bot', outs: 1, runners: '1B, 2B', score: '0-3', li: 1.4, level: 'medium', batter: 'Acuna', pitcher: 'Wheeler', result: '3-run HR', wpaSwing: 0.18 },
        { inning: 5, half: 'top', outs: 0, runners: '1B, 3B', score: '4-3', li: 2.2, level: 'high', batter: 'Turner', pitcher: 'Fried', result: '2-run Double', wpaSwing: -0.14 },
        { inning: 6, half: 'bot', outs: 2, runners: '2B', score: '4-5', li: 2.8, level: 'high', batter: 'Olson', pitcher: 'Alvarado', result: 'Game-tying RBI Single', wpaSwing: 0.12 },
        { inning: 8, half: 'top', outs: 1, runners: '1B, 2B', score: '6-5', li: 3.8, level: 'very_high', batter: 'Schwarber', pitcher: 'Iglesias', result: 'Go-ahead 2-run Double', wpaSwing: -0.20 },
        { inning: 8, half: 'bot', outs: 2, runners: '1B, 3B', score: '6-7', li: 5.5, level: 'very_high', batter: 'Riley', pitcher: 'Kimbrel', result: '2-run walk-off? No, Single ties it', wpaSwing: 0.15 },
        { inning: 9, half: 'bot', outs: 1, runners: '2B', score: '7-7', li: 6.2, level: 'very_high', batter: 'Acuna', pitcher: 'Kimbrel', result: 'Walk-off RBI Double', wpaSwing: 0.42 },
      ],
      mvpPlayer: 'Acuna', mvpWPA: 0.60,
      notes: 'Absolute slugfest. Acuna with the 3-run HR and walk-off double. 7 clutch moments in one game!',
    },
    {
      homeTeam: 'HOU', awayTeam: 'SEA', date: '2025-09-15', finalScore: '1-0',
      totalMoments: 8, peakLI: 3.5, avgLI: 1.2, clutchMoments: 2,
      moments: [
        { inning: 3, half: 'bot', outs: 2, runners: '2B', score: '0-0', li: 1.4, level: 'medium', batter: 'Alvarez', pitcher: 'Castillo', result: 'RBI Single', wpaSwing: 0.10 },
        { inning: 7, half: 'top', outs: 0, runners: '1B, 2B', score: '1-0', li: 2.8, level: 'high', batter: 'Rodriguez', pitcher: 'Valdez', result: 'Double Play', wpaSwing: 0.14 },
        { inning: 9, half: 'top', outs: 2, runners: '1B', score: '1-0', li: 3.5, level: 'very_high', batter: 'Suarez', pitcher: 'Pressly', result: 'Strikeout — Game Over', wpaSwing: 0.18 },
      ],
      mvpPlayer: 'Valdez', mvpWPA: 0.38,
      notes: 'Pitching masterclass. Valdez and Castillo dueled, one run decided it. Pressly closes with K.',
    },
    {
      homeTeam: 'CHC', awayTeam: 'STL', date: '2025-06-21', finalScore: '6-5',
      totalMoments: 15, peakLI: 4.8, avgLI: 1.7, clutchMoments: 4,
      moments: [
        { inning: 1, half: 'top', outs: 1, runners: '1B', score: '0-0', li: 0.9, level: 'low', batter: 'Goldschmidt', pitcher: 'Steele', result: '2-run HR', wpaSwing: -0.10 },
        { inning: 4, half: 'bot', outs: 0, runners: '1B, 2B', score: '0-2', li: 1.5, level: 'medium', batter: 'Suzuki', pitcher: 'Flaherty', result: '3-run HR', wpaSwing: 0.22 },
        { inning: 6, half: 'top', outs: 2, runners: '1B, 3B', score: '4-3', li: 2.5, level: 'high', batter: 'Arenado', pitcher: 'Wesneski', result: '2-run Double', wpaSwing: -0.16 },
        { inning: 8, half: 'bot', outs: 1, runners: '1B', score: '4-5', li: 2.8, level: 'high', batter: 'Hoerner', pitcher: 'Helsley', result: 'Game-tying RBI Triple', wpaSwing: 0.15 },
        { inning: 9, half: 'bot', outs: 2, runners: '3B', score: '5-5', li: 4.8, level: 'very_high', batter: 'Bellinger', pitcher: 'Gallegos', result: 'Walk-off RBI Single', wpaSwing: 0.40 },
      ],
      mvpPlayer: 'Bellinger', mvpWPA: 0.40,
      notes: 'Cardinals-Cubs classic. Back and forth all game. Bellinger walks it off in the 9th with 2 outs.',
    },
  ];

  return games.map((g, i) => ({ ...g, id: `gli-${i}` }));
}
