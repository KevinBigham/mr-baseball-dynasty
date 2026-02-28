/**
 * bullpenFatigue.ts – Bullpen fatigue & availability model
 *
 * Tracks reliever fatigue levels based on recent workload (pitches,
 * appearances, consecutive days), rest patterns, and projects
 * availability and performance degradation.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type FatigueLevel = 'fresh' | 'normal' | 'tired' | 'gassed' | 'unavailable';

export interface RelieverFatigue {
  id: string;
  name: string;
  pos: string;
  team: string;
  overall: number;
  role: string;              // 'CL', 'SU', 'MID', 'LONG', 'LOGY'
  fatigueLevel: FatigueLevel;
  fatigueScore: number;      // 0-100 (0=fresh, 100=gassed)
  pitchesLast3Days: number;
  pitchesLast7Days: number;
  appearancesLast3: number;
  appearancesLast7: number;
  consecutiveDays: number;
  daysSinceLastApp: number;
  avgPitchesPerApp: number;
  eraWhenFresh: number;
  eraWhenTired: number;
  performanceDrop: number;   // % ERA increase when tired
  projAvailability: 'available' | 'emergency' | 'unavailable';
  recentApps: Array<{
    date: string;
    pitches: number;
    innings: number;
    result: string;
  }>;
  notes: string;
}

export const FATIGUE_DISPLAY: Record<FatigueLevel, { label: string; color: string; emoji: string }> = {
  fresh:       { label: 'Fresh',       color: '#22c55e', emoji: '🟢' },
  normal:      { label: 'Normal',      color: '#4ade80', emoji: '🟡' },
  tired:       { label: 'Tired',       color: '#f59e0b', emoji: '🟠' },
  gassed:      { label: 'Gassed',      color: '#ef4444', emoji: '🔴' },
  unavailable: { label: 'Unavailable', color: '#666',    emoji: '⬛' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface BullpenFatigueSummary {
  availableCount: number;
  emergencyOnly: number;
  unavailableCount: number;
  avgFatigueScore: number;
  mostOverworked: string;
  freshestArm: string;
}

export function getBullpenFatigueSummary(relievers: RelieverFatigue[]): BullpenFatigueSummary {
  const avail = relievers.filter(r => r.projAvailability === 'available').length;
  const emerg = relievers.filter(r => r.projAvailability === 'emergency').length;
  const unav = relievers.filter(r => r.projAvailability === 'unavailable').length;
  const avgFatigue = Math.round(relievers.reduce((s, r) => s + r.fatigueScore, 0) / relievers.length);
  const sorted = [...relievers].sort((a, b) => b.fatigueScore - a.fatigueScore);
  return {
    availableCount: avail,
    emergencyOnly: emerg,
    unavailableCount: unav,
    avgFatigueScore: avgFatigue,
    mostOverworked: sorted[0]?.name ?? '',
    freshestArm: sorted[sorted.length - 1]?.name ?? '',
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const RELIEVERS: Array<{ name: string; role: string }> = [
  { name: 'Emmanuel Clase', role: 'CL' },
  { name: 'Ryan Helsley', role: 'CL' },
  { name: 'Devin Williams', role: 'SU' },
  { name: 'Andrés Muñoz', role: 'SU' },
  { name: 'Evan Phillips', role: 'SU' },
  { name: 'Clay Holmes', role: 'SU' },
  { name: 'Robert Suarez', role: 'MID' },
  { name: 'Camilo Doval', role: 'MID' },
  { name: 'Yennier Cano', role: 'MID' },
  { name: 'Matt Brash', role: 'LONG' },
];

const TEAMS = ['CLE', 'STL', 'MIL', 'SEA', 'LAD', 'NYY', 'SD', 'SF', 'BAL', 'SEA'];
const DATES = ['4/12', '4/11', '4/10', '4/9', '4/8'];

function makeFatigueLevel(score: number): FatigueLevel {
  if (score <= 20) return 'fresh';
  if (score <= 40) return 'normal';
  if (score <= 60) return 'tired';
  if (score <= 80) return 'gassed';
  return 'unavailable';
}

export function generateDemoBullpenFatigue(): RelieverFatigue[] {
  return RELIEVERS.map((r, i) => {
    const fatigue = 15 + (i * 8) + ((i * 7) % 15);
    const p3 = 20 + (i * 8) + ((i * 3) % 15);
    const p7 = p3 + 25 + ((i * 5) % 20);
    const a3 = i < 4 ? 2 : (i < 7 ? 1 : 0);
    const a7 = a3 + 1 + ((i * 3) % 3);
    const consec = i < 3 ? 2 : (i < 6 ? 1 : 0);
    const daysSince = i < 3 ? 0 : (i < 6 ? 1 : 2 + ((i * 5) % 3));
    const eraFresh = 2.0 + ((i * 7) % 12) * 0.15;
    const perfDrop = 25 + ((i * 11) % 30);
    const eraTired = Math.round((eraFresh * (1 + perfDrop / 100)) * 100) / 100;
    const avail: 'available' | 'emergency' | 'unavailable' = fatigue <= 45 ? 'available' : fatigue <= 70 ? 'emergency' : 'unavailable';

    const apps = [];
    for (let j = 0; j < 3 + (i % 2); j++) {
      apps.push({
        date: DATES[j % DATES.length],
        pitches: 12 + ((i + j * 5) % 18),
        innings: j % 3 === 0 ? 1.0 : (j % 3 === 1 ? 0.2 : 1.1),
        result: j % 4 === 0 ? 'Save' : j % 4 === 1 ? 'Hold' : j % 4 === 2 ? 'Win' : 'No decision',
      });
    }

    return {
      id: `bf-${i}`,
      name: r.name,
      pos: 'RP',
      team: TEAMS[i],
      overall: 88 - i * 2 + ((i * 3) % 6),
      role: r.role,
      fatigueLevel: makeFatigueLevel(fatigue),
      fatigueScore: fatigue,
      pitchesLast3Days: p3,
      pitchesLast7Days: p7,
      appearancesLast3: a3,
      appearancesLast7: a7,
      consecutiveDays: consec,
      daysSinceLastApp: daysSince,
      avgPitchesPerApp: 14 + ((i * 5) % 8),
      eraWhenFresh: Math.round(eraFresh * 100) / 100,
      eraWhenTired: eraTired,
      performanceDrop: perfDrop,
      projAvailability: avail,
      recentApps: apps,
      notes: fatigue <= 25 ? 'Well rested. Should be available for full workload.' :
             fatigue <= 50 ? 'Moderate workload recently. Can pitch in normal situations.' :
             fatigue <= 70 ? 'Heavy recent usage. Reserve for high-leverage only.' :
             'Overworked. Needs a day off to recover arm strength.',
    };
  });
}
