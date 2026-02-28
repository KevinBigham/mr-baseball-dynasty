/**
 * prospectCompMatrix.ts – Prospect Comparison Matrix Engine
 *
 * Bloomberg-terminal-style side-by-side prospect comparison tool.
 * Compares tools, grades, development trajectory, and historical
 * comps for multiple prospects simultaneously. All demo data.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ToolName = 'Hit' | 'Power' | 'Speed' | 'Arm' | 'Field' | 'Overall';

export interface ToolGrade {
  tool: ToolName;
  current: number;    // 20-80 scale
  future: number;     // 20-80 projected ceiling
  delta: number;      // future - current
}

export interface HistoricalComp {
  name: string;
  similarity: number;  // 0-100
  peakWAR: number;
  careerWAR: number;
}

export interface ProspectProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  level: string;       // e.g. "AA", "AAA", "A+"
  overallRank: number;
  orgRank: number;
  eta: number;         // year
  tools: ToolGrade[];
  avgCurrentGrade: number;
  avgFutureGrade: number;
  risk: 'Low' | 'Medium' | 'High' | 'Very High';
  historicalComps: HistoricalComp[];
  strengths: string[];
  weaknesses: string[];
  notes: string;
}

// ── Display Helpers ────────────────────────────────────────────────────────

export function gradeColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 60) return '#4ade80';
  if (grade >= 50) return '#f59e0b';
  if (grade >= 40) return '#f97316';
  return '#ef4444';
}

export const RISK_DISPLAY: Record<string, { label: string; color: string }> = {
  Low:       { label: 'Low',       color: '#22c55e' },
  Medium:    { label: 'Medium',    color: '#f59e0b' },
  High:      { label: 'High',      color: '#f97316' },
  'Very High': { label: 'Very High', color: '#ef4444' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface ProspectMatrixSummary {
  totalProspects: number;
  highestCeiling: string;
  mostMLBReady: string;
  avgFutureGrade: number;
  bestTool: { name: string; tool: string; grade: number };
}

export function getProspectMatrixSummary(profiles: ProspectProfile[]): ProspectMatrixSummary {
  const highestCeiling = [...profiles].sort((a, b) => b.avgFutureGrade - a.avgFutureGrade)[0];
  const mostReady = [...profiles].sort((a, b) => a.eta - b.eta || (b.avgCurrentGrade - a.avgCurrentGrade))[0];
  const avgFG = Math.round(profiles.reduce((s, p) => s + p.avgFutureGrade, 0) / profiles.length);

  // Best single tool
  let bestToolName = '';
  let bestToolTool = '';
  let bestToolGrade = 0;
  profiles.forEach(p => {
    p.tools.forEach(t => {
      if (t.future > bestToolGrade) {
        bestToolGrade = t.future;
        bestToolName = p.name;
        bestToolTool = t.tool;
      }
    });
  });

  return {
    totalProspects: profiles.length,
    highestCeiling: `${highestCeiling.name} (${highestCeiling.avgFutureGrade})`,
    mostMLBReady: `${mostReady.name} (${mostReady.eta})`,
    avgFutureGrade: avgFG,
    bestTool: { name: bestToolName, tool: bestToolTool, grade: bestToolGrade },
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PROSPECTS = [
  {
    name: 'Jackson Holliday', team: 'BAL', pos: 'SS', age: 20, level: 'AAA', ovrRk: 1, orgRk: 1, eta: 2025,
    tools: [75, 60, 55, 50, 60], risk: 'Low' as const,
    comps: [{ name: 'Corey Seager', sim: 85, pk: 7.2, car: 42.0 }, { name: 'Troy Tulowitzki', sim: 72, pk: 6.8, car: 33.6 }],
    str: ['Elite bat speed', 'Advanced approach', 'Plus hit tool'],
    wk: ['Needs to refine defense', 'Avg arm strength'],
  },
  {
    name: 'Dylan Crews', team: 'WSH', pos: 'CF', age: 21, level: 'AA', ovrRk: 3, orgRk: 1, eta: 2025,
    tools: [65, 55, 60, 55, 55], risk: 'Low' as const,
    comps: [{ name: 'Andrew Benintendi', sim: 78, pk: 4.8, car: 18.2 }, { name: 'Christian Yelich', sim: 70, pk: 7.6, car: 38.4 }],
    str: ['Pure hitter', 'Good CF defense', 'Patient approach'],
    wk: ['Power may be fringe-avg', 'Lacks elite speed'],
  },
  {
    name: 'Roki Sasaki', team: 'LAD', pos: 'RHP', age: 22, level: 'MLB', ovrRk: 2, orgRk: 1, eta: 2025,
    tools: [0, 0, 0, 80, 0], risk: 'Medium' as const,
    comps: [{ name: 'Yu Darvish', sim: 82, pk: 6.4, car: 36.8 }, { name: 'Shohei Ohtani', sim: 65, pk: 9.2, car: 42.0 }],
    str: ['102 mph fastball', 'Elite splitter', 'Advanced feel'],
    wk: ['Workload management', 'First MLB season'],
  },
  {
    name: 'Junior Caminero', team: 'TB', pos: '3B', age: 20, level: 'AAA', ovrRk: 5, orgRk: 1, eta: 2025,
    tools: [65, 70, 45, 55, 50], risk: 'Medium' as const,
    comps: [{ name: 'Manny Machado', sim: 74, pk: 7.0, car: 48.2 }, { name: 'Adrian Beltre', sim: 68, pk: 7.8, car: 93.5 }],
    str: ['Plus-plus raw power', 'Quick bat', 'Hard contact'],
    wk: ['Needs to improve discipline', 'Avg speed'],
  },
  {
    name: 'Ethan Salas', team: 'SD', pos: 'C', age: 18, level: 'A+', ovrRk: 8, orgRk: 1, eta: 2027,
    tools: [60, 55, 30, 50, 60], risk: 'High' as const,
    comps: [{ name: 'Joe Mauer', sim: 60, pk: 7.4, car: 55.2 }, { name: 'Salvador Perez', sim: 72, pk: 4.8, car: 28.6 }],
    str: ['Advanced bat for age', 'Excellent receiver', 'Leadership'],
    wk: ['Long development timeline', 'Below-avg speed', 'Small sample'],
  },
  {
    name: 'Travis Bazzana', team: 'CLE', pos: '2B', age: 21, level: 'A+', ovrRk: 6, orgRk: 1, eta: 2026,
    tools: [70, 50, 55, 45, 55], risk: 'Low' as const,
    comps: [{ name: 'DJ LeMahieu', sim: 75, pk: 5.0, car: 32.4 }, { name: 'Dustin Pedroia', sim: 68, pk: 7.6, car: 51.4 }],
    str: ['Plus hit tool', 'Elite bat-to-ball', 'Smart baserunner'],
    wk: ['Power may top out at avg', 'Arm is fringe'],
  },
  {
    name: 'Roman Anthony', team: 'BOS', pos: 'LF', age: 20, level: 'AA', ovrRk: 4, orgRk: 1, eta: 2025,
    tools: [60, 65, 55, 55, 50], risk: 'Medium' as const,
    comps: [{ name: 'Kyle Tucker', sim: 80, pk: 5.8, car: 22.4 }, { name: 'Bryce Harper', sim: 62, pk: 10.0, car: 48.0 }],
    str: ['Power/speed combo', 'Advanced approach', 'Plus raw power'],
    wk: ['Needs reps in outfield', 'Swing-and-miss concerns'],
  },
  {
    name: 'Max Clark', team: 'DET', pos: 'CF', age: 19, level: 'A', ovrRk: 12, orgRk: 1, eta: 2027,
    tools: [55, 45, 80, 50, 65], risk: 'High' as const,
    comps: [{ name: 'Trea Turner', sim: 70, pk: 6.4, car: 34.2 }, { name: 'Kenny Lofton', sim: 65, pk: 5.8, car: 68.2 }],
    str: ['80-grade speed', 'Elite CF defense', 'Athletic frame'],
    wk: ['Hit tool is raw', 'Power may not develop', 'Long timeline'],
  },
];

const TOOL_NAMES: ToolName[] = ['Hit', 'Power', 'Speed', 'Arm', 'Field'];

export function generateDemoProspectMatrix(): ProspectProfile[] {
  return PROSPECTS.map((p, i) => {
    const isPitcher = p.pos === 'RHP' || p.pos === 'LHP';
    const toolGrades: ToolGrade[] = isPitcher
      ? [
          { tool: 'Hit' as ToolName, current: 0, future: 0, delta: 0 },
          { tool: 'Power' as ToolName, current: 0, future: 0, delta: 0 },
          { tool: 'Speed' as ToolName, current: 0, future: 0, delta: 0 },
          { tool: 'Arm' as ToolName, current: p.tools[3], future: Math.min(80, p.tools[3] + 5), delta: 5 },
          { tool: 'Field' as ToolName, current: 0, future: 0, delta: 0 },
        ]
      : TOOL_NAMES.map((t, ti) => {
          const current = p.tools[ti] - ((i * 3 + ti * 2) % 8);
          const future = p.tools[ti];
          return { tool: t, current: Math.max(20, current), future, delta: future - Math.max(20, current) };
        });

    const validTools = toolGrades.filter(t => t.current > 0 || t.future > 0);
    const avgCurrent = validTools.length > 0
      ? Math.round(validTools.reduce((s, t) => s + t.current, 0) / validTools.length)
      : 0;
    const avgFuture = validTools.length > 0
      ? Math.round(validTools.reduce((s, t) => s + t.future, 0) / validTools.length)
      : 0;

    return {
      id: `pm-${i}`,
      name: p.name,
      team: p.team,
      position: p.pos,
      age: p.age,
      level: p.level,
      overallRank: p.ovrRk,
      orgRank: p.orgRk,
      eta: p.eta,
      tools: toolGrades,
      avgCurrentGrade: avgCurrent,
      avgFutureGrade: avgFuture,
      risk: p.risk,
      historicalComps: p.comps.map(c => ({
        name: c.name,
        similarity: c.sim,
        peakWAR: c.pk,
        careerWAR: c.car,
      })),
      strengths: p.str,
      weaknesses: p.wk,
      notes: `#${p.ovrRk} overall prospect. ${p.risk} risk profile with ${avgFuture >= 60 ? 'elite' : avgFuture >= 50 ? 'above-average' : 'average'} ceiling. ETA: ${p.eta}.`,
    };
  });
}
