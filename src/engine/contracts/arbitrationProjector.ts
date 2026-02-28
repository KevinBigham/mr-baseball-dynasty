/**
 * Arbitration Projector
 *
 * Projects arbitration salary outcomes for eligible players based
 * on performance, service time, comparable players, and historical
 * filing trends. Includes range estimates and deadline tracking.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ArbYear = 'arb1' | 'arb2' | 'arb3' | 'arb4';

export const ARB_YEAR_DISPLAY: Record<ArbYear, { label: string; color: string }> = {
  arb1: { label: 'Arb 1', color: '#3b82f6' },
  arb2: { label: 'Arb 2', color: '#f59e0b' },
  arb3: { label: 'Arb 3', color: '#f97316' },
  arb4: { label: 'Arb 4', color: '#ef4444' },
};

export interface CompPlayer {
  name: string;
  salary: number;          // $M
  stats: string;           // summary stat line
}

export interface ArbProjection {
  playerId: number;
  name: string;
  position: string;
  age: number;
  currentSalary: number;   // $M
  projectedSalary: number; // $M
  range: [number, number]; // [low, high] $M
  arbYear: ArbYear;
  serviceTime: number;     // years
  keyStats: { label: string; value: string }[];
  comparables: CompPlayer[];
  filingDeadline: string;  // ISO date
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getProjectedRaisePct(proj: ArbProjection): number {
  if (proj.currentSalary <= 0) return 0;
  return Math.round(((proj.projectedSalary - proj.currentSalary) / proj.currentSalary) * 100);
}

export function getDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getTotalProjectedCost(projections: ArbProjection[]): number {
  return Math.round(projections.reduce((s, p) => s + p.projectedSalary, 0) * 10) / 10;
}

export function sortByProjectedSalary(projections: ArbProjection[], desc = true): ArbProjection[] {
  return [...projections].sort((a, b) => desc ? b.projectedSalary - a.projectedSalary : a.projectedSalary - b.projectedSalary);
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoArbProjections(): ArbProjection[] {
  return [
    {
      playerId: 200, name: 'Tanner Houck', position: 'SP', age: 28,
      currentSalary: 0.75, projectedSalary: 5.8, range: [4.9, 6.7],
      arbYear: 'arb1', serviceTime: 3.085,
      keyStats: [
        { label: 'ERA', value: '3.20' },
        { label: 'IP', value: '170' },
        { label: 'K', value: '155' },
        { label: 'WHIP', value: '1.12' },
        { label: 'WAR', value: '3.2' },
      ],
      comparables: [
        { name: 'Logan Gilbert', salary: 5.2, stats: '3.15 ERA, 180 IP, 3.0 WAR' },
        { name: 'Joe Musgrove', salary: 4.8, stats: '3.40 ERA, 165 IP, 2.8 WAR' },
        { name: 'Pablo Lopez', salary: 5.6, stats: '3.05 ERA, 175 IP, 3.4 WAR' },
      ],
      filingDeadline: '2026-01-15',
    },
    {
      playerId: 201, name: 'Bryan Reynolds', position: 'CF', age: 29,
      currentSalary: 8.5, projectedSalary: 12.2, range: [10.5, 14.0],
      arbYear: 'arb3', serviceTime: 5.120,
      keyStats: [
        { label: 'AVG', value: '.282' },
        { label: 'OBP', value: '.362' },
        { label: 'SLG', value: '.485' },
        { label: 'HR', value: '24' },
        { label: 'WAR', value: '4.1' },
      ],
      comparables: [
        { name: 'Kyle Tucker', salary: 12.0, stats: '.285 AVG, 28 HR, 4.5 WAR' },
        { name: 'Teoscar Hernandez', salary: 10.5, stats: '.270 AVG, 25 HR, 3.5 WAR' },
      ],
      filingDeadline: '2026-01-15',
    },
    {
      playerId: 202, name: 'Andres Gimenez', position: '2B', age: 25,
      currentSalary: 0.72, projectedSalary: 7.8, range: [6.5, 9.0],
      arbYear: 'arb1', serviceTime: 3.050,
      keyStats: [
        { label: 'AVG', value: '.291' },
        { label: 'OBP', value: '.345' },
        { label: 'SLG', value: '.472' },
        { label: 'HR', value: '18' },
        { label: 'WAR', value: '5.2' },
      ],
      comparables: [
        { name: 'Ozzie Albies', salary: 7.0, stats: '.275 AVG, 20 HR, 4.5 WAR' },
        { name: 'Marcus Semien', salary: 5.9, stats: '.260 AVG, 22 HR, 3.8 WAR' },
        { name: 'Gleyber Torres', salary: 6.3, stats: '.268 AVG, 18 HR, 3.2 WAR' },
      ],
      filingDeadline: '2026-01-15',
    },
    {
      playerId: 203, name: 'Shane Bieber', position: 'SP', age: 29,
      currentSalary: 10.2, projectedSalary: 8.5, range: [7.0, 10.0],
      arbYear: 'arb3', serviceTime: 5.180,
      keyStats: [
        { label: 'ERA', value: '4.10' },
        { label: 'IP', value: '120' },
        { label: 'K', value: '110' },
        { label: 'WHIP', value: '1.25' },
        { label: 'WAR', value: '1.5' },
      ],
      comparables: [
        { name: 'Nathan Eovaldi', salary: 9.0, stats: '3.85 ERA, 130 IP, 1.8 WAR' },
      ],
      filingDeadline: '2026-01-15',
    },
    {
      playerId: 204, name: 'Nico Hoerner', position: 'SS', age: 27,
      currentSalary: 3.4, projectedSalary: 6.2, range: [5.2, 7.2],
      arbYear: 'arb2', serviceTime: 4.075,
      keyStats: [
        { label: 'AVG', value: '.275' },
        { label: 'OBP', value: '.332' },
        { label: 'SLG', value: '.382' },
        { label: 'DRS', value: '+8' },
        { label: 'WAR', value: '2.5' },
      ],
      comparables: [
        { name: 'Nick Ahmed', salary: 5.8, stats: '.250 AVG, +12 DRS, 2.2 WAR' },
        { name: 'Isiah Kiner-Falefa', salary: 4.7, stats: '.265 AVG, +6 DRS, 2.0 WAR' },
      ],
      filingDeadline: '2026-01-15',
    },
    {
      playerId: 205, name: 'Tyler Glasnow', position: 'SP', age: 30,
      currentSalary: 5.1, projectedSalary: 10.5, range: [9.0, 12.5],
      arbYear: 'arb4', serviceTime: 6.020,
      keyStats: [
        { label: 'ERA', value: '2.95' },
        { label: 'IP', value: '145' },
        { label: 'K', value: '190' },
        { label: 'WHIP', value: '1.05' },
        { label: 'WAR', value: '3.8' },
      ],
      comparables: [
        { name: 'Kevin Gausman', salary: 11.0, stats: '2.80 ERA, 160 IP, 4.0 WAR' },
        { name: 'Aaron Nola', salary: 10.2, stats: '3.10 ERA, 185 IP, 3.5 WAR' },
      ],
      filingDeadline: '2026-02-01',
    },
    {
      playerId: 206, name: 'Luis Robert Jr.', position: 'CF', age: 26,
      currentSalary: 3.2, projectedSalary: 8.0, range: [6.8, 9.5],
      arbYear: 'arb2', serviceTime: 4.100,
      keyStats: [
        { label: 'AVG', value: '.265' },
        { label: 'OBP', value: '.315' },
        { label: 'SLG', value: '.510' },
        { label: 'HR', value: '28' },
        { label: 'WAR', value: '3.5' },
      ],
      comparables: [
        { name: 'Byron Buxton', salary: 7.5, stats: '.250 AVG, 30 HR, 3.2 WAR' },
        { name: 'Michael Harris II', salary: 7.2, stats: '.275 AVG, 18 HR, 4.0 WAR' },
      ],
      filingDeadline: '2026-02-01',
    },
  ];
}
