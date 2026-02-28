/**
 * Team Momentum Tracker
 *
 * Measures overall team momentum based on recent results,
 * run differential trends, streaks, clutch performances,
 * and morale indicators.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type MomentumLevel = 'unstoppable' | 'hot' | 'building' | 'neutral' | 'cooling' | 'cold' | 'freefall';

export const MOMENTUM_DISPLAY: Record<MomentumLevel, { label: string; emoji: string; color: string; modifier: number }> = {
  unstoppable: { label: 'Unstoppable', emoji: '🔥🔥', color: '#ef4444', modifier: 5 },
  hot:         { label: 'Hot',         emoji: '🔥',   color: '#f97316', modifier: 3 },
  building:    { label: 'Building',    emoji: '📈',   color: '#eab308', modifier: 1 },
  neutral:     { label: 'Neutral',     emoji: '➖',   color: '#6b7280', modifier: 0 },
  cooling:     { label: 'Cooling',     emoji: '📉',   color: '#3b82f6', modifier: -1 },
  cold:        { label: 'Cold',        emoji: '🥶',   color: '#60a5fa', modifier: -3 },
  freefall:    { label: 'Free Fall',   emoji: '💀',   color: '#ef4444', modifier: -5 },
};

export interface MomentumFactor {
  name: string;
  value: number;       // -100 to 100
  weight: number;      // contribution weight
  description: string;
}

export interface TeamMomentumData {
  overallScore: number;       // -100 to 100
  level: MomentumLevel;
  factors: MomentumFactor[];
  last5Record: string;
  last10Record: string;
  last20Record: string;
  currentStreak: string;
  peakMomentum: number;       // highest this season
  lowestMomentum: number;     // lowest this season
  recentHighlights: string[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getMomentumLevel(score: number): MomentumLevel {
  if (score >= 75) return 'unstoppable';
  if (score >= 45) return 'hot';
  if (score >= 15) return 'building';
  if (score >= -15) return 'neutral';
  if (score >= -45) return 'cooling';
  if (score >= -75) return 'cold';
  return 'freefall';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoMomentum(): TeamMomentumData {
  const score = 62;
  return {
    overallScore: score,
    level: getMomentumLevel(score),
    factors: [
      { name: 'Win Streak', value: 80, weight: 0.25, description: '7-game winning streak' },
      { name: 'Run Differential', value: 65, weight: 0.20, description: '+28 runs in last 10 games' },
      { name: 'Clutch Hitting', value: 72, weight: 0.15, description: '3 walk-off wins in 2 weeks' },
      { name: 'Starting Pitching', value: 55, weight: 0.15, description: '3.15 ERA over last 10 starts' },
      { name: 'Bullpen', value: 40, weight: 0.10, description: 'Closer has blown 2 of last 5 saves' },
      { name: 'Injuries', value: 50, weight: 0.10, description: '2 key players on IL' },
      { name: 'Clubhouse', value: 70, weight: 0.05, description: 'Team chemistry is high' },
    ],
    last5Record: '4-1',
    last10Record: '8-2',
    last20Record: '14-6',
    currentStreak: 'W7',
    peakMomentum: 78,
    lowestMomentum: -32,
    recentHighlights: [
      'Walk-off HR by Freeman in 10th inning (Aug 24)',
      'Cole threw complete game shutout (Aug 22)',
      'Swept division rival Braves in 3-game series',
      '7-game winning streak, longest of the season',
      'Team batting .298 over last 10 games',
    ],
  };
}
