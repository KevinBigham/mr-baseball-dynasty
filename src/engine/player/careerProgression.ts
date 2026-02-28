/**
 * Career Progression Tracker
 *
 * Tracks player development curves across seasons.
 * Shows improvement/decline trends, peak projections,
 * and age-based regression analysis.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CareerPhase = 'rising_star' | 'developing' | 'peak' | 'plateau' | 'declining' | 'aging';

export const PHASE_DISPLAY: Record<CareerPhase, { label: string; emoji: string; color: string }> = {
  rising_star: { label: 'Rising Star',  emoji: '⭐', color: '#22c55e' },
  developing:  { label: 'Developing',   emoji: '📈', color: '#3b82f6' },
  peak:        { label: 'Peak',          emoji: '🏔️', color: '#f97316' },
  plateau:     { label: 'Plateau',       emoji: '➡️', color: '#eab308' },
  declining:   { label: 'Declining',     emoji: '📉', color: '#f97316' },
  aging:       { label: 'Aging',         emoji: '🕰️', color: '#ef4444' },
};

export interface SeasonStats {
  year: number;
  age: number;
  overall: number;
  war: number;
  keyStats: string;      // formatted summary
}

export interface ProgressionPlayer {
  id: number;
  name: string;
  pos: string;
  age: number;
  currentOvr: number;
  peakOvr: number;
  peakAge: number;
  phase: CareerPhase;
  projectedOvrNext: number;
  careerSeasons: SeasonStats[];
  ovrChangeLast3: number;    // change over last 3 years
  warTrend: 'up' | 'down' | 'stable';
  yearsToDecline: number;    // projected years until decline begins
  ceilingOvr: number;
  floorOvr: number;
}

export interface ProgressionSummary {
  risingStars: number;
  peakPlayers: number;
  decliningPlayers: number;
  avgAge: number;
  avgOvrChange: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getCareerPhase(age: number, ovrChange: number, peakAge: number): CareerPhase {
  if (age <= 24 && ovrChange >= 3) return 'rising_star';
  if (age <= 26 && ovrChange >= 1) return 'developing';
  if (age >= 33 && ovrChange <= -3) return 'aging';
  if (ovrChange <= -2) return 'declining';
  if (Math.abs(ovrChange) <= 1) return 'plateau';
  return 'peak';
}

export function getProgressionSummary(players: ProgressionPlayer[]): ProgressionSummary {
  return {
    risingStars: players.filter(p => p.phase === 'rising_star' || p.phase === 'developing').length,
    peakPlayers: players.filter(p => p.phase === 'peak').length,
    decliningPlayers: players.filter(p => p.phase === 'declining' || p.phase === 'aging').length,
    avgAge: Math.round(players.reduce((s, p) => s + p.age, 0) / players.length * 10) / 10,
    avgOvrChange: Math.round(players.reduce((s, p) => s + p.ovrChangeLast3, 0) / players.length * 10) / 10,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoProgressions(): ProgressionPlayer[] {
  const data = [
    { name: 'Julio Rodriguez', pos: 'CF', age: 24, cur: 85, peak: 85, pAge: 24, proj: 88, c3: 8,  war: 'up' as const, ytd: 4, ceil: 93, floor: 80,
      seasons: [{ yr: 2022, age: 21, ovr: 72, war: 2.1, s: '.284/28 HR/75 RBI' }, { yr: 2023, age: 22, ovr: 77, war: 3.5, s: '.265/32 HR/82 RBI' }, { yr: 2024, age: 23, ovr: 82, war: 4.8, s: '.278/35 HR/95 RBI' }, { yr: 2025, age: 24, ovr: 85, war: 5.2, s: '.290/38 HR/102 RBI' }] },
    { name: 'Gunnar Henderson', pos: 'SS', age: 23, cur: 83, peak: 83, pAge: 23, proj: 87, c3: 10, war: 'up' as const, ytd: 5, ceil: 92, floor: 78,
      seasons: [{ yr: 2023, age: 22, ovr: 73, war: 3.0, s: '.255/28 HR/72 RBI' }, { yr: 2024, age: 23, ovr: 80, war: 4.5, s: '.280/35 HR/88 RBI' }, { yr: 2025, age: 23, ovr: 83, war: 5.5, s: '.292/38 HR/98 RBI' }] },
    { name: 'Freddie Freeman', pos: '1B', age: 34, cur: 87, peak: 90, pAge: 30, proj: 84, c3: -3, war: 'down' as const, ytd: 0, ceil: 87, floor: 78,
      seasons: [{ yr: 2021, age: 31, ovr: 90, war: 5.8, s: '.300/31 HR/83 RBI' }, { yr: 2022, age: 32, ovr: 89, war: 5.5, s: '.325/21 HR/100 RBI' }, { yr: 2023, age: 33, ovr: 88, war: 4.8, s: '.331/29 HR/102 RBI' }, { yr: 2024, age: 34, ovr: 87, war: 4.2, s: '.282/22 HR/78 RBI' }] },
    { name: 'Aaron Judge', pos: 'RF', age: 33, cur: 92, peak: 95, pAge: 30, proj: 88, c3: -2, war: 'down' as const, ytd: 1, ceil: 92, floor: 82,
      seasons: [{ yr: 2022, age: 30, ovr: 95, war: 10.6, s: '.311/62 HR/131 RBI' }, { yr: 2023, age: 31, ovr: 93, war: 6.2, s: '.267/37 HR/75 RBI' }, { yr: 2024, age: 32, ovr: 92, war: 5.8, s: '.322/58 HR/144 RBI' }, { yr: 2025, age: 33, ovr: 92, war: 5.0, s: '.280/42 HR/105 RBI' }] },
    { name: 'Corbin Burnes', pos: 'SP', age: 30, cur: 87, peak: 90, pAge: 27, proj: 85, c3: -1, war: 'stable' as const, ytd: 1, ceil: 87, floor: 80,
      seasons: [{ yr: 2021, age: 27, ovr: 90, war: 7.5, s: '11-5 2.43 ERA 234 K' }, { yr: 2022, age: 28, ovr: 89, war: 5.8, s: '12-8 2.94 ERA 243 K' }, { yr: 2023, age: 29, ovr: 88, war: 5.2, s: '10-8 3.39 ERA 200 K' }, { yr: 2024, age: 30, ovr: 87, war: 4.5, s: '15-9 2.92 ERA 181 K' }] },
    { name: 'Pete Alonso', pos: '1B', age: 30, cur: 80, peak: 84, pAge: 27, proj: 78, c3: -4, war: 'down' as const, ytd: 0, ceil: 80, floor: 72,
      seasons: [{ yr: 2022, age: 27, ovr: 84, war: 3.8, s: '.271/40 HR/131 RBI' }, { yr: 2023, age: 28, ovr: 82, war: 3.2, s: '.217/46 HR/118 RBI' }, { yr: 2024, age: 29, ovr: 81, war: 2.5, s: '.240/34 HR/88 RBI' }, { yr: 2025, age: 30, ovr: 80, war: 2.2, s: '.235/30 HR/82 RBI' }] },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    age: d.age,
    currentOvr: d.cur,
    peakOvr: d.peak,
    peakAge: d.pAge,
    phase: getCareerPhase(d.age, d.c3, d.pAge),
    projectedOvrNext: d.proj,
    careerSeasons: d.seasons.map(s => ({ year: s.yr, age: s.age, overall: s.ovr, war: s.war, keyStats: s.s })),
    ovrChangeLast3: d.c3,
    warTrend: d.war,
    yearsToDecline: d.ytd,
    ceilingOvr: d.ceil,
    floorOvr: d.floor,
  }));
}
