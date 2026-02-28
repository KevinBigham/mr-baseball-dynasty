/**
 * Lineup Optimization Engine
 *
 * Analyzes lineup construction using sabermetric principles:
 * OBP at top, power in middle, lineup protection, and
 * platoon advantages. Provides optimization suggestions.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LineupSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const SLOT_ROLES: Record<LineupSlot, { label: string; ideal: string; color: string }> = {
  1: { label: 'Leadoff',    ideal: 'High OBP, good speed',           color: '#22c55e' },
  2: { label: '2nd',        ideal: 'Best overall hitter, high OBP',  color: '#3b82f6' },
  3: { label: 'Cleanup',    ideal: 'Best power hitter',              color: '#f97316' },
  4: { label: '4th',        ideal: 'Power + RBI producer',           color: '#ef4444' },
  5: { label: '5th',        ideal: 'Solid bat, lineup protection',   color: '#eab308' },
  6: { label: '6th',        ideal: 'Secondary power or contact',     color: '#8b5cf6' },
  7: { label: '7th',        ideal: 'Defensive specialist',           color: '#06b6d4' },
  8: { label: '8th',        ideal: 'Weakest bat or 2nd leadoff',     color: '#6b7280' },
  9: { label: '9th',        ideal: 'Pitcher or speed option',        color: '#94a3b8' },
};

export interface LineupPlayer {
  id: number;
  name: string;
  pos: string;
  hand: 'L' | 'R' | 'S';
  overall: number;
  obp: number;
  slg: number;
  ops: number;
  speed: number;      // 20-80
  power: number;      // 20-80
  contact: number;    // 20-80
  currentSlot: LineupSlot;
  optimalSlot: LineupSlot;
  isOptimal: boolean;
  slotGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface LineupAnalysis {
  currentRunsPerGame: number;
  optimalRunsPerGame: number;
  runsGained: number;
  overallGrade: string;
  weakSpots: string[];
  strengths: string[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function gradeSlot(player: LineupPlayer): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (player.currentSlot === player.optimalSlot) return 'A';
  const diff = Math.abs(player.currentSlot - player.optimalSlot);
  if (diff <= 1) return 'B';
  if (diff <= 2) return 'C';
  if (diff <= 3) return 'D';
  return 'F';
}

export function gradeColor(grade: string): string {
  if (grade === 'A') return '#22c55e';
  if (grade === 'B') return '#3b82f6';
  if (grade === 'C') return '#eab308';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const LINEUP_DATA = [
  { name: 'Trea Turner',       pos: 'SS',  hand: 'R' as const, ovr: 82, obp: .348, slg: .465, spd: 75, pow: 55, con: 70, cur: 1 as LineupSlot, opt: 1 as LineupSlot },
  { name: 'Shohei Ohtani',     pos: 'DH',  hand: 'L' as const, ovr: 95, obp: .412, slg: .650, spd: 60, pow: 80, con: 75, cur: 2 as LineupSlot, opt: 2 as LineupSlot },
  { name: 'Mookie Betts',      pos: '2B',  hand: 'R' as const, ovr: 88, obp: .395, slg: .545, spd: 65, pow: 60, con: 72, cur: 3 as LineupSlot, opt: 3 as LineupSlot },
  { name: 'Freddie Freeman',   pos: '1B',  hand: 'L' as const, ovr: 87, obp: .378, slg: .510, spd: 40, pow: 65, con: 78, cur: 4 as LineupSlot, opt: 5 as LineupSlot },
  { name: 'Will Smith',        pos: 'C',   hand: 'R' as const, ovr: 80, obp: .342, slg: .480, spd: 35, pow: 60, con: 62, cur: 5 as LineupSlot, opt: 6 as LineupSlot },
  { name: 'Max Muncy',         pos: '3B',  hand: 'L' as const, ovr: 76, obp: .360, slg: .475, spd: 30, pow: 65, con: 55, cur: 6 as LineupSlot, opt: 4 as LineupSlot },
  { name: 'James Outman',      pos: 'CF',  hand: 'L' as const, ovr: 70, obp: .310, slg: .420, spd: 70, pow: 50, con: 48, cur: 7 as LineupSlot, opt: 8 as LineupSlot },
  { name: 'Chris Taylor',      pos: 'LF',  hand: 'R' as const, ovr: 65, obp: .300, slg: .385, spd: 55, pow: 45, con: 50, cur: 8 as LineupSlot, opt: 7 as LineupSlot },
  { name: 'Gavin Lux',         pos: 'LF',  hand: 'L' as const, ovr: 68, obp: .318, slg: .395, spd: 50, pow: 40, con: 60, cur: 9 as LineupSlot, opt: 9 as LineupSlot },
];

export function generateDemoLineup(): LineupPlayer[] {
  return LINEUP_DATA.map((p, i) => {
    const player: LineupPlayer = {
      id: i,
      name: p.name,
      pos: p.pos,
      hand: p.hand,
      overall: p.ovr,
      obp: p.obp,
      slg: p.slg,
      ops: Math.round((p.obp + p.slg) * 1000) / 1000,
      speed: p.spd,
      power: p.pow,
      contact: p.con,
      currentSlot: p.cur,
      optimalSlot: p.opt,
      isOptimal: p.cur === p.opt,
      slotGrade: 'A',
    };
    player.slotGrade = gradeSlot(player);
    return player;
  });
}

export function analyzeLineup(players: LineupPlayer[]): LineupAnalysis {
  const optimalCount = players.filter(p => p.isOptimal).length;
  const overallGrade = optimalCount >= 7 ? 'A' : optimalCount >= 5 ? 'B' : optimalCount >= 3 ? 'C' : 'D';

  const weakSpots: string[] = [];
  const strengths: string[] = [];

  if (players[0]?.obp >= 0.340) strengths.push('Strong OBP at leadoff');
  else weakSpots.push('Leadoff OBP could be higher');

  if (players[2]?.slg >= 0.500) strengths.push('Elite power in 3-hole');
  else weakSpots.push('Need more power in cleanup spot');

  const lhCount = players.filter(p => p.hand === 'L').length;
  if (lhCount >= 3 && lhCount <= 5) strengths.push('Good L/R balance');
  else weakSpots.push('Lineup is too one-sided (L/R balance)');

  return {
    currentRunsPerGame: 4.8,
    optimalRunsPerGame: 5.2,
    runsGained: 0.4,
    overallGrade,
    weakSpots,
    strengths,
  };
}
