// Farm System Grader — comprehensive grading of minor league system

export interface LevelGrade {
  level: string;
  grade: string;          // A+ to F
  topProspect: string;
  winPct: number;
  avgAge: number;
  notablePerformers: number;
  concerns: string;
}

export interface SystemCategory {
  category: string;
  grade: string;
  score: number;          // 0-100
  description: string;
}

export interface FarmSystemGraderData {
  teamName: string;
  overallGrade: string;
  overallScore: number;
  systemRank: number;
  graduatesThisYear: number;
  categories: SystemCategory[];
  levels: LevelGrade[];
}

export function getSystemGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoFarmSystemGrader(): FarmSystemGraderData {
  return {
    teamName: 'San Francisco Giants',
    overallGrade: 'B+',
    overallScore: 78,
    systemRank: 8,
    graduatesThisYear: 3,
    categories: [
      { category: 'Top-End Talent', grade: 'A-', score: 82, description: '4 prospects in MLB Top 100 — strong top of system' },
      { category: 'Depth', grade: 'B', score: 72, description: 'Solid mid-tier depth across levels' },
      { category: 'Pitching Development', grade: 'B+', score: 76, description: 'Strong pitching pipeline with 3 high-ceiling arms' },
      { category: 'Position Player Dev', grade: 'B', score: 70, description: 'Good hit tool development, power development lagging' },
      { category: 'MLB Readiness', grade: 'A', score: 85, description: '2 prospects ready for immediate MLB impact' },
      { category: 'Draft/IFA Results', grade: 'B-', score: 68, description: 'Recent drafts solid but no impact IFA signings' },
    ],
    levels: [
      { level: 'AAA', grade: 'A-', topProspect: 'Miguel Santos', winPct: .582, avgAge: 25.2, notablePerformers: 4, concerns: 'Thin on starting pitching depth' },
      { level: 'AA', grade: 'B+', topProspect: 'Jordan Park', winPct: .545, avgAge: 23.1, notablePerformers: 3, concerns: 'Power numbers below average' },
      { level: 'A+', grade: 'B', topProspect: 'Ryan Alvarez', winPct: .510, avgAge: 21.8, notablePerformers: 2, concerns: 'Defensive development slow at multiple positions' },
      { level: 'A', grade: 'B+', topProspect: 'Kai Nakamura', winPct: .558, avgAge: 20.2, notablePerformers: 3, concerns: 'High strikeout rates across the board' },
    ],
  };
}
