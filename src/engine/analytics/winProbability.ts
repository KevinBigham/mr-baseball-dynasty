/**
 * Win Probability Chart
 *
 * Tracks in-game win probability changes inning by inning.
 * Identifies high-leverage moments, key swings, and
 * championship-level probability shifts.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeverageLevel = 'extreme' | 'high' | 'medium' | 'low';

export const LEVERAGE_DISPLAY: Record<LeverageLevel, { label: string; color: string; emoji: string }> = {
  extreme: { label: 'Extreme',  color: '#ef4444', emoji: '🔴' },
  high:    { label: 'High',     color: '#f97316', emoji: '🟠' },
  medium:  { label: 'Medium',   color: '#eab308', emoji: '🟡' },
  low:     { label: 'Low',      color: '#22c55e', emoji: '🟢' },
};

export interface WinProbPoint {
  inning: number;
  half: 'top' | 'bottom';
  outs: number;
  winProb: number;           // 0-100
  event: string;             // what happened
  leverageIndex: number;     // 0-10 scale
  wpaDelta: number;          // change in win prob from this event
}

export interface KeyMoment {
  description: string;
  wpaDelta: number;
  leverage: LeverageLevel;
  inning: string;
}

export interface WinProbGame {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  finalScore: string;
  winner: string;
  preGameWinProb: number;     // home team win prob pre-game
  maxSwing: number;           // biggest single-event WPA
  keyMoments: KeyMoment[];
  timeline: WinProbPoint[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getLeverageLevel(li: number): LeverageLevel {
  if (li >= 4) return 'extreme';
  if (li >= 2) return 'high';
  if (li >= 1) return 'medium';
  return 'low';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoWinProb(): WinProbGame[] {
  return [
    {
      id: 0, homeTeam: 'NYY', awayTeam: 'BOS', date: 'Aug 25',
      finalScore: 'NYY 5, BOS 4', winner: 'NYY', preGameWinProb: 58,
      maxSwing: 35,
      keyMoments: [
        { description: 'Aaron Judge 3-run HR in 7th', wpaDelta: 35, leverage: 'extreme', inning: '7th' },
        { description: 'Devers 2-run double in 6th', wpaDelta: -28, leverage: 'high', inning: '6th' },
        { description: 'Clay Holmes gets save', wpaDelta: 12, leverage: 'extreme', inning: '9th' },
      ],
      timeline: [
        { inning: 1, half: 'top', outs: 0, winProb: 58, event: 'Game start', leverageIndex: 0.8, wpaDelta: 0 },
        { inning: 1, half: 'top', outs: 3, winProb: 55, event: 'BOS 1-2-3 top 1st', leverageIndex: 0.9, wpaDelta: -3 },
        { inning: 1, half: 'bottom', outs: 3, winProb: 62, event: 'NYY scores 1', leverageIndex: 1.0, wpaDelta: 7 },
        { inning: 3, half: 'top', outs: 3, winProb: 56, event: 'BOS ties it 1-1', leverageIndex: 1.2, wpaDelta: -6 },
        { inning: 4, half: 'bottom', outs: 3, winProb: 60, event: 'NYY takes 2-1 lead', leverageIndex: 1.3, wpaDelta: 4 },
        { inning: 6, half: 'top', outs: 3, winProb: 32, event: 'Devers 2-run double, BOS leads 4-2', leverageIndex: 3.5, wpaDelta: -28 },
        { inning: 7, half: 'bottom', outs: 2, winProb: 67, event: 'Judge 3-run HR! NYY leads 5-4', leverageIndex: 5.0, wpaDelta: 35 },
        { inning: 8, half: 'top', outs: 3, winProb: 78, event: '1-2-3 top 8th', leverageIndex: 2.0, wpaDelta: 11 },
        { inning: 9, half: 'top', outs: 3, winProb: 100, event: 'Holmes closes it out', leverageIndex: 4.5, wpaDelta: 22 },
      ],
    },
    {
      id: 1, homeTeam: 'LAD', awayTeam: 'SF', date: 'Aug 24',
      finalScore: 'LAD 3, SF 2', winner: 'LAD', preGameWinProb: 62,
      maxSwing: 28,
      keyMoments: [
        { description: 'Ohtani walk-off single in 9th', wpaDelta: 28, leverage: 'extreme', inning: '9th' },
        { description: 'Crawford go-ahead HR in 8th', wpaDelta: -22, leverage: 'high', inning: '8th' },
        { description: 'Betts leadoff double in 9th', wpaDelta: 15, leverage: 'high', inning: '9th' },
      ],
      timeline: [
        { inning: 1, half: 'top', outs: 0, winProb: 62, event: 'Game start', leverageIndex: 0.8, wpaDelta: 0 },
        { inning: 3, half: 'bottom', outs: 3, winProb: 70, event: 'LAD scores 2', leverageIndex: 1.5, wpaDelta: 8 },
        { inning: 6, half: 'top', outs: 3, winProb: 60, event: 'SF scores 1', leverageIndex: 1.8, wpaDelta: -10 },
        { inning: 8, half: 'top', outs: 3, winProb: 38, event: 'Crawford HR, SF leads 2-1', leverageIndex: 3.8, wpaDelta: -22 },
        { inning: 9, half: 'bottom', outs: 0, winProb: 45, event: 'Betts leadoff double', leverageIndex: 4.0, wpaDelta: 15 },
        { inning: 9, half: 'bottom', outs: 1, winProb: 55, event: 'Freeman advances runner to 3rd', leverageIndex: 4.5, wpaDelta: 2 },
        { inning: 9, half: 'bottom', outs: 2, winProb: 100, event: 'Ohtani walk-off single!', leverageIndex: 5.0, wpaDelta: 28 },
      ],
    },
  ];
}
