/**
 * frontOfficeBudget.ts – Front Office Budget Engine
 *
 * Bloomberg-terminal-style front office departmental budget tracking.
 * Allocates budget across scouting, analytics, player development,
 * medical, and operations departments with efficiency metrics.
 * All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DeptEfficiency = 'excellent' | 'good' | 'average' | 'below_avg' | 'poor';

export interface BudgetDepartment {
  name: string;
  budget: number;          // $M
  spent: number;           // $M
  remaining: number;       // $M
  headcount: number;
  avgSalary: number;       // $K
  efficiency: DeptEfficiency;
  efficiencyScore: number; // 0-100
  keyMetric: string;       // e.g. "3 draft picks signed"
  yoyChange: number;       // % budget change
  notes: string;
}

export interface FrontOfficeBudgetData {
  teamName: string;
  totalBudget: number;     // $M
  totalSpent: number;      // $M
  totalRemaining: number;  // $M
  fiscalYear: number;
  departments: BudgetDepartment[];
  overallEfficiency: DeptEfficiency;
  overallScore: number;
  topPerformer: string;
  underperformer: string;
  notes: string;
}

// ── Display Map ────────────────────────────────────────────────────────────

export const EFFICIENCY_DISPLAY: Record<DeptEfficiency, { label: string; color: string }> = {
  excellent:  { label: 'Excellent',  color: '#22c55e' },
  good:       { label: 'Good',       color: '#4ade80' },
  average:    { label: 'Average',    color: '#f59e0b' },
  below_avg:  { label: 'Below Avg',  color: '#f97316' },
  poor:       { label: 'Poor',       color: '#ef4444' },
};

function effFromScore(s: number): DeptEfficiency {
  if (s >= 85) return 'excellent';
  if (s >= 70) return 'good';
  if (s >= 50) return 'average';
  if (s >= 35) return 'below_avg';
  return 'poor';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface FrontOfficeBudgetSummary {
  totalBudget: string;
  totalSpent: string;
  burnRate: string;
  overallGrade: string;
  topDept: string;
  worstDept: string;
}

export function getFrontOfficeBudgetSummary(data: FrontOfficeBudgetData): FrontOfficeBudgetSummary {
  const burnRate = ((data.totalSpent / data.totalBudget) * 100).toFixed(1);
  return {
    totalBudget: `$${data.totalBudget.toFixed(1)}M`,
    totalSpent: `$${data.totalSpent.toFixed(1)}M`,
    burnRate: `${burnRate}%`,
    overallGrade: EFFICIENCY_DISPLAY[data.overallEfficiency].label,
    topDept: data.topPerformer,
    worstDept: data.underperformer,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoFrontOfficeBudget(): FrontOfficeBudgetData {
  const departments: BudgetDepartment[] = [
    {
      name: 'Amateur Scouting',
      budget: 8.2, spent: 6.8, remaining: 1.4, headcount: 22, avgSalary: 85,
      efficiency: 'excellent', efficiencyScore: 92,
      keyMetric: '4 of 5 draft picks signed above slot',
      yoyChange: 12.5,
      notes: 'Elite draft class. Top scout identified 3 breakout prospects in the 4th-10th rounds.',
    },
    {
      name: 'Pro Scouting',
      budget: 5.4, spent: 4.2, remaining: 1.2, headcount: 14, avgSalary: 95,
      efficiency: 'good', efficiencyScore: 74,
      keyMetric: '2 trade deadline steals identified',
      yoyChange: 5.2,
      notes: 'Good trade deadline intel. Identified value targets before market heated up.',
    },
    {
      name: 'International Scouting',
      budget: 6.8, spent: 5.4, remaining: 1.4, headcount: 18, avgSalary: 72,
      efficiency: 'good', efficiencyScore: 78,
      keyMetric: '12 IFA signings, 3 bonus pool worthy',
      yoyChange: 8.4,
      notes: 'Strong DR/Venezuela pipeline. Expanded coverage to Taiwan and Korea.',
    },
    {
      name: 'Analytics',
      budget: 4.2, spent: 3.8, remaining: 0.4, headcount: 16, avgSalary: 120,
      efficiency: 'excellent', efficiencyScore: 88,
      keyMetric: 'WAR model accuracy: 92%',
      yoyChange: 18.2,
      notes: 'New pitching model identified 3 breakout arms. Defensive metrics overhaul completed.',
    },
    {
      name: 'Player Development',
      budget: 12.4, spent: 10.8, remaining: 1.6, headcount: 42, avgSalary: 68,
      efficiency: 'average', efficiencyScore: 56,
      keyMetric: '6 prospects promoted on schedule',
      yoyChange: -2.4,
      notes: 'Mixed results. Hitting development program underperformed. Pitching lab showing returns.',
    },
    {
      name: 'Medical & Performance',
      budget: 7.8, spent: 7.2, remaining: 0.6, headcount: 24, avgSalary: 98,
      efficiency: 'below_avg', efficiencyScore: 42,
      keyMetric: 'IL days: 1,240 (league avg: 980)',
      yoyChange: 14.6,
      notes: 'Injury prevention program needs overhaul. High IL days despite increased spending.',
    },
    {
      name: 'Operations',
      budget: 3.8, spent: 3.2, remaining: 0.6, headcount: 28, avgSalary: 58,
      efficiency: 'good', efficiencyScore: 72,
      keyMetric: 'Facility upgrades 85% complete',
      yoyChange: -4.8,
      notes: 'Spring training complex renovation on track. Reduced travel costs by 8%.',
    },
    {
      name: 'Video & Technology',
      budget: 2.6, spent: 2.4, remaining: 0.2, headcount: 10, avgSalary: 92,
      efficiency: 'excellent', efficiencyScore: 86,
      keyMetric: 'New pitch tracking system deployed',
      yoyChange: 22.4,
      notes: 'Deployed TrackMan upgrades at all 6 affiliates. Real-time data pipeline operational.',
    },
  ];

  const totalBudget = +(departments.reduce((s, d) => s + d.budget, 0).toFixed(1));
  const totalSpent = +(departments.reduce((s, d) => s + d.spent, 0).toFixed(1));
  const avgScore = Math.round(departments.reduce((s, d) => s + d.efficiencyScore, 0) / departments.length);

  const sorted = [...departments].sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  return {
    teamName: 'San Francisco Giants',
    totalBudget,
    totalSpent,
    totalRemaining: +(totalBudget - totalSpent).toFixed(1),
    fiscalYear: 2025,
    departments,
    overallEfficiency: effFromScore(avgScore),
    overallScore: avgScore,
    topPerformer: sorted[0].name,
    underperformer: sorted[sorted.length - 1].name,
    notes: `FY2025 budget utilization at ${((totalSpent / totalBudget) * 100).toFixed(0)}%. Scouting and analytics departments leading efficiency metrics. Medical needs urgent attention — highest IL days in division despite top-5 spending.`,
  };
}
