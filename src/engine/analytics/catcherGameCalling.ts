/**
 * catcherGameCalling.ts – Catcher game-calling analytics
 *
 * Evaluates catchers' pitch-calling tendencies, pitcher handling,
 * game-calling grades, and impact on pitching staff performance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CallingGrade = 'elite' | 'plus' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export interface PitcherHandling {
  pitcherId: string;
  pitcherName: string;
  gamesHandled: number;
  eraWith: number;
  eraWithout: number;  // with other catchers
  kPctWith: number;
  bbPctWith: number;
  whipWith: number;
  rating: number;      // -5 to +5 boost
}

export interface CatcherCallingProfile {
  id: string;
  name: string;
  team: string;
  age: number;
  overall: number;
  callingGrade: CallingGrade;
  gamesStarted: number;
  staffERA: number;
  staffKPct: number;
  staffBBPct: number;
  framingRuns: number;
  blockingRuns: number;
  throwingRuns: number;
  callingRuns: number;     // run value from pitch calling
  totalCatcherValue: number;
  fbPct: number;           // fastball calling %
  breakingPct: number;     // breaking ball %
  offspeedPct: number;     // offspeed %
  firstPitchStrikePct: number;
  aheadPct: number;        // % of counts where ahead
  pitcherHandling: PitcherHandling[];
  notes: string;
}

export const CALLING_GRADE_DISPLAY: Record<CallingGrade, { label: string; color: string; emoji: string }> = {
  elite: { label: 'ELITE', color: '#22c55e', emoji: '🏆' },
  plus: { label: 'PLUS', color: '#4ade80', emoji: '⭐' },
  above_avg: { label: 'ABOVE AVG', color: '#a3e635', emoji: '✓' },
  average: { label: 'AVERAGE', color: '#facc15', emoji: '—' },
  below_avg: { label: 'BELOW AVG', color: '#f97316', emoji: '▽' },
  poor: { label: 'POOR', color: '#ef4444', emoji: '✗' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface CatcherCallingSummary {
  totalCatchers: number;
  bestCaller: string;
  bestFramer: string;
  avgCallingRuns: number;
  eliteCallers: number;
}

export function getCatcherCallingSummary(catchers: CatcherCallingProfile[]): CatcherCallingSummary {
  const bestCaller = catchers.reduce((a, b) => a.callingRuns > b.callingRuns ? a : b);
  const bestFramer = catchers.reduce((a, b) => a.framingRuns > b.framingRuns ? a : b);
  const avgCalling = catchers.reduce((s, c) => s + c.callingRuns, 0) / catchers.length;

  return {
    totalCatchers: catchers.length,
    bestCaller: bestCaller.name,
    bestFramer: bestFramer.name,
    avgCallingRuns: Math.round(avgCalling * 10) / 10,
    eliteCallers: catchers.filter(c => c.callingGrade === 'elite' || c.callingGrade === 'plus').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoCatcherCalling(): CatcherCallingProfile[] {
  const data: Omit<CatcherCallingProfile, 'id'>[] = [
    {
      name: 'Marcus Torres', team: 'LAD', age: 29, overall: 82, callingGrade: 'elite',
      gamesStarted: 118, staffERA: 3.28, staffKPct: 25.8, staffBBPct: 7.2,
      framingRuns: 14.2, blockingRuns: 3.5, throwingRuns: 1.8, callingRuns: 8.5, totalCatcherValue: 28.0,
      fbPct: 52, breakingPct: 28, offspeedPct: 20, firstPitchStrikePct: 64.2, aheadPct: 58.5,
      pitcherHandling: [
        { pitcherId: 'p1', pitcherName: 'Webb', gamesHandled: 28, eraWith: 2.85, eraWithout: 3.42, kPctWith: 27.2, bbPctWith: 6.8, whipWith: 1.05, rating: 4.2 },
        { pitcherId: 'p2', pitcherName: 'Glasnow', gamesHandled: 25, eraWith: 3.12, eraWithout: 3.55, kPctWith: 30.5, bbPctWith: 8.2, whipWith: 1.08, rating: 3.5 },
        { pitcherId: 'p3', pitcherName: 'May', gamesHandled: 22, eraWith: 3.45, eraWithout: 3.82, kPctWith: 24.8, bbPctWith: 7.5, whipWith: 1.12, rating: 2.8 },
      ],
      notes: 'Elite game-caller who gets the most out of every pitcher. Staff ERA is significantly better with him behind the plate. Excellent framing adds hidden value.',
    },
    {
      name: 'Jake Sullivan', team: 'ATL', age: 27, overall: 78, callingGrade: 'plus',
      gamesStarted: 125, staffERA: 3.42, staffKPct: 24.5, staffBBPct: 7.8,
      framingRuns: 10.8, blockingRuns: 5.2, throwingRuns: 2.5, callingRuns: 6.2, totalCatcherValue: 24.7,
      fbPct: 48, breakingPct: 32, offspeedPct: 20, firstPitchStrikePct: 62.8, aheadPct: 56.2,
      pitcherHandling: [
        { pitcherId: 'p4', pitcherName: 'Fried', gamesHandled: 30, eraWith: 3.15, eraWithout: 3.68, kPctWith: 25.8, bbPctWith: 6.5, whipWith: 1.10, rating: 3.8 },
        { pitcherId: 'p5', pitcherName: 'Strider', gamesHandled: 28, eraWith: 2.92, eraWithout: 3.25, kPctWith: 32.1, bbPctWith: 8.5, whipWith: 1.02, rating: 2.5 },
      ],
      notes: 'Strong all-around catcher. Excellent blocker and above-average caller. Young enough to improve further.',
    },
    {
      name: 'Diego Reyes', team: 'HOU', age: 31, overall: 75, callingGrade: 'above_avg',
      gamesStarted: 110, staffERA: 3.55, staffKPct: 23.8, staffBBPct: 8.1,
      framingRuns: 6.5, blockingRuns: 4.2, throwingRuns: 0.8, callingRuns: 4.8, totalCatcherValue: 16.3,
      fbPct: 55, breakingPct: 25, offspeedPct: 20, firstPitchStrikePct: 60.5, aheadPct: 54.8,
      pitcherHandling: [
        { pitcherId: 'p6', pitcherName: 'Valdez', gamesHandled: 30, eraWith: 3.08, eraWithout: 3.45, kPctWith: 22.5, bbPctWith: 7.2, whipWith: 1.15, rating: 3.2 },
        { pitcherId: 'p7', pitcherName: 'Javier', gamesHandled: 24, eraWith: 3.62, eraWithout: 3.78, kPctWith: 28.5, bbPctWith: 8.8, whipWith: 1.18, rating: 1.2 },
      ],
      notes: 'Veteran presence. Excellent with sinkerballers and ground-ball pitchers. Declining arm strength.',
    },
    {
      name: 'Brett Hanson', team: 'NYY', age: 25, overall: 72, callingGrade: 'average',
      gamesStarted: 95, staffERA: 3.78, staffKPct: 24.2, staffBBPct: 8.5,
      framingRuns: 2.1, blockingRuns: 1.5, throwingRuns: 3.8, callingRuns: 1.2, totalCatcherValue: 8.6,
      fbPct: 50, breakingPct: 30, offspeedPct: 20, firstPitchStrikePct: 58.2, aheadPct: 52.1,
      pitcherHandling: [
        { pitcherId: 'p8', pitcherName: 'Cole', gamesHandled: 28, eraWith: 3.45, eraWithout: 3.28, kPctWith: 28.2, bbPctWith: 7.8, whipWith: 1.12, rating: -0.5 },
        { pitcherId: 'p9', pitcherName: 'Rodon', gamesHandled: 22, eraWith: 3.92, eraWithout: 3.65, kPctWith: 26.5, bbPctWith: 9.2, whipWith: 1.22, rating: -1.2 },
      ],
      notes: 'Young catcher still learning the art of game-calling. Strong arm compensates. Room to grow.',
    },
    {
      name: 'Carlos Montero', team: 'SD', age: 33, overall: 68, callingGrade: 'below_avg',
      gamesStarted: 82, staffERA: 4.12, staffKPct: 22.1, staffBBPct: 9.2,
      framingRuns: -2.5, blockingRuns: 2.8, throwingRuns: -0.5, callingRuns: -3.2, totalCatcherValue: -3.4,
      fbPct: 58, breakingPct: 22, offspeedPct: 20, firstPitchStrikePct: 55.8, aheadPct: 48.5,
      pitcherHandling: [
        { pitcherId: 'p10', pitcherName: 'Musgrove', gamesHandled: 20, eraWith: 4.25, eraWithout: 3.82, kPctWith: 22.8, bbPctWith: 8.5, whipWith: 1.28, rating: -2.5 },
      ],
      notes: 'Declining defensively. Over-reliance on fastballs makes the staff predictable. Good blocker still.',
    },
    {
      name: 'Tyler Morrison', team: 'BAL', age: 26, overall: 76, callingGrade: 'plus',
      gamesStarted: 130, staffERA: 3.38, staffKPct: 26.2, staffBBPct: 7.5,
      framingRuns: 12.5, blockingRuns: 2.8, throwingRuns: 4.2, callingRuns: 7.8, totalCatcherValue: 27.3,
      fbPct: 46, breakingPct: 34, offspeedPct: 20, firstPitchStrikePct: 63.5, aheadPct: 57.8,
      pitcherHandling: [
        { pitcherId: 'p11', pitcherName: 'Rodriguez', gamesHandled: 30, eraWith: 2.95, eraWithout: 3.52, kPctWith: 28.5, bbPctWith: 6.8, whipWith: 1.02, rating: 4.5 },
        { pitcherId: 'p12', pitcherName: 'Bradish', gamesHandled: 28, eraWith: 3.22, eraWithout: 3.65, kPctWith: 26.2, bbPctWith: 7.2, whipWith: 1.08, rating: 3.2 },
      ],
      notes: 'Rising star behind the plate. Excellent framing and smart game-calling. Breaking-ball heavy approach maximizes whiffs.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `cgc-${i}` }));
}
