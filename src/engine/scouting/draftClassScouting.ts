/**
 * Draft Class Scouting Reports – individual prospect evaluations
 *
 * Models draft prospects with 20-80 tool grades, projection ranges,
 * comparison players, risk levels, and detailed scout notes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ToolGrade = number; // 20-80 scale

export interface ScoutingTool {
  name: string;
  current: ToolGrade;
  future: ToolGrade;
}

export interface ProspectComparison {
  playerName: string;
  similarity: number; // 0-100
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type ProspectLevel = 'HS' | 'College' | 'JUCO';

export interface DraftProspect {
  id: string;
  name: string;
  age: number;
  school: string;
  level: ProspectLevel;
  position: string;
  bats: 'L' | 'R' | 'S';
  throws: 'L' | 'R';
  projectedRound: number;
  projectedPick: number;
  tools: ScoutingTool[];
  overallGrade: ToolGrade;
  futureGrade: ToolGrade;
  eta: number;          // years to MLB
  riskLevel: RiskLevel;
  ceilingLabel: string;
  floorLabel: string;
  comparisons: ProspectComparison[];
  scoutNotes: string;
}

export interface DraftClassSummary {
  totalProspects: number;
  topOverall: string;
  mostUpside: string;
  avgGrade: number;
  hsCount: number;
  collegeCount: number;
  bestTool: string;
}

// ── Display helpers ────────────────────────────────────────────────────────

export const RISK_DISPLAY: Record<RiskLevel, { label: string; color: string }> = {
  low:       { label: 'Low Risk',       color: '#22c55e' },
  medium:    { label: 'Medium Risk',    color: '#f59e0b' },
  high:      { label: 'High Risk',      color: '#f97316' },
  very_high: { label: 'Very High Risk', color: '#ef4444' },
};

export function gradeColor(grade: ToolGrade): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 60) return '#4ade80';
  if (grade >= 50) return '#f59e0b';
  if (grade >= 40) return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export function getDraftClassSummary(prospects: DraftProspect[]): DraftClassSummary {
  if (prospects.length === 0) {
    return { totalProspects: 0, topOverall: '-', mostUpside: '-', avgGrade: 0, hsCount: 0, collegeCount: 0, bestTool: '-' };
  }
  const top = [...prospects].sort((a, b) => b.overallGrade - a.overallGrade)[0];
  const upside = [...prospects].sort((a, b) => b.futureGrade - a.futureGrade)[0];
  const avgG = Math.round(prospects.reduce((s, p) => s + p.overallGrade, 0) / prospects.length);
  const hs = prospects.filter(p => p.level === 'HS').length;
  const col = prospects.filter(p => p.level === 'College').length;

  // Find best individual tool
  let bestToolName = '';
  let bestToolGrade = 0;
  let bestToolPlayer = '';
  for (const p of prospects) {
    for (const t of p.tools) {
      if (t.future > bestToolGrade) {
        bestToolGrade = t.future;
        bestToolName = t.name;
        bestToolPlayer = p.name;
      }
    }
  }

  return {
    totalProspects: prospects.length,
    topOverall: top.name,
    mostUpside: upside.name,
    avgGrade: avgG,
    hsCount: hs,
    collegeCount: col,
    bestTool: `${bestToolPlayer} (${bestToolName}: ${bestToolGrade})`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoDraftClassScouting(): DraftProspect[] {
  return [
    {
      id: 'dp1', name: 'Cameron James', age: 18, school: 'Westlake HS (TX)', level: 'HS',
      position: 'SS', bats: 'R', throws: 'R', projectedRound: 1, projectedPick: 3,
      tools: [
        { name: 'Hit', current: 50, future: 60 },
        { name: 'Power', current: 55, future: 70 },
        { name: 'Run', current: 65, future: 60 },
        { name: 'Arm', current: 60, future: 65 },
        { name: 'Field', current: 55, future: 60 },
      ],
      overallGrade: 60, futureGrade: 70, eta: 4, riskLevel: 'medium',
      ceilingLabel: 'Perennial All-Star SS', floorLabel: 'Utility infielder',
      comparisons: [
        { playerName: 'Carlos Correa', similarity: 62 },
        { playerName: 'Xander Bogaerts', similarity: 55 },
      ],
      scoutNotes: 'Plus raw power from RS with advanced bat speed. Projects to stay at SS with fluid actions. Hit tool needs refinement against breaking balls. Premium athlete with loud tools.',
    },
    {
      id: 'dp2', name: 'Tyler Washington', age: 21, school: 'Vanderbilt', level: 'College',
      position: 'RHP', bats: 'R', throws: 'R', projectedRound: 1, projectedPick: 8,
      tools: [
        { name: 'Fastball', current: 65, future: 70 },
        { name: 'Slider', current: 60, future: 65 },
        { name: 'Changeup', current: 45, future: 55 },
        { name: 'Command', current: 55, future: 60 },
        { name: 'Stamina', current: 55, future: 60 },
      ],
      overallGrade: 58, futureGrade: 65, eta: 2, riskLevel: 'low',
      ceilingLabel: '#2 starter', floorLabel: 'High-leverage reliever',
      comparisons: [
        { playerName: 'Gerrit Cole (college)', similarity: 48 },
        { playerName: 'Marcus Stroman', similarity: 52 },
      ],
      scoutNotes: 'Elite spin rates on FB/SL combo. Sits 95-97, touches 99. Slider is wipeout pitch. Change needs development but shows feel. Polished SEC arm ready for fast track.',
    },
    {
      id: 'dp3', name: 'Marcus Rivera', age: 18, school: 'Miami Prep (FL)', level: 'HS',
      position: 'CF', bats: 'L', throws: 'L', projectedRound: 1, projectedPick: 12,
      tools: [
        { name: 'Hit', current: 45, future: 60 },
        { name: 'Power', current: 40, future: 55 },
        { name: 'Run', current: 70, future: 70 },
        { name: 'Arm', current: 50, future: 55 },
        { name: 'Field', current: 60, future: 65 },
      ],
      overallGrade: 55, futureGrade: 65, eta: 4, riskLevel: 'high',
      ceilingLabel: 'Dynamic leadoff CF', floorLabel: 'Speed-only 4th OF',
      comparisons: [
        { playerName: 'Trea Turner (HS)', similarity: 45 },
        { playerName: 'Billy Hamilton', similarity: 58 },
      ],
      scoutNotes: 'Plus-plus speed with elite range in CF. Raw and inconsistent at plate but shows ability to barrel pitches. Game-changing base stealer. Hit tool development is key.',
    },
    {
      id: 'dp4', name: 'Jack O\'Brien', age: 21, school: 'Texas A&M', level: 'College',
      position: 'C', bats: 'R', throws: 'R', projectedRound: 1, projectedPick: 18,
      tools: [
        { name: 'Hit', current: 55, future: 55 },
        { name: 'Power', current: 50, future: 60 },
        { name: 'Run', current: 30, future: 30 },
        { name: 'Arm', current: 65, future: 70 },
        { name: 'Field', current: 60, future: 65 },
        { name: 'Framing', current: 55, future: 60 },
      ],
      overallGrade: 55, futureGrade: 60, eta: 2, riskLevel: 'low',
      ceilingLabel: 'Gold Glove catcher', floorLabel: 'Backup C with pop',
      comparisons: [
        { playerName: 'J.T. Realmuto (college)', similarity: 42 },
        { playerName: 'Daulton Varsho', similarity: 50 },
      ],
      scoutNotes: 'Elite receiving skills with cannon arm. Pop times consistently under 1.90. Solid bat for a catcher with gap power. Leadership presence behind the plate.',
    },
    {
      id: 'dp5', name: 'Daisuke Tanaka', age: 18, school: 'Osaka Toin HS (JPN)', level: 'HS',
      position: 'LHP', bats: 'L', throws: 'L', projectedRound: 1, projectedPick: 22,
      tools: [
        { name: 'Fastball', current: 55, future: 65 },
        { name: 'Curveball', current: 55, future: 65 },
        { name: 'Changeup', current: 50, future: 60 },
        { name: 'Command', current: 50, future: 60 },
        { name: 'Deception', current: 60, future: 65 },
      ],
      overallGrade: 52, futureGrade: 65, eta: 5, riskLevel: 'very_high',
      ceilingLabel: '#1 starter', floorLabel: 'Organizational arm',
      comparisons: [
        { playerName: 'Yusei Kikuchi (amateur)', similarity: 55 },
        { playerName: 'Shohei Ohtani (pitching)', similarity: 32 },
      ],
      scoutNotes: 'Projectable LHP with deceptive delivery. FB sits 91-93, will add velocity. Plus curve at 18 years old. Very raw but ceiling is enormous. Long-term development play.',
    },
    {
      id: 'dp6', name: 'Brandon Cole', age: 20, school: 'Florida', level: 'College',
      position: '3B', bats: 'L', throws: 'R', projectedRound: 2, projectedPick: 42,
      tools: [
        { name: 'Hit', current: 55, future: 55 },
        { name: 'Power', current: 60, future: 65 },
        { name: 'Run', current: 45, future: 40 },
        { name: 'Arm', current: 55, future: 55 },
        { name: 'Field', current: 50, future: 50 },
      ],
      overallGrade: 52, futureGrade: 58, eta: 3, riskLevel: 'medium',
      ceilingLabel: 'Everyday 3B with 25+ HR', floorLabel: 'Platoon bat / 1B',
      comparisons: [
        { playerName: 'Matt Chapman (college)', similarity: 40 },
        { playerName: 'Justin Turner', similarity: 48 },
      ],
      scoutNotes: 'Power-first college bat with lift in swing. Hits LHP well for a lefty. Third base defense is fringe — may slide to 1B. Plus raw power plays in games.',
    },
    {
      id: 'dp7', name: 'Chris Archer Jr.', age: 18, school: 'Bishop Gorman HS (NV)', level: 'HS',
      position: 'RF', bats: 'R', throws: 'R', projectedRound: 2, projectedPick: 55,
      tools: [
        { name: 'Hit', current: 40, future: 55 },
        { name: 'Power', current: 55, future: 70 },
        { name: 'Run', current: 55, future: 50 },
        { name: 'Arm', current: 65, future: 70 },
        { name: 'Field', current: 50, future: 55 },
      ],
      overallGrade: 48, futureGrade: 62, eta: 5, riskLevel: 'very_high',
      ceilingLabel: '30+ HR corner OF', floorLabel: 'Org depth / minor leaguer',
      comparisons: [
        { playerName: 'Giancarlo Stanton (HS)', similarity: 35 },
        { playerName: 'Kyle Tucker (HS)', similarity: 42 },
      ],
      scoutNotes: 'Enormous raw power — 70 grade potential. Big strong frame at 6\'4\" 215. Hit tool is very raw, heavy swing-and-miss. Boom-or-bust profile but upside is tantalizing.',
    },
    {
      id: 'dp8', name: 'Luis Delgado', age: 21, school: 'San Jacinto JC', level: 'JUCO',
      position: 'RHP', bats: 'R', throws: 'R', projectedRound: 3, projectedPick: 78,
      tools: [
        { name: 'Fastball', current: 60, future: 65 },
        { name: 'Slider', current: 55, future: 60 },
        { name: 'Command', current: 40, future: 50 },
        { name: 'Stamina', current: 45, future: 50 },
      ],
      overallGrade: 48, futureGrade: 55, eta: 3, riskLevel: 'high',
      ceilingLabel: 'Setup reliever / back-end SP', floorLabel: 'Low-leverage bullpen',
      comparisons: [
        { playerName: 'Edwin Diaz (JUCO)', similarity: 38 },
        { playerName: 'Craig Kimbrel (early)', similarity: 32 },
      ],
      scoutNotes: 'Big arm JUCO arm sitting 96-98. Explosive slider flashes plus. Command is below-average and durability questions exist. Likely reliever but could start if command develops.',
    },
  ];
}
