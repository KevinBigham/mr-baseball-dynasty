/**
 * draftClassStrength.ts – Draft Class Strength Analysis
 *
 * Evaluates annual draft classes by overall talent, depth, positional
 * breakdown, and historical comparison. Helps GMs plan draft strategy
 * based on class quality assessment.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ClassGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';

export interface PositionalBreakdown {
  position: string;
  count: number;
  avgGrade: number;
  topProspect: string;
}

export interface DraftClassProfile {
  year: number;
  overallGrade: ClassGrade;
  overallScore: number;
  topTalent: number;
  depth: number;
  collegeVsPrep: { college: number; prep: number };
  positionalBreakdown: PositionalBreakdown[];
  topPicks: Array<{ name: string; position: string; grade: number }>;
  historicalComp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const GRADE_DISPLAY: Record<ClassGrade, { color: string }> = {
  'A+': { color: '#22c55e' },
  'A':  { color: '#4ade80' },
  'B+': { color: '#3b82f6' },
  'B':  { color: '#60a5fa' },
  'C+': { color: '#f59e0b' },
  'C':  { color: '#fbbf24' },
  'D':  { color: '#ef4444' },
};

function getGrade(score: number): ClassGrade {
  if (score >= 90) return 'A+';
  if (score >= 82) return 'A';
  if (score >= 74) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoDraftClassStrength(): DraftClassProfile[] {
  return [
    {
      year: 2025, overallScore: 88, overallGrade: getGrade(88), topTalent: 92, depth: 84,
      collegeVsPrep: { college: 58, prep: 42 },
      historicalComp: '2018 (Torkelson/Mayer class)',
      positionalBreakdown: [
        { position: 'SS', count: 6, avgGrade: 72, topProspect: 'Jaden Cruz' },
        { position: 'RHP', count: 8, avgGrade: 68, topProspect: 'Blake Harrison' },
        { position: 'OF', count: 5, avgGrade: 65, topProspect: 'Marcus Cole' },
        { position: 'LHP', count: 4, avgGrade: 62, topProspect: 'Tyler Novak' },
        { position: 'C', count: 3, avgGrade: 60, topProspect: 'Ryan Matsuda' },
      ],
      topPicks: [
        { name: 'Jaden Cruz', position: 'SS', grade: 78 },
        { name: 'Blake Harrison', position: 'RHP', grade: 75 },
        { name: 'Marcus Cole', position: 'CF', grade: 72 },
        { name: 'Tyler Novak', position: 'LHP', grade: 70 },
        { name: 'Ryan Matsuda', position: 'C', grade: 68 },
      ],
    },
    {
      year: 2024, overallScore: 76, overallGrade: getGrade(76), topTalent: 80, depth: 72,
      collegeVsPrep: { college: 65, prep: 35 },
      historicalComp: '2016 (solid but not spectacular)',
      positionalBreakdown: [
        { position: 'RHP', count: 7, avgGrade: 65, topProspect: 'Chase Williams' },
        { position: '3B', count: 4, avgGrade: 62, topProspect: 'Diego Martinez' },
        { position: 'OF', count: 6, avgGrade: 60, topProspect: 'Kai Johnson' },
        { position: 'SS', count: 3, avgGrade: 58, topProspect: 'Owen Reeves' },
      ],
      topPicks: [
        { name: 'Chase Williams', position: 'RHP', grade: 72 },
        { name: 'Diego Martinez', position: '3B', grade: 68 },
        { name: 'Kai Johnson', position: 'CF', grade: 66 },
        { name: 'Owen Reeves', position: 'SS', grade: 64 },
      ],
    },
    {
      year: 2023, overallScore: 92, overallGrade: getGrade(92), topTalent: 95, depth: 88,
      collegeVsPrep: { college: 52, prep: 48 },
      historicalComp: '2005 (generational talent at top)',
      positionalBreakdown: [
        { position: 'SS', count: 7, avgGrade: 75, topProspect: 'Travis Benton' },
        { position: 'LHP', count: 5, avgGrade: 70, topProspect: 'Ethan Nakamura' },
        { position: 'OF', count: 8, avgGrade: 68, topProspect: 'Jordan Price' },
        { position: 'C', count: 3, avgGrade: 65, topProspect: 'Max Alvarez' },
        { position: 'RHP', count: 6, avgGrade: 64, topProspect: 'Connor Davis' },
      ],
      topPicks: [
        { name: 'Travis Benton', position: 'SS', grade: 82 },
        { name: 'Ethan Nakamura', position: 'LHP', grade: 78 },
        { name: 'Jordan Price', position: 'RF', grade: 74 },
        { name: 'Max Alvarez', position: 'C', grade: 70 },
        { name: 'Connor Davis', position: 'RHP', grade: 68 },
      ],
    },
    {
      year: 2022, overallScore: 58, overallGrade: getGrade(58), topTalent: 55, depth: 60,
      collegeVsPrep: { college: 72, prep: 28 },
      historicalComp: '2013 (college heavy, limited upside)',
      positionalBreakdown: [
        { position: 'RHP', count: 9, avgGrade: 56, topProspect: 'Sam Kowalski' },
        { position: '1B', count: 4, avgGrade: 52, topProspect: 'Bryce Anderson' },
        { position: 'OF', count: 5, avgGrade: 50, topProspect: 'Luke Torres' },
      ],
      topPicks: [
        { name: 'Sam Kowalski', position: 'RHP', grade: 62 },
        { name: 'Bryce Anderson', position: '1B', grade: 58 },
        { name: 'Luke Torres', position: 'LF', grade: 55 },
      ],
    },
    {
      year: 2021, overallScore: 70, overallGrade: getGrade(70), topTalent: 74, depth: 66,
      collegeVsPrep: { college: 60, prep: 40 },
      historicalComp: '2015 (solid middle class)',
      positionalBreakdown: [
        { position: 'OF', count: 7, avgGrade: 64, topProspect: 'Jaylen Robinson' },
        { position: 'SS', count: 4, avgGrade: 62, topProspect: 'Nate Hernandez' },
        { position: 'RHP', count: 6, avgGrade: 60, topProspect: 'Cole Mitchell' },
        { position: 'LHP', count: 3, avgGrade: 58, topProspect: 'Derek Kim' },
      ],
      topPicks: [
        { name: 'Jaylen Robinson', position: 'CF', grade: 70 },
        { name: 'Nate Hernandez', position: 'SS', grade: 66 },
        { name: 'Cole Mitchell', position: 'RHP', grade: 64 },
        { name: 'Derek Kim', position: 'LHP', grade: 62 },
      ],
    },
  ];
}
