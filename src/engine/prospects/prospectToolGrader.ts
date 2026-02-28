// ── Prospect Tool Grader ─────────────────────────────────────────
// Comprehensive 5-tool grading system for minor league prospects

export interface ToolGrade {
  tool: string;          // Hit, Power, Run, Arm, Field (or Fastball, Breaking, Command, Control, Stamina for pitchers)
  currentGrade: number;  // 20-80
  futureGrade: number;
  ceiling: number;
  floor: number;
  trend: 'improving' | 'stable' | 'declining';
  notes: string;
}

export interface ProspectToolProfile {
  playerName: string;
  position: string;
  age: number;
  level: string;
  overallFV: number;     // future value 20-80
  eta: string;
  riskLevel: 'low' | 'medium' | 'high';
  tools: ToolGrade[];
  scoutingSummary: string;
  comparisons: string[];
}

export interface ProspectToolData {
  teamName: string;
  prospects: ProspectToolProfile[];
  systemRank: number;
}

export function getGradeColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 55) return '#3b82f6';
  if (grade >= 45) return '#f59e0b';
  return '#ef4444';
}

export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  if (risk === 'low') return '#22c55e';
  if (risk === 'medium') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoProspectTools(): ProspectToolData {
  const prospects: ProspectToolProfile[] = [
    {
      playerName: 'Julio Herrera',
      position: 'SS',
      age: 20,
      level: 'AA',
      overallFV: 65,
      eta: '2027',
      riskLevel: 'low',
      tools: [
        { tool: 'Hit', currentGrade: 55, futureGrade: 65, ceiling: 70, floor: 55, trend: 'improving', notes: 'Advanced bat-to-ball, improving pitch recognition' },
        { tool: 'Power', currentGrade: 50, futureGrade: 60, ceiling: 65, floor: 50, trend: 'improving', notes: 'Raw pop developing; 15+ HR power projection' },
        { tool: 'Run', currentGrade: 60, futureGrade: 55, ceiling: 60, floor: 50, trend: 'stable', notes: 'Plus speed now, may slow slightly as he fills out' },
        { tool: 'Arm', currentGrade: 60, futureGrade: 60, ceiling: 65, floor: 55, trend: 'stable', notes: 'Strong arm fits SS; accurate throws' },
        { tool: 'Field', currentGrade: 55, futureGrade: 60, ceiling: 65, floor: 50, trend: 'improving', notes: 'Smooth actions; range improving with experience' },
      ],
      scoutingSummary: 'High-floor SS with plus speed and developing power. Projects as everyday starter with All-Star upside.',
      comparisons: ['Marcus Semien (optimistic)', 'Xander Bogaerts (realistic)', 'JP Crawford (pessimistic)'],
    },
    {
      playerName: 'Ryan Whitaker',
      position: 'RHP',
      age: 22,
      level: 'AAA',
      overallFV: 60,
      eta: '2026',
      riskLevel: 'medium',
      tools: [
        { tool: 'Fastball', currentGrade: 65, futureGrade: 65, ceiling: 70, floor: 60, trend: 'stable', notes: '95-98 mph with ride; elite spin rate (2450 rpm)' },
        { tool: 'Breaking', currentGrade: 55, futureGrade: 60, ceiling: 65, floor: 50, trend: 'improving', notes: 'Slider shows plus potential; working on curveball shape' },
        { tool: 'Command', currentGrade: 45, futureGrade: 55, ceiling: 60, floor: 40, trend: 'improving', notes: 'Can lose command when overthrowing; trending up' },
        { tool: 'Control', currentGrade: 50, futureGrade: 55, ceiling: 60, floor: 45, trend: 'stable', notes: '3.2 BB/9 at AAA; needs to tighten zone' },
        { tool: 'Stamina', currentGrade: 55, futureGrade: 60, ceiling: 65, floor: 50, trend: 'stable', notes: 'Has gone 6+ innings consistently; builds up well' },
      ],
      scoutingSummary: 'Power arm with frontline stuff. Command development is the key variable. Mid-rotation floor with ace upside.',
      comparisons: ['Corbin Burnes (optimistic)', 'Logan Gilbert (realistic)', 'Eduardo Rodriguez (pessimistic)'],
    },
    {
      playerName: 'Devon Jackson',
      position: 'OF',
      age: 19,
      level: 'A+',
      overallFV: 55,
      eta: '2028',
      riskLevel: 'high',
      tools: [
        { tool: 'Hit', currentGrade: 40, futureGrade: 55, ceiling: 60, floor: 35, trend: 'improving', notes: 'Raw approach; struggling with off-speed but adjusting' },
        { tool: 'Power', currentGrade: 55, futureGrade: 70, ceiling: 80, floor: 55, trend: 'improving', notes: 'Plus-plus raw power; 30+ HR potential' },
        { tool: 'Run', currentGrade: 55, futureGrade: 50, ceiling: 55, floor: 45, trend: 'stable', notes: 'Average runner now; likely corner OF long-term' },
        { tool: 'Arm', currentGrade: 65, futureGrade: 65, ceiling: 70, floor: 60, trend: 'stable', notes: 'Cannon arm; profiles in RF' },
        { tool: 'Field', currentGrade: 45, futureGrade: 50, ceiling: 55, floor: 40, trend: 'stable', notes: 'Adequate routes; may move to corner' },
      ],
      scoutingSummary: 'Toolsy OF with elite raw power and a cannon arm. High-risk, high-reward profile — hit tool is the swing factor.',
      comparisons: ['Giancarlo Stanton (optimistic)', 'Jorge Soler (realistic)', 'Franmil Reyes (pessimistic)'],
    },
    {
      playerName: 'Miguel Santos',
      position: 'C',
      age: 21,
      level: 'AA',
      overallFV: 55,
      eta: '2027',
      riskLevel: 'medium',
      tools: [
        { tool: 'Hit', currentGrade: 45, futureGrade: 50, ceiling: 55, floor: 40, trend: 'stable', notes: 'Improved contact; handles velocity well' },
        { tool: 'Power', currentGrade: 45, futureGrade: 55, ceiling: 60, floor: 45, trend: 'improving', notes: '15-20 HR projection; gap power developing' },
        { tool: 'Run', currentGrade: 30, futureGrade: 30, ceiling: 35, floor: 25, trend: 'stable', notes: 'Catcher speed; below average' },
        { tool: 'Arm', currentGrade: 65, futureGrade: 70, ceiling: 70, floor: 60, trend: 'improving', notes: 'Elite pop times (1.85s); 35% CS rate' },
        { tool: 'Field', currentGrade: 60, futureGrade: 65, ceiling: 70, floor: 55, trend: 'improving', notes: 'Excellent framing; handles staff well' },
      ],
      scoutingSummary: 'Defense-first catcher with improving offense. Plus arm and framing make him valuable even with modest bat.',
      comparisons: ['J.T. Realmuto (optimistic)', 'Sean Murphy (realistic)', 'Austin Hedges (pessimistic)'],
    },
  ];

  return { teamName: 'San Francisco Giants', prospects, systemRank: 8 };
}
