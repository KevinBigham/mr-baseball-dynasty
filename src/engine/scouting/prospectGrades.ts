/**
 * prospectGrades.ts – Prospect scouting grades & tool analysis
 *
 * Detailed 20-80 tool grades for prospects with present/future splits,
 * hit tool breakdown, power projection, risk assessment, and ETA.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
export type ETA = '2025' | '2026' | '2027' | '2028+';

export interface ToolGrade {
  tool: string;
  present: number;   // 20-80
  future: number;    // 20-80
  trending: 'up' | 'flat' | 'down';
}

export interface ProspectGradeCard {
  id: string;
  name: string;
  pos: string;
  team: string;
  age: number;
  level: string;          // 'AAA', 'AA', 'A+', 'A', 'CPX'
  fvGrade: number;        // future value 20-80
  overallRank: number;
  orgRank: number;
  tools: ToolGrade[];
  risk: RiskLevel;
  eta: ETA;
  bodyType: string;
  signBonus: number;      // $M
  draftPick: string;      // e.g. '1st Rd, 2024 (#5)'
  notes: string;
  comp: string;           // player comp e.g. "Trea Turner lite"
}

export const RISK_DISPLAY: Record<RiskLevel, { label: string; color: string }> = {
  low:     { label: 'Low Risk',     color: '#22c55e' },
  medium:  { label: 'Medium Risk',  color: '#f59e0b' },
  high:    { label: 'High Risk',    color: '#f97316' },
  extreme: { label: 'Extreme Risk', color: '#ef4444' },
};

export function gradeColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 60) return '#4ade80';
  if (grade >= 50) return '#f59e0b';
  if (grade >= 40) return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface ProspectGradeSummary {
  totalProspects: number;
  eliteProspects: number;      // FV 60+
  avgFV: number;
  lowestRisk: string;
  closestETA: string;
}

export function getProspectGradeSummary(cards: ProspectGradeCard[]): ProspectGradeSummary {
  const elites = cards.filter(c => c.fvGrade >= 60).length;
  const avgFV = Math.round(cards.reduce((s, c) => s + c.fvGrade, 0) / cards.length);
  const lowRisk = cards.filter(c => c.risk === 'low')[0];
  const closestCards = [...cards].sort((a, b) => a.eta.localeCompare(b.eta));
  return {
    totalProspects: cards.length,
    eliteProspects: elites,
    avgFV: avgFV,
    lowestRisk: lowRisk?.name ?? cards[0].name,
    closestETA: closestCards[0]?.name ?? '',
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PROSPECTS = [
  { name: 'Jackson Holliday', pos: 'SS', team: 'BAL', age: 20, level: 'AAA', fv: 70, rank: 1, org: 1, risk: 'low' as const, eta: '2025' as const, body: '6-1 185 athletic', bonus: 8.19, pick: '1st Rd, 2022 (#1)', comp: 'Carlos Correa' },
  { name: 'Junior Caminero', pos: '3B', team: 'TB', age: 20, level: 'AA', fv: 65, rank: 3, org: 1, risk: 'medium' as const, eta: '2025' as const, body: '6-1 170 projectable', bonus: 0.01, pick: 'IFA 2021', comp: 'Manny Machado lite' },
  { name: 'Wyatt Langford', pos: 'CF', team: 'TEX', age: 22, level: 'AAA', fv: 60, rank: 5, org: 1, risk: 'low' as const, eta: '2025' as const, body: '6-0 200 strong', bonus: 4.0, pick: '1st Rd, 2023 (#4)', comp: 'Christian Yelich' },
  { name: 'Jackson Merrill', pos: 'CF', team: 'SD', age: 20, level: 'AA', fv: 60, rank: 7, org: 1, risk: 'medium' as const, eta: '2025' as const, body: '6-3 195 projectable', bonus: 1.8, pick: '1st Rd, 2021 (#27)', comp: 'Corey Seager' },
  { name: 'Marcelo Mayer', pos: 'SS', team: 'BOS', age: 21, level: 'AA', fv: 65, rank: 4, org: 1, risk: 'medium' as const, eta: '2026' as const, body: '6-3 188 lean', bonus: 6.66, pick: '1st Rd, 2021 (#4)', comp: 'Trea Turner' },
  { name: 'Roki Sasaki', pos: 'SP', team: 'LAD', age: 23, level: 'MLB', fv: 70, rank: 2, org: 1, risk: 'high' as const, eta: '2025' as const, body: '6-4 185 lean', bonus: 6.5, pick: 'NPB 2024', comp: 'Yu Darvish 2.0' },
  { name: 'Ethan Salas', pos: 'C', team: 'SD', age: 18, level: 'A', fv: 65, rank: 6, org: 2, risk: 'high' as const, eta: '2027' as const, body: '6-0 185 strong', bonus: 5.6, pick: 'IFA 2022', comp: 'Salvador Perez' },
  { name: 'Max Clark', pos: 'CF', team: 'DET', age: 19, level: 'A', fv: 60, rank: 8, org: 1, risk: 'high' as const, eta: '2027' as const, body: '6-1 190 athletic', bonus: 6.5, pick: '1st Rd, 2023 (#3)', comp: 'Andrew McCutchen' },
  { name: 'Coby Mayo', pos: '3B', team: 'BAL', age: 22, level: 'AAA', fv: 55, rank: 12, org: 2, risk: 'medium' as const, eta: '2025' as const, body: '6-5 230 strong', bonus: 1.75, pick: '4th Rd, 2020', comp: 'Matt Chapman' },
  { name: 'Kyle Teel', pos: 'C', team: 'BOS', age: 23, level: 'AA', fv: 55, rank: 15, org: 2, risk: 'low' as const, eta: '2026' as const, body: '6-0 190 sturdy', bonus: 3.6, pick: '1st Rd, 2023 (#14)', comp: 'J.T. Realmuto' },
];

const TOOL_NAMES_POS = ['Hit', 'Power', 'Run', 'Field', 'Arm'];
const TOOL_NAMES_PITCH = ['Fastball', 'Slider', 'Changeup', 'Command', 'Stamina'];

export function generateDemoProspectGrades(): ProspectGradeCard[] {
  return PROSPECTS.map((p, i) => {
    const isPitcher = p.pos === 'SP' || p.pos === 'RP';
    const toolNames = isPitcher ? TOOL_NAMES_PITCH : TOOL_NAMES_POS;
    const tools: ToolGrade[] = toolNames.map((t, j) => {
      const present = 40 + ((i * 7 + j * 11) % 25);
      const future = present + 5 + ((i + j * 3) % 15);
      return {
        tool: t,
        present: Math.min(present, 80),
        future: Math.min(future, 80),
        trending: ((i + j) % 3 === 0 ? 'up' : (i + j) % 3 === 1 ? 'flat' : 'down') as 'up' | 'flat' | 'down',
      };
    });

    return {
      id: `pg-${i}`,
      name: p.name,
      pos: p.pos,
      team: p.team,
      age: p.age,
      level: p.level,
      fvGrade: p.fv,
      overallRank: p.rank,
      orgRank: p.org,
      tools,
      risk: p.risk,
      eta: p.eta,
      bodyType: p.body,
      signBonus: p.bonus,
      draftPick: p.pick,
      notes: `${p.name} projects as a ${p.fv >= 65 ? 'potential All-Star' : p.fv >= 55 ? 'solid regular' : 'useful role player'}. ${p.risk === 'low' ? 'Safe floor with clear path.' : p.risk === 'high' ? 'High ceiling but significant development risk.' : 'Moderate risk with good upside.'}`,
      comp: p.comp,
    };
  });
}
