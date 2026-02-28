/**
 * rosterConstructionScore.ts – Roster construction grade model
 *
 * Evaluates roster balance across multiple dimensions: positional depth,
 * age distribution, salary efficiency, prospect pipeline integration,
 * and win-now vs rebuild alignment.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConstructionGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface DimensionScore {
  dimension: string;
  score: number;       // 0-100
  grade: ConstructionGrade;
  description: string;
}

export interface RosterConstructionTeam {
  id: string;
  teamName: string;
  abbr: string;
  overallScore: number;
  overallGrade: ConstructionGrade;
  mode: 'contender' | 'competitive' | 'retooling' | 'rebuilding';
  dimensions: DimensionScore[];
  strengths: string[];
  weaknesses: string[];
  projectedWins: number;
  coreAge: number;      // avg age of core players
  payrollEfficiency: number; // WAR per $M
  pipelineScore: number;    // 0-100
  notes: string;
}

export const GRADE_COLOR: Record<ConstructionGrade, string> = {
  'A+': '#22c55e', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#a3e635', 'B': '#facc15', 'B-': '#fbbf24',
  'C+': '#f59e0b', 'C': '#f97316', 'C-': '#f97316',
  'D': '#ef4444', 'F': '#dc2626',
};

export const MODE_DISPLAY: Record<string, { label: string; color: string }> = {
  contender: { label: 'CONTENDER', color: '#22c55e' },
  competitive: { label: 'COMPETITIVE', color: '#facc15' },
  retooling: { label: 'RETOOLING', color: '#f97316' },
  rebuilding: { label: 'REBUILDING', color: '#ef4444' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreToGrade(s: number): ConstructionGrade {
  if (s >= 97) return 'A+';
  if (s >= 93) return 'A';
  if (s >= 90) return 'A-';
  if (s >= 87) return 'B+';
  if (s >= 83) return 'B';
  if (s >= 80) return 'B-';
  if (s >= 77) return 'C+';
  if (s >= 73) return 'C';
  if (s >= 70) return 'C-';
  if (s >= 60) return 'D';
  return 'F';
}

export function gradeColor(g: ConstructionGrade): string {
  return GRADE_COLOR[g];
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface RosterConstructionSummary {
  totalTeams: number;
  avgScore: number;
  bestTeam: string;
  worstTeam: string;
  contenderCount: number;
  rebuildingCount: number;
}

export function getRosterConstructionSummary(teams: RosterConstructionTeam[]): RosterConstructionSummary {
  const avg = Math.round(teams.reduce((s, t) => s + t.overallScore, 0) / teams.length);
  const best = teams.reduce((a, b) => a.overallScore > b.overallScore ? a : b);
  const worst = teams.reduce((a, b) => a.overallScore < b.overallScore ? a : b);

  return {
    totalTeams: teams.length,
    avgScore: avg,
    bestTeam: best.teamName,
    worstTeam: worst.teamName,
    contenderCount: teams.filter(t => t.mode === 'contender').length,
    rebuildingCount: teams.filter(t => t.mode === 'rebuilding').length,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoRosterConstruction(): RosterConstructionTeam[] {
  const teams: Array<Omit<RosterConstructionTeam, 'id' | 'overallGrade'>> = [
    {
      teamName: 'Los Angeles Dodgers', abbr: 'LAD', overallScore: 96, mode: 'contender',
      dimensions: [
        { dimension: 'Positional Depth', score: 95, grade: 'A', description: 'Deep at every position with quality backups' },
        { dimension: 'Age Balance', score: 92, grade: 'A-', description: 'Core in prime years with young talent rising' },
        { dimension: 'Salary Efficiency', score: 88, grade: 'B+', description: 'High payroll but strong WAR per dollar' },
        { dimension: 'Pipeline Integration', score: 98, grade: 'A+', description: 'Seamless prospect-to-MLB pipeline' },
        { dimension: 'Win Alignment', score: 97, grade: 'A+', description: 'Roster perfectly built to compete now and later' },
        { dimension: 'Rotation Depth', score: 95, grade: 'A', description: 'Five quality starters with SP depth' },
        { dimension: 'Bullpen Construction', score: 94, grade: 'A', description: 'Multiple high-leverage arms with defined roles' },
      ],
      strengths: ['Elite farm system', 'Financial flexibility', 'Positional versatility'],
      weaknesses: ['High payroll risk', 'Reliance on opt-outs'],
      projectedWins: 98, coreAge: 27.5, payrollEfficiency: 0.18, pipelineScore: 95,
      notes: 'Model franchise. Combines financial muscle with player development excellence.',
    },
    {
      teamName: 'Atlanta Braves', abbr: 'ATL', overallScore: 93, mode: 'contender',
      dimensions: [
        { dimension: 'Positional Depth', score: 91, grade: 'A-', description: 'Strong core with a few thin spots' },
        { dimension: 'Age Balance', score: 95, grade: 'A', description: 'Locked-up young core for years' },
        { dimension: 'Salary Efficiency', score: 96, grade: 'A+', description: 'Team-friendly extensions provide elite value' },
        { dimension: 'Pipeline Integration', score: 90, grade: 'A-', description: 'Graduates impact regulars consistently' },
        { dimension: 'Win Alignment', score: 94, grade: 'A', description: 'Built to sustain contention for 5+ years' },
        { dimension: 'Rotation Depth', score: 88, grade: 'B+', description: 'Top-heavy rotation, need back-end help' },
        { dimension: 'Bullpen Construction', score: 86, grade: 'B+', description: 'Good closer, inconsistent middle relief' },
      ],
      strengths: ['Elite salary efficiency', 'Young locked-up core', 'Development track record'],
      weaknesses: ['Rotation depth behind top 2', 'Middle relief inconsistency'],
      projectedWins: 95, coreAge: 26.8, payrollEfficiency: 0.24, pipelineScore: 88,
      notes: 'Team-friendly contracts create a sustainable contention window. Elite value.',
    },
    {
      teamName: 'Houston Astros', abbr: 'HOU', overallScore: 88, mode: 'contender',
      dimensions: [
        { dimension: 'Positional Depth', score: 85, grade: 'B', description: 'Quality starters but bench is thin' },
        { dimension: 'Age Balance', score: 78, grade: 'C+', description: 'Core aging, need next wave' },
        { dimension: 'Salary Efficiency', score: 82, grade: 'B-', description: 'Paying market rate for veterans' },
        { dimension: 'Pipeline Integration', score: 84, grade: 'B', description: 'Some prospects graduating but pipeline thinning' },
        { dimension: 'Win Alignment', score: 92, grade: 'A-', description: 'All-in on current window' },
        { dimension: 'Rotation Depth', score: 94, grade: 'A', description: 'Deep, talented rotation top to bottom' },
        { dimension: 'Bullpen Construction', score: 90, grade: 'A-', description: 'Excellent bullpen depth and flexibility' },
      ],
      strengths: ['Elite pitching depth', 'Playoff experience', 'Organizational culture'],
      weaknesses: ['Aging core', 'Farm system depleted', 'Rising payroll'],
      projectedWins: 92, coreAge: 30.2, payrollEfficiency: 0.15, pipelineScore: 65,
      notes: 'Window is closing. Still elite but sustainability is the concern.',
    },
    {
      teamName: 'Detroit Tigers', abbr: 'DET', overallScore: 72, mode: 'retooling',
      dimensions: [
        { dimension: 'Positional Depth', score: 68, grade: 'C-', description: 'Multiple holes in everyday lineup' },
        { dimension: 'Age Balance', score: 80, grade: 'B-', description: 'Good mix of young and veteran' },
        { dimension: 'Salary Efficiency', score: 78, grade: 'C+', description: 'Low payroll but few impact players' },
        { dimension: 'Pipeline Integration', score: 82, grade: 'B-', description: 'Top prospects arriving soon' },
        { dimension: 'Win Alignment', score: 65, grade: 'C-', description: 'Between phases — not quite competitive' },
        { dimension: 'Rotation Depth', score: 72, grade: 'C', description: 'One ace, rest unproven' },
        { dimension: 'Bullpen Construction', score: 60, grade: 'D', description: 'Lack defined roles and quality depth' },
      ],
      strengths: ['Top prospect talent', 'Payroll flexibility', 'Emerging young pitching'],
      weaknesses: ['Bullpen', 'Offensive depth', 'Lack of impact bats'],
      projectedWins: 78, coreAge: 26.5, payrollEfficiency: 0.16, pipelineScore: 82,
      notes: 'On the cusp. Prospects need to hit for this roster to take the next step.',
    },
    {
      teamName: 'Kansas City Royals', abbr: 'KC', overallScore: 58, mode: 'rebuilding',
      dimensions: [
        { dimension: 'Positional Depth', score: 52, grade: 'F', description: 'Thin across the board' },
        { dimension: 'Age Balance', score: 70, grade: 'C-', description: 'Very young, limited experience' },
        { dimension: 'Salary Efficiency', score: 65, grade: 'C-', description: 'Low spend, but low production' },
        { dimension: 'Pipeline Integration', score: 72, grade: 'C', description: 'Pipeline is building but not MLB-ready' },
        { dimension: 'Win Alignment', score: 45, grade: 'F', description: 'Not built to win now' },
        { dimension: 'Rotation Depth', score: 55, grade: 'F', description: 'Need frontline starter badly' },
        { dimension: 'Bullpen Construction', score: 50, grade: 'F', description: 'Lacks reliable late-inning arms' },
      ],
      strengths: ['Payroll flexibility', 'Draft capital', 'Young position players'],
      weaknesses: ['Pitching at every level', 'No impact veterans', 'Thin farm system'],
      projectedWins: 68, coreAge: 25.2, payrollEfficiency: 0.12, pipelineScore: 55,
      notes: 'Full rebuild. Need 2-3 more drafts before competitive. Focus on pitching development.',
    },
    {
      teamName: 'New York Yankees', abbr: 'NYY', overallScore: 85, mode: 'contender',
      dimensions: [
        { dimension: 'Positional Depth', score: 88, grade: 'B+', description: 'Strong lineup, some bench concerns' },
        { dimension: 'Age Balance', score: 75, grade: 'C+', description: 'Core on older side, limited youth' },
        { dimension: 'Salary Efficiency', score: 70, grade: 'C-', description: 'High payroll with some dead money' },
        { dimension: 'Pipeline Integration', score: 72, grade: 'C', description: 'Farm depleted from trades' },
        { dimension: 'Win Alignment', score: 95, grade: 'A', description: 'All-in on winning now' },
        { dimension: 'Rotation Depth', score: 90, grade: 'A-', description: 'Excellent top-end pitching' },
        { dimension: 'Bullpen Construction', score: 88, grade: 'B+', description: 'Strong late-inning group' },
      ],
      strengths: ['Star power', 'Financial resources', 'Top-end pitching'],
      weaknesses: ['Depleted farm', 'Salary inflexibility', 'Aging lineup'],
      projectedWins: 94, coreAge: 29.8, payrollEfficiency: 0.13, pipelineScore: 48,
      notes: 'Win-now mode with financial muscle. Long-term sustainability is the concern.',
    },
    {
      teamName: 'Pittsburgh Pirates', abbr: 'PIT', overallScore: 62, mode: 'rebuilding',
      dimensions: [
        { dimension: 'Positional Depth', score: 55, grade: 'F', description: 'Few MLB-caliber regulars' },
        { dimension: 'Age Balance', score: 82, grade: 'B-', description: 'Very young roster with upside' },
        { dimension: 'Salary Efficiency', score: 75, grade: 'C+', description: 'Minimal spend, some cheap finds' },
        { dimension: 'Pipeline Integration', score: 85, grade: 'B', description: 'Strong pipeline starting to produce' },
        { dimension: 'Win Alignment', score: 50, grade: 'F', description: 'Not competitive yet' },
        { dimension: 'Rotation Depth', score: 58, grade: 'F', description: 'Need proven arms' },
        { dimension: 'Bullpen Construction', score: 55, grade: 'F', description: 'Bullpen is a weakness' },
      ],
      strengths: ['Top-tier farm system', 'Young cost-controlled talent', 'Draft pedigree'],
      weaknesses: ['No proven pitching', 'Offensive inconsistency', 'Budget constraints'],
      projectedWins: 72, coreAge: 25.0, payrollEfficiency: 0.14, pipelineScore: 90,
      notes: 'Pipeline is the strength. If top prospects hit, could fast-track the rebuild.',
    },
    {
      teamName: 'Minnesota Twins', abbr: 'MIN', overallScore: 80, mode: 'competitive',
      dimensions: [
        { dimension: 'Positional Depth', score: 82, grade: 'B-', description: 'Solid lineup with decent bench' },
        { dimension: 'Age Balance', score: 84, grade: 'B', description: 'Balanced age distribution' },
        { dimension: 'Salary Efficiency', score: 85, grade: 'B', description: 'Good value from mid-range contracts' },
        { dimension: 'Pipeline Integration', score: 78, grade: 'C+', description: 'Some prospects ready, more on the way' },
        { dimension: 'Win Alignment', score: 80, grade: 'B-', description: 'Competitive but not a clear favorite' },
        { dimension: 'Rotation Depth', score: 76, grade: 'C+', description: 'Need another reliable starter' },
        { dimension: 'Bullpen Construction', score: 78, grade: 'C+', description: 'Decent closer, needs setup help' },
      ],
      strengths: ['Balanced roster', 'Smart spending', 'Player development'],
      weaknesses: ['Lack a true ace', 'Bullpen depth', 'October track record'],
      projectedWins: 85, coreAge: 27.8, payrollEfficiency: 0.20, pipelineScore: 72,
      notes: 'Well-run organization. Need one more impact piece to become a true contender.',
    },
  ];

  return teams.map((t, i) => ({
    ...t,
    id: `rc-${i}`,
    overallGrade: scoreToGrade(t.overallScore),
  }));
}
