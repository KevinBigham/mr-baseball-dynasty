/**
 * salaryDumpAnalyzer.ts – Salary dump trade analysis
 *
 * Evaluates potential salary dump trades, identifying overpaid players,
 * calculating prospect cost to move contracts, and finding willing partners.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DumpDifficulty = 'easy' | 'moderate' | 'hard' | 'very_hard' | 'untradeable';

export interface SalaryDumpCandidate {
  id: string;
  name: string;
  team: string;
  pos: string;
  age: number;
  yearsRemaining: number;
  totalRemaining: number;     // $M total
  aav: number;                // $M per year
  currentWAR: number;
  projectedWAR: number;
  surplusValue: number;       // $M (negative = overpay)
  dumpDifficulty: DumpDifficulty;
  prospectCost: string;       // description of what you'd need to attach
  potentialPartners: string[];
  ntcStatus: 'none' | 'partial' | 'full';
  notes: string;
}

export const DIFFICULTY_DISPLAY: Record<DumpDifficulty, { label: string; color: string }> = {
  easy: { label: 'EASY', color: '#22c55e' },
  moderate: { label: 'MODERATE', color: '#a3e635' },
  hard: { label: 'HARD', color: '#f59e0b' },
  very_hard: { label: 'VERY HARD', color: '#f97316' },
  untradeable: { label: 'UNTRADEABLE', color: '#ef4444' },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface SalaryDumpSummary {
  totalCandidates: number;
  totalDeadMoney: number;
  easiestDump: string;
  biggestAlbatross: string;
  avgSurplusDeficit: number;
}

export function getSalaryDumpSummary(candidates: SalaryDumpCandidate[]): SalaryDumpSummary {
  const totalDead = candidates.reduce((s, c) => s + Math.max(0, -c.surplusValue), 0);
  const easiest = candidates.filter(c => c.dumpDifficulty === 'easy')[0] ?? candidates[0];
  const biggest = candidates.reduce((a, b) => a.totalRemaining > b.totalRemaining ? a : b);
  const avgDeficit = candidates.reduce((s, c) => s + c.surplusValue, 0) / candidates.length;

  return {
    totalCandidates: candidates.length,
    totalDeadMoney: Math.round(totalDead),
    easiestDump: easiest.name,
    biggestAlbatross: biggest.name,
    avgSurplusDeficit: Math.round(avgDeficit * 10) / 10,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoSalaryDumps(): SalaryDumpCandidate[] {
  const data: Omit<SalaryDumpCandidate, 'id'>[] = [
    {
      name: 'Brandon Vickers', team: 'LAA', pos: '1B', age: 33,
      yearsRemaining: 4, totalRemaining: 100, aav: 25, currentWAR: 1.2, projectedWAR: 0.8,
      surplusValue: -62, dumpDifficulty: 'very_hard', prospectCost: 'Top-10 org prospect + mid-level arm',
      potentialPartners: ['OAK', 'PIT', 'KC', 'MIA'],
      ntcStatus: 'partial', notes: 'Declining power numbers and injury history. Partial NTC complicates matters. Would need significant prospect sweetener.',
    },
    {
      name: 'Derek Washington', team: 'NYM', pos: 'OF', age: 31,
      yearsRemaining: 3, totalRemaining: 66, aav: 22, currentWAR: 2.5, projectedWAR: 2.0,
      surplusValue: -18, dumpDifficulty: 'moderate', prospectCost: 'One lottery ticket prospect',
      potentialPartners: ['CIN', 'COL', 'DET', 'CWS'],
      ntcStatus: 'none', notes: 'Still productive but overpaid. No NTC makes this moveable with a small sweetener.',
    },
    {
      name: 'Ryan Mitchell', team: 'BOS', pos: 'SP', age: 34,
      yearsRemaining: 2, totalRemaining: 48, aav: 24, currentWAR: 1.8, projectedWAR: 1.5,
      surplusValue: -16, dumpDifficulty: 'moderate', prospectCost: 'Cash considerations or minor prospect',
      potentialPartners: ['TEX', 'SEA', 'TOR', 'MIN'],
      ntcStatus: 'none', notes: 'Veteran SP still eats innings. Short remaining term makes this palatable for a contender needing rotation depth.',
    },
    {
      name: 'Marcus Thompson', team: 'CWS', pos: 'DH', age: 35,
      yearsRemaining: 3, totalRemaining: 57, aav: 19, currentWAR: 0.5, projectedWAR: 0.2,
      surplusValue: -45, dumpDifficulty: 'very_hard', prospectCost: 'Two mid-level prospects minimum',
      potentialPartners: ['OAK', 'MIA'],
      ntcStatus: 'full', notes: 'Full NTC and declining production. DH-only limits trade partners. May need to eat significant salary.',
    },
    {
      name: 'Chris Delgado', team: 'PHI', pos: 'SS', age: 30,
      yearsRemaining: 5, totalRemaining: 140, aav: 28, currentWAR: 3.5, projectedWAR: 2.8,
      surplusValue: -30, dumpDifficulty: 'hard', prospectCost: 'Would need to eat $30M+ or attach prospect',
      potentialPartners: ['SF', 'CHC', 'SEA'],
      ntcStatus: 'partial', notes: 'Still a quality player but mega-contract makes surplus negative. Would need to eat money to move.',
    },
    {
      name: 'Jason Park', team: 'STL', pos: 'RP', age: 32,
      yearsRemaining: 2, totalRemaining: 26, aav: 13, currentWAR: 0.8, projectedWAR: 0.5,
      surplusValue: -10, dumpDifficulty: 'easy', prospectCost: 'No prospect cost — just eat some salary',
      potentialPartners: ['NYY', 'LAD', 'HOU', 'ATL', 'SD'],
      ntcStatus: 'none', notes: 'Overpaid reliever but short commitment. Multiple contenders would take him if STL eats $5M.',
    },
    {
      name: 'Tyler Knox', team: 'TEX', pos: '3B', age: 29,
      yearsRemaining: 6, totalRemaining: 162, aav: 27, currentWAR: 4.2, projectedWAR: 3.5,
      surplusValue: -8, dumpDifficulty: 'easy', prospectCost: 'None — contract is close to fair value',
      potentialPartners: ['BOS', 'SF', 'CHC', 'NYM', 'LAD'],
      ntcStatus: 'none', notes: 'Not really a dump — productive player on a slightly above-market deal. Many teams would want him.',
    },
    {
      name: 'Anthony Ruiz', team: 'DET', pos: 'OF', age: 34,
      yearsRemaining: 3, totalRemaining: 42, aav: 14, currentWAR: 0.2, projectedWAR: 0.0,
      surplusValue: -38, dumpDifficulty: 'untradeable', prospectCost: 'No team willing to take this on',
      potentialPartners: [],
      ntcStatus: 'full', notes: 'Full NTC, negative WAR, and 3 years left. Would need to be released or bought out. True albatross.',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `sd-${i}` }));
}
