/**
 * Prospect ETA Tracker
 *
 * Estimates when prospects will reach the majors with confidence
 * intervals, development milestones, tool highlights, and
 * readiness percentages across all organizational levels.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ETAConfidence = 'high' | 'medium' | 'low';

export interface DevelopmentMilestone {
  milestone: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface ProspectETAProfile {
  prospectId: number;
  name: string;
  age: number;
  position: string;
  currentLevel: string;
  eta: number;                    // projected MLB arrival year
  etaRange: [number, number];     // [earliest, latest]
  confidence: ETAConfidence;
  readyPct: number;               // 0-100 MLB readiness
  milestones: DevelopmentMilestone[];
  topTool: string;
  biggestConcern: string;
}

export const CONFIDENCE_DISPLAY: Record<ETAConfidence, { label: string; color: string }> = {
  high:   { label: 'HIGH',   color: '#22c55e' },
  medium: { label: 'MED',    color: '#f59e0b' },
  low:    { label: 'LOW',    color: '#ef4444' },
};

export const LEVEL_ORDER: Record<string, number> = {
  'MLB': 7,
  'AAA': 6,
  'AA': 5,
  'A+': 4,
  'A': 3,
  'Rk': 2,
  'DSL': 1,
  'Intl': 0,
};

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getReadinessColor(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  if (pct >= 20) return '#f97316';
  return '#ef4444';
}

export function getMilestoneProgress(milestones: DevelopmentMilestone[]): number {
  if (milestones.length === 0) return 0;
  const achieved = milestones.filter(m => m.achieved).length;
  return Math.round((achieved / milestones.length) * 100);
}

// ─── Demo data ──────────────────────────────────────────────────────────────

interface ProspectSeed {
  name: string;
  age: number;
  pos: string;
  level: string;
  eta: number;
  range: [number, number];
  confidence: ETAConfidence;
  ready: number;
  topTool: string;
  concern: string;
  milestones: Array<{ ms: string; done: boolean; date?: string }>;
}

const PROSPECTS: ProspectSeed[] = [
  {
    name: 'Jackson Holliday', age: 21, pos: 'SS', level: 'AAA',
    eta: 2026, range: [2026, 2026], confidence: 'high', ready: 92,
    topTool: 'Hit Tool (70)', concern: 'None significant',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2023-04' },
      { ms: 'Promoted to AA', done: true, date: '2023-07' },
      { ms: 'Promoted to AAA', done: true, date: '2024-05' },
      { ms: '20+ HR season', done: true, date: '2024-08' },
      { ms: '.300+ AVG at AAA', done: true, date: '2025-06' },
      { ms: 'MLB debut', done: true, date: '2024-04' },
    ],
  },
  {
    name: 'Dylan Crews', age: 22, pos: 'CF', level: 'AAA',
    eta: 2026, range: [2026, 2027], confidence: 'high', ready: 82,
    topTool: 'Hit Tool (65)', concern: 'Power development',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2024-04' },
      { ms: 'Promoted to AA', done: true, date: '2024-07' },
      { ms: 'Promoted to AAA', done: true, date: '2025-05' },
      { ms: '15+ HR season', done: true, date: '2025-08' },
      { ms: '.280+ AVG at AAA', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Coby Mayo', age: 22, pos: '3B', level: 'AAA',
    eta: 2026, range: [2026, 2027], confidence: 'medium', ready: 74,
    topTool: 'Raw Power (70)', concern: 'Strikeout rate (28%)',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2023-04' },
      { ms: 'Promoted to AA', done: true, date: '2023-08' },
      { ms: 'Promoted to AAA', done: true, date: '2024-06' },
      { ms: '25+ HR season', done: true, date: '2024-09' },
      { ms: 'K% below 25%', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Chase Burns', age: 22, pos: 'RHP', level: 'AA',
    eta: 2027, range: [2026, 2028], confidence: 'medium', ready: 55,
    topTool: 'Fastball (70)', concern: 'Third pitch development',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2024-04' },
      { ms: 'Promoted to A+', done: true, date: '2024-07' },
      { ms: 'Promoted to AA', done: true, date: '2025-04' },
      { ms: '100+ IP season', done: false },
      { ms: 'Develop changeup to avg', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Tink Hence', age: 21, pos: 'RHP', level: 'A+',
    eta: 2027, range: [2027, 2029], confidence: 'low', ready: 38,
    topTool: 'Curveball (60)', concern: 'Health / innings limit',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2024-04' },
      { ms: 'Promoted to A+', done: true, date: '2025-04' },
      { ms: '80+ IP season', done: false },
      { ms: 'Stay healthy full season', done: false },
      { ms: 'Promoted to AA', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Thayron Liranzo', age: 19, pos: 'C', level: 'A',
    eta: 2028, range: [2027, 2029], confidence: 'medium', ready: 28,
    topTool: 'Raw Power (65)', concern: 'Defensive refinement',
    milestones: [
      { ms: 'First pro season', done: true, date: '2023-06' },
      { ms: 'Full-season A-ball', done: true, date: '2025-04' },
      { ms: '15+ HR season', done: false },
      { ms: 'Framing metrics above avg', done: false },
      { ms: 'Promoted to A+', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Adrian Santana', age: 18, pos: 'SS', level: 'DSL',
    eta: 2029, range: [2028, 2031], confidence: 'low', ready: 12,
    topTool: 'Speed (60)', concern: 'Raw / years away',
    milestones: [
      { ms: 'Sign professionally', done: true, date: '2024-01' },
      { ms: 'DSL season', done: true, date: '2025-06' },
      { ms: 'Stateside assignment', done: false },
      { ms: 'Full-season A-ball', done: false },
      { ms: 'Promoted to A+', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Braden Montgomery', age: 22, pos: 'OF', level: 'A+',
    eta: 2027, range: [2027, 2028], confidence: 'medium', ready: 45,
    topTool: 'Power (60)', concern: 'Contact rate / swing decisions',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2025-04' },
      { ms: 'Promoted to A+', done: true, date: '2025-07' },
      { ms: '15+ HR season', done: true, date: '2025-08' },
      { ms: 'K% below 25%', done: false },
      { ms: 'Promoted to AA', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Roman Anthony', age: 20, pos: 'OF', level: 'AA',
    eta: 2026, range: [2026, 2027], confidence: 'high', ready: 78,
    topTool: 'Hit Tool (65)', concern: 'CF viability long-term',
    milestones: [
      { ms: 'Full-season A-ball', done: true, date: '2023-04' },
      { ms: 'Promoted to A+', done: true, date: '2023-07' },
      { ms: 'Promoted to AA', done: true, date: '2024-04' },
      { ms: '20+ HR season', done: true, date: '2025-08' },
      { ms: 'Promoted to AAA', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
  {
    name: 'Ethan Salas', age: 19, pos: 'C', level: 'A+',
    eta: 2028, range: [2027, 2029], confidence: 'medium', ready: 35,
    topTool: 'Hit Tool (60)', concern: 'Physical maturation',
    milestones: [
      { ms: 'First pro season', done: true, date: '2023-06' },
      { ms: 'Full-season A-ball', done: true, date: '2024-04' },
      { ms: 'Promoted to A+', done: true, date: '2025-04' },
      { ms: '10+ HR season', done: false },
      { ms: 'Promoted to AA', done: false },
      { ms: 'MLB debut', done: false },
    ],
  },
];

export function generateDemoProspectETA(): ProspectETAProfile[] {
  return PROSPECTS.map((p, i) => ({
    prospectId: i,
    name: p.name,
    age: p.age,
    position: p.pos,
    currentLevel: p.level,
    eta: p.eta,
    etaRange: p.range,
    confidence: p.confidence,
    readyPct: p.ready,
    milestones: p.milestones.map(m => ({
      milestone: m.ms,
      achieved: m.done,
      achievedDate: m.date,
    })),
    topTool: p.topTool,
    biggestConcern: p.concern,
  }));
}
