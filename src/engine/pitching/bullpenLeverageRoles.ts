/**
 * Bullpen Leverage Roles — Mr. Baseball Dynasty
 *
 * Optimal reliever deployment system:
 *   - Role classification (closer, setup, high/med/low leverage, long relief, mop-up)
 *   - Performance splits by leverage situation
 *   - Role mismatch detection
 *   - Inherited runner scoring analysis
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeverageRole =
  | 'closer'
  | 'setup'
  | 'high_leverage'
  | 'medium_leverage'
  | 'low_leverage'
  | 'long_relief'
  | 'mop_up';

export interface RelieverProfile {
  id:              string;
  name:            string;
  team:            string;
  throws:          'L' | 'R';
  age:             number;
  era:             number;
  whip:            number;
  k9:              number;
  currentRole:     LeverageRole;
  optimalRole:     LeverageRole;
  roleMatchPct:    number; // how well current matches optimal (0-100)
  highLevERA:      number;
  medLevERA:       number;
  lowLevERA:       number;
  savePct:         number;
  holds:           number;
  inheritedScore:  number; // pct of inherited runners stranded (0-100)
  notes:           string;
}

// ─── Display Constants ────────────────────────────────────────────────────────

export const LEVERAGE_ROLE_DISPLAY: Record<LeverageRole, { label: string; color: string; priority: number }> = {
  closer:          { label: 'Closer',      color: '#ef4444', priority: 1 },
  setup:           { label: 'Setup',       color: '#f59e0b', priority: 2 },
  high_leverage:   { label: 'High Lev',    color: '#fb923c', priority: 3 },
  medium_leverage: { label: 'Med Lev',     color: '#22c55e', priority: 4 },
  low_leverage:    { label: 'Low Lev',     color: '#3b82f6', priority: 5 },
  long_relief:     { label: 'Long Relief', color: '#8b5cf6', priority: 6 },
  mop_up:          { label: 'Mop Up',      color: '#6b7280', priority: 7 },
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export function getBullpenLeverageSummary(relievers: RelieverProfile[]): {
  totalRelievers: number;
  bestHighLev:    string;
  closerName:     string;
  avgRoleMatch:   number;
  misscastCount:  number;
} {
  if (relievers.length === 0) {
    return {
      totalRelievers: 0,
      bestHighLev:    '—',
      closerName:     '—',
      avgRoleMatch:   0,
      misscastCount:  0,
    };
  }

  // Best high-leverage performer: lowest highLevERA among those with meaningful innings
  const highLevSorted = [...relievers].sort((a, b) => a.highLevERA - b.highLevERA);
  const bestHighLev = highLevSorted[0]!.name;

  // Closer
  const closer = relievers.find(r => r.currentRole === 'closer');
  const closerName = closer ? closer.name : '—';

  // Average role match
  const avgRoleMatch = Math.round(
    relievers.reduce((sum, r) => sum + r.roleMatchPct, 0) / relievers.length,
  );

  // Miscast count: relievers with roleMatchPct below 50
  const misscastCount = relievers.filter(r => r.roleMatchPct < 50).length;

  return {
    totalRelievers: relievers.length,
    bestHighLev,
    closerName,
    avgRoleMatch,
    misscastCount,
  };
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

export function generateDemoBullpenLeverage(): RelieverProfile[] {
  return [
    {
      id: 'bl-1',
      name: 'Kenley Davis',
      team: 'NYY',
      throws: 'R',
      age: 30,
      era: 2.45,
      whip: 0.98,
      k9: 11.2,
      currentRole: 'closer',
      optimalRole: 'closer',
      roleMatchPct: 95,
      highLevERA: 1.85,
      medLevERA: 2.90,
      lowLevERA: 3.50,
      savePct: 89,
      holds: 2,
      inheritedScore: 78,
      notes: 'Elite closer. Cutter dominates in high-pressure situations.',
    },
    {
      id: 'bl-2',
      name: 'Marco Estrada',
      team: 'NYY',
      throws: 'L',
      age: 28,
      era: 3.10,
      whip: 1.12,
      k9: 10.5,
      currentRole: 'setup',
      optimalRole: 'high_leverage',
      roleMatchPct: 72,
      highLevERA: 2.20,
      medLevERA: 3.40,
      lowLevERA: 4.10,
      savePct: 0,
      holds: 24,
      inheritedScore: 82,
      notes: 'Lefty specialist. Better suited to multi-inning high-leverage role.',
    },
    {
      id: 'bl-3',
      name: 'Travis Shaw',
      team: 'NYY',
      throws: 'R',
      age: 26,
      era: 3.55,
      whip: 1.18,
      k9: 9.8,
      currentRole: 'high_leverage',
      optimalRole: 'setup',
      roleMatchPct: 68,
      highLevERA: 4.10,
      medLevERA: 2.80,
      lowLevERA: 2.50,
      savePct: 0,
      holds: 18,
      inheritedScore: 65,
      notes: 'Actually performs better in medium leverage. Miscast in high-pressure.',
    },
    {
      id: 'bl-4',
      name: 'Jordan Alvarez',
      team: 'NYY',
      throws: 'R',
      age: 32,
      era: 3.80,
      whip: 1.25,
      k9: 8.4,
      currentRole: 'medium_leverage',
      optimalRole: 'medium_leverage',
      roleMatchPct: 88,
      highLevERA: 4.50,
      medLevERA: 3.10,
      lowLevERA: 3.60,
      savePct: 0,
      holds: 12,
      inheritedScore: 71,
      notes: 'Reliable middle-innings arm. Sinker keeps ball on ground.',
    },
    {
      id: 'bl-5',
      name: 'Ryan Nakamura',
      team: 'NYY',
      throws: 'L',
      age: 24,
      era: 4.20,
      whip: 1.32,
      k9: 9.1,
      currentRole: 'low_leverage',
      optimalRole: 'high_leverage',
      roleMatchPct: 35,
      highLevERA: 2.65,
      medLevERA: 3.90,
      lowLevERA: 5.80,
      savePct: 0,
      holds: 5,
      inheritedScore: 85,
      notes: 'Hidden gem. Thrives under pressure but wasted in low-leverage spots.',
    },
    {
      id: 'bl-6',
      name: 'Derek Brooks',
      team: 'NYY',
      throws: 'R',
      age: 29,
      era: 4.65,
      whip: 1.38,
      k9: 7.2,
      currentRole: 'long_relief',
      optimalRole: 'long_relief',
      roleMatchPct: 82,
      highLevERA: 5.50,
      medLevERA: 4.80,
      lowLevERA: 3.90,
      savePct: 0,
      holds: 3,
      inheritedScore: 58,
      notes: 'Innings eater. Can give you 2-3 frames in blowouts.',
    },
    {
      id: 'bl-7',
      name: 'Chris Yamamoto',
      team: 'NYY',
      throws: 'R',
      age: 27,
      era: 5.10,
      whip: 1.45,
      k9: 6.8,
      currentRole: 'mop_up',
      optimalRole: 'low_leverage',
      roleMatchPct: 55,
      highLevERA: 6.20,
      medLevERA: 5.40,
      lowLevERA: 4.10,
      savePct: 0,
      holds: 1,
      inheritedScore: 45,
      notes: 'Struggling with command. Could handle low-leverage with mechanical fix.',
    },
  ];
}
