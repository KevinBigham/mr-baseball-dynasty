/**
 * Starting Rotation Planner
 *
 * Manages the 5-man rotation schedule, rest day tracking,
 * matchup planning against upcoming opponents, and
 * skip/spot start decisions.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type StarterStatus = 'on_schedule' | 'extra_rest' | 'short_rest' | 'skipped' | 'injured' | 'bullpen_day';

export const STATUS_DISPLAY: Record<StarterStatus, { label: string; color: string; emoji: string }> = {
  on_schedule:  { label: 'On Schedule',  color: '#22c55e', emoji: '✅' },
  extra_rest:   { label: 'Extra Rest',   color: '#3b82f6', emoji: '😴' },
  short_rest:   { label: 'Short Rest',   color: '#f97316', emoji: '⚠️' },
  skipped:      { label: 'Skipped',      color: '#eab308', emoji: '⏭️' },
  injured:      { label: 'Injured',      color: '#ef4444', emoji: '🏥' },
  bullpen_day:  { label: 'Bullpen Day',  color: '#8b5cf6', emoji: '🔄' },
};

export interface RotationStarter {
  id: number;
  name: string;
  overall: number;
  hand: 'L' | 'R';
  era: number;
  wins: number;
  losses: number;
  inningsPitched: number;
  seasonStarts: number;
  lastStart: string;        // date
  daysSinceStart: number;
  normalRest: number;       // typical days between starts (4-5)
  status: StarterStatus;
  nextStart: string;        // projected date
  nextOpponent: string;
  nextOppAvg: number;       // opponent avg vs this hand
  matchupGrade: 'A' | 'B' | 'C' | 'D';
  pitchCount: number;       // last start pitch count
  fatigueLevel: number;     // 0-100
}

export interface ScheduleSlot {
  date: string;
  opponent: string;
  starterId: number | null;
  starterName: string;
  status: StarterStatus;
  notes: string;
}

export interface RotationSummary {
  avgERA: number;
  avgInnings: number;
  healthyStarters: number;
  totalStarts: number;
  qualityStartPct: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getRotationSummary(starters: RotationStarter[]): RotationSummary {
  const healthy = starters.filter(s => s.status !== 'injured');
  return {
    avgERA: Math.round(healthy.reduce((s, p) => s + p.era, 0) / healthy.length * 100) / 100,
    avgInnings: Math.round(healthy.reduce((s, p) => s + p.inningsPitched, 0) / healthy.length * 10) / 10,
    healthyStarters: healthy.length,
    totalStarts: starters.reduce((s, p) => s + p.seasonStarts, 0),
    qualityStartPct: 62,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoRotation(): RotationStarter[] {
  return [
    { id: 0, name: 'Gerrit Cole',    overall: 89, hand: 'R', era: 2.85, wins: 14, losses: 5, inningsPitched: 178, seasonStarts: 28, lastStart: 'Aug 22', daysSinceStart: 4, normalRest: 5, status: 'on_schedule',  nextStart: 'Aug 27', nextOpponent: 'BOS', nextOppAvg: .252, matchupGrade: 'A', pitchCount: 102, fatigueLevel: 35 },
    { id: 1, name: 'Zack Wheeler',   overall: 86, hand: 'R', era: 3.10, wins: 12, losses: 6, inningsPitched: 168, seasonStarts: 27, lastStart: 'Aug 23', daysSinceStart: 3, normalRest: 5, status: 'on_schedule',  nextStart: 'Aug 28', nextOpponent: 'BOS', nextOppAvg: .260, matchupGrade: 'B', pitchCount: 95,  fatigueLevel: 40 },
    { id: 2, name: 'Logan Webb',     overall: 83, hand: 'R', era: 3.25, wins: 11, losses: 7, inningsPitched: 165, seasonStarts: 27, lastStart: 'Aug 24', daysSinceStart: 2, normalRest: 5, status: 'on_schedule',  nextStart: 'Aug 29', nextOpponent: 'BOS', nextOppAvg: .248, matchupGrade: 'A', pitchCount: 88,  fatigueLevel: 55 },
    { id: 3, name: 'Blake Snell',    overall: 84, hand: 'L', era: 3.45, wins: 10, losses: 8, inningsPitched: 142, seasonStarts: 24, lastStart: 'Aug 20', daysSinceStart: 6, normalRest: 5, status: 'extra_rest',   nextStart: 'Aug 30', nextOpponent: 'NYY', nextOppAvg: .235, matchupGrade: 'A', pitchCount: 110, fatigueLevel: 20 },
    { id: 4, name: 'Sonny Gray',     overall: 80, hand: 'R', era: 3.60, wins: 9,  losses: 8, inningsPitched: 155, seasonStarts: 26, lastStart: 'Aug 21', daysSinceStart: 5, normalRest: 5, status: 'on_schedule',  nextStart: 'Aug 31', nextOpponent: 'NYY', nextOppAvg: .268, matchupGrade: 'C', pitchCount: 98,  fatigueLevel: 30 },
  ];
}

export function generateDemoSchedule(): ScheduleSlot[] {
  const rotation = generateDemoRotation();
  return [
    { date: 'Aug 27', opponent: 'BOS', starterId: 0, starterName: 'Gerrit Cole',  status: 'on_schedule', notes: 'Cole vs Whitlock' },
    { date: 'Aug 28', opponent: 'BOS', starterId: 1, starterName: 'Zack Wheeler', status: 'on_schedule', notes: 'Wheeler vs Bello' },
    { date: 'Aug 29', opponent: 'BOS', starterId: 2, starterName: 'Logan Webb',   status: 'on_schedule', notes: 'Series finale' },
    { date: 'Aug 30', opponent: 'NYY', starterId: 3, starterName: 'Blake Snell',  status: 'extra_rest',  notes: 'Extra day off — LHP vs NYY lineup' },
    { date: 'Aug 31', opponent: 'NYY', starterId: 4, starterName: 'Sonny Gray',   status: 'on_schedule', notes: '' },
    { date: 'Sep 1',  opponent: 'NYY', starterId: 0, starterName: 'Gerrit Cole',  status: 'short_rest',  notes: 'Short rest — monitor pitch count' },
    { date: 'Sep 2',  opponent: 'TOR', starterId: null, starterName: 'TBD',       status: 'bullpen_day', notes: 'Off day allows bullpen game' },
  ];
}
