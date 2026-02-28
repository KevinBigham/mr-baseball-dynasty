/**
 * Prospect Graduation Impact Engine — Mr. Baseball Dynasty (Wave 78)
 *
 * Forecasts the impact of top prospects arriving at the MLB level:
 *   - Projects WAR contribution for years 1-3 after promotion
 *   - Analyzes which current roster players they'd replace
 *   - Cost savings analysis (prospect min salary vs veteran salary)
 *   - Readiness scores and ETA timelines
 *   - Surplus value calculations
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ReadinessGrade = 'MLB_READY' | 'NEAR_READY' | 'NEEDS_TIME' | 'RAW';

export const READINESS_DISPLAY: Record<ReadinessGrade, { label: string; color: string; desc: string }> = {
  MLB_READY:  { label: 'MLB Ready',   color: '#22c55e', desc: 'Can contribute immediately' },
  NEAR_READY: { label: 'Near Ready',  color: '#3b82f6', desc: '1-2 months of refinement needed' },
  NEEDS_TIME: { label: 'Needs Time',  color: '#f97316', desc: '6-12 months away' },
  RAW:        { label: 'Raw',         color: '#ef4444', desc: '1-2 years of development' },
};

export interface WARProjection {
  year1: number;
  year2: number;
  year3: number;
  ceilingYear1: number;
  floorYear1: number;
}

export interface ProspectGradCandidate {
  id: number;
  name: string;
  age: number;
  position: string;
  currentLevel: string;      // AAA, AA, etc.
  orgRank: number;           // rank within organization
  overallRank: number;       // league-wide prospect rank
  overall: number;           // current OVR rating
  potential: number;         // ceiling OVR
  readiness: ReadinessGrade;
  readinessScore: number;    // 0-100
  eta: string;               // "April 2026", "Mid-season 2026"
  warProjection: WARProjection;
  keyTools: string[];        // standout scouting tools
  concern: string;           // primary development concern
  minorLeagueStats: string;  // summary stat line
}

export interface RosterImpactEntry {
  prospectId: number;
  prospectName: string;
  prospectPos: string;
  incumbentName: string;
  incumbentPos: string;
  incumbentAge: number;
  incumbentOvr: number;
  incumbentSalary: number;          // in millions
  prospectMinSalary: number;        // in millions (~0.74)
  annualSavings: number;            // in millions
  warUpgrade: number;               // projected WAR difference
  surplusValue: number;             // WAR-based surplus in millions
  recommendation: 'PROMOTE' | 'PLATOON' | 'WAIT' | 'TRADE_VET';
  notes: string;
}

export interface CostSavingsSummary {
  totalVeteranSalary: number;
  totalProspectSalary: number;
  totalAnnualSavings: number;
  threeYearSavings: number;
  reinvestmentCapacity: string;
}

export interface ProspectGradData {
  teamName: string;
  teamAbbr: string;
  season: number;
  prospects: ProspectGradCandidate[];
  rosterImpact: RosterImpactEntry[];
  costSummary: CostSavingsSummary;
  graduationTimeline: { month: string; prospects: string[] }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function calcSurplusValue(projectedWAR: number, salary: number): number {
  const dollarPerWAR = 8.0; // $8M per WAR on open market
  return Math.round((projectedWAR * dollarPerWAR - salary) * 10) / 10;
}

export function getReadinessGrade(score: number): ReadinessGrade {
  if (score >= 80) return 'MLB_READY';
  if (score >= 60) return 'NEAR_READY';
  if (score >= 35) return 'NEEDS_TIME';
  return 'RAW';
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export function generateDemoProspectGradImpact(): ProspectGradData {
  const prospects: ProspectGradCandidate[] = [
    {
      id: 1,
      name: 'Marcus Delgado',
      age: 22,
      position: 'SS',
      currentLevel: 'AAA',
      orgRank: 1,
      overallRank: 8,
      overall: 68,
      potential: 82,
      readiness: 'MLB_READY',
      readinessScore: 92,
      eta: 'April 2026',
      warProjection: { year1: 3.2, year2: 4.5, year3: 5.1, ceilingYear1: 4.8, floorYear1: 1.4 },
      keyTools: ['70 Hit', '65 Power', '60 Arm', '55 Speed'],
      concern: 'Strikeout rate ticked up at AAA (26%)',
      minorLeagueStats: '.298/.371/.512, 24 HR, 18 SB in 128 G (AAA)',
    },
    {
      id: 2,
      name: 'Javier Castillo',
      age: 23,
      position: 'SP',
      currentLevel: 'AAA',
      orgRank: 2,
      overallRank: 14,
      overall: 66,
      potential: 79,
      readiness: 'MLB_READY',
      readinessScore: 86,
      eta: 'April 2026',
      warProjection: { year1: 2.8, year2: 3.6, year3: 4.2, ceilingYear1: 4.0, floorYear1: 1.0 },
      keyTools: ['70 Fastball', '60 Slider', '55 Changeup', '55 Control'],
      concern: 'Third time through the order splits need work',
      minorLeagueStats: '10-4, 2.78 ERA, 168 K in 142 IP (AAA)',
    },
    {
      id: 3,
      name: 'Tyree Washington',
      age: 21,
      position: 'CF',
      currentLevel: 'AA',
      orgRank: 3,
      overallRank: 22,
      overall: 62,
      potential: 84,
      readiness: 'NEAR_READY',
      readinessScore: 68,
      eta: 'Mid-season 2026',
      warProjection: { year1: 1.8, year2: 3.4, year3: 4.8, ceilingYear1: 3.0, floorYear1: 0.2 },
      keyTools: ['80 Speed', '60 Hit', '55 Power', '70 Defense'],
      concern: 'Needs to refine approach vs breaking balls',
      minorLeagueStats: '.282/.358/.468, 18 HR, 42 SB in 122 G (AA)',
    },
    {
      id: 4,
      name: 'Colton Braithwaite',
      age: 23,
      position: 'RP',
      currentLevel: 'AAA',
      orgRank: 6,
      overallRank: 58,
      overall: 63,
      potential: 74,
      readiness: 'MLB_READY',
      readinessScore: 88,
      eta: 'April 2026',
      warProjection: { year1: 1.2, year2: 1.6, year3: 1.8, ceilingYear1: 2.0, floorYear1: 0.4 },
      keyTools: ['75 Slider', '65 Fastball', '50 Control'],
      concern: 'Walk rate elevated in high-leverage spots',
      minorLeagueStats: '2-1, 2.14 ERA, 88 K in 63 IP, 18 SV (AAA)',
    },
    {
      id: 5,
      name: 'Kenji Yamamoto',
      age: 20,
      position: '3B',
      currentLevel: 'AA',
      orgRank: 4,
      overallRank: 31,
      overall: 59,
      potential: 80,
      readiness: 'NEEDS_TIME',
      readinessScore: 44,
      eta: 'September 2026',
      warProjection: { year1: 0.8, year2: 2.2, year3: 3.8, ceilingYear1: 1.5, floorYear1: -0.3 },
      keyTools: ['70 Power', '55 Hit', '50 Defense', '45 Speed'],
      concern: 'Defensive consistency at hot corner; still refining plate discipline',
      minorLeagueStats: '.261/.338/.498, 22 HR, 4 SB in 108 G (AA)',
    },
    {
      id: 6,
      name: 'Elias Montero',
      age: 22,
      position: 'C',
      currentLevel: 'AAA',
      orgRank: 5,
      overallRank: 42,
      overall: 61,
      potential: 76,
      readiness: 'NEAR_READY',
      readinessScore: 72,
      eta: 'June 2026',
      warProjection: { year1: 1.6, year2: 2.4, year3: 3.2, ceilingYear1: 2.8, floorYear1: 0.5 },
      keyTools: ['65 Defense', '60 Arm', '55 Hit', '50 Power'],
      concern: 'Game-calling still developing; framing metrics middling',
      minorLeagueStats: '.272/.346/.424, 12 HR, 2 SB in 98 G (AAA)',
    },
  ];

  const rosterImpact: RosterImpactEntry[] = [
    {
      prospectId: 1,
      prospectName: 'Marcus Delgado',
      prospectPos: 'SS',
      incumbentName: 'Derek Hartley',
      incumbentPos: 'SS',
      incumbentAge: 31,
      incumbentOvr: 72,
      incumbentSalary: 14.5,
      prospectMinSalary: 0.74,
      annualSavings: 13.76,
      warUpgrade: 0.6,
      surplusValue: calcSurplusValue(3.2, 0.74),
      recommendation: 'PROMOTE',
      notes: 'Delgado projects better offensively; Hartley declining defensively. Trade Hartley for value now.',
    },
    {
      prospectId: 2,
      prospectName: 'Javier Castillo',
      prospectPos: 'SP',
      incumbentName: 'Greg Thornton',
      incumbentPos: 'SP',
      incumbentAge: 33,
      incumbentOvr: 70,
      incumbentSalary: 18.0,
      prospectMinSalary: 0.74,
      annualSavings: 17.26,
      warUpgrade: 0.8,
      surplusValue: calcSurplusValue(2.8, 0.74),
      recommendation: 'PROMOTE',
      notes: 'Castillo has frontline stuff. Thornton\'s velocity declining; expiring contract makes this seamless.',
    },
    {
      prospectId: 3,
      prospectName: 'Tyree Washington',
      prospectPos: 'CF',
      incumbentName: 'Brandon Oakes',
      incumbentPos: 'CF',
      incumbentAge: 29,
      incumbentOvr: 75,
      incumbentSalary: 11.2,
      prospectMinSalary: 0.74,
      annualSavings: 10.46,
      warUpgrade: -0.6,
      surplusValue: calcSurplusValue(1.8, 0.74),
      recommendation: 'WAIT',
      notes: 'Oakes is in his prime. Let Washington finish seasoning at AAA; reassess at trade deadline.',
    },
    {
      prospectId: 4,
      prospectName: 'Colton Braithwaite',
      prospectPos: 'RP',
      incumbentName: 'Hector Macias',
      incumbentPos: 'RP',
      incumbentAge: 34,
      incumbentOvr: 66,
      incumbentSalary: 6.5,
      prospectMinSalary: 0.74,
      annualSavings: 5.76,
      warUpgrade: 0.4,
      surplusValue: calcSurplusValue(1.2, 0.74),
      recommendation: 'PROMOTE',
      notes: 'Braithwaite has premium late-inning stuff. Macias can be non-tendered to save payroll.',
    },
    {
      prospectId: 6,
      prospectName: 'Elias Montero',
      prospectPos: 'C',
      incumbentName: 'Travis Keller',
      incumbentPos: 'C',
      incumbentAge: 30,
      incumbentOvr: 69,
      incumbentSalary: 8.0,
      prospectMinSalary: 0.74,
      annualSavings: 7.26,
      warUpgrade: 0.0,
      surplusValue: calcSurplusValue(1.6, 0.74),
      recommendation: 'PLATOON',
      notes: 'Start Montero vs RHP to develop bat; Keller vs LHP for veteran experience. Full handoff by 2027.',
    },
    {
      prospectId: 5,
      prospectName: 'Kenji Yamamoto',
      prospectPos: '3B',
      incumbentName: 'Ryan Castellanos',
      incumbentPos: '3B',
      incumbentAge: 28,
      incumbentOvr: 78,
      incumbentSalary: 16.0,
      prospectMinSalary: 0.74,
      annualSavings: 15.26,
      warUpgrade: -2.0,
      surplusValue: calcSurplusValue(0.8, 0.74),
      recommendation: 'WAIT',
      notes: 'Castellanos is a franchise cornerstone in his prime. Yamamoto needs another full year of development.',
    },
  ];

  const totalVetSalary = rosterImpact.reduce((sum, r) => sum + r.incumbentSalary, 0);
  const totalProspectSalary = rosterImpact.length * 0.74;
  const totalSavings = totalVetSalary - totalProspectSalary;

  return {
    teamName: 'San Francisco Giants',
    teamAbbr: 'SF',
    season: 2026,
    prospects,
    rosterImpact,
    costSummary: {
      totalVeteranSalary: Math.round(totalVetSalary * 10) / 10,
      totalProspectSalary: Math.round(totalProspectSalary * 10) / 10,
      totalAnnualSavings: Math.round(totalSavings * 10) / 10,
      threeYearSavings: Math.round(totalSavings * 2.6 * 10) / 10, // factor in arb raises
      reinvestmentCapacity: 'Can reallocate ~$70M over 3 years toward free agent pitching or extension for Castellanos',
    },
    graduationTimeline: [
      { month: 'April 2026', prospects: ['Marcus Delgado', 'Javier Castillo', 'Colton Braithwaite'] },
      { month: 'June 2026', prospects: ['Elias Montero'] },
      { month: 'Mid-season 2026', prospects: ['Tyree Washington'] },
      { month: 'September 2026', prospects: ['Kenji Yamamoto'] },
    ],
  };
}
