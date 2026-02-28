// ── Roster Construction Grader ───────────────────────────────────
// Evaluates overall roster balance, depth, and construction quality

export interface PositionGroupGrade {
  group: string;          // "Rotation", "Bullpen", "Infield", "Outfield", "Catcher", "DH"
  grade: string;          // A+ through D
  depth: number;          // 1-5
  avgWAR: number;
  topPlayer: string;
  concerns: string[];
  strengths: string[];
}

export interface RosterBalance {
  offenseVsDefense: number;    // -100 (all defense) to +100 (all offense)
  youthVsVeteran: number;      // avg age
  leftVsRight: { leftPct: number; rightPct: number; switchPct: number };
  speedVsPower: string;
  overallBalance: 'excellent' | 'good' | 'average' | 'poor';
}

export interface RosterConstructionData {
  teamName: string;
  overallGrade: string;
  leagueRank: number;
  totalWAR: number;
  positionGroups: PositionGroupGrade[];
  balance: RosterBalance;
  biggestStrength: string;
  biggestWeakness: string;
  recommendations: string[];
}

export function getRosterGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoRosterConstruction(): RosterConstructionData {
  return {
    teamName: 'San Francisco Giants',
    overallGrade: 'B+',
    leagueRank: 8,
    totalWAR: 42.5,
    positionGroups: [
      { group: 'Rotation', grade: 'A-', depth: 4, avgWAR: 3.2, topPlayer: 'Alejandro Vega (5.8 WAR)', concerns: ['#5 starter inconsistent'], strengths: ['Top 3 very strong', 'Good strikeout rates'] },
      { group: 'Bullpen', grade: 'B+', depth: 3, avgWAR: 0.8, topPlayer: 'Camilo Doval (2.1 WAR)', concerns: ['Setup man volatile', 'No reliable lefty'], strengths: ['Elite closer', 'Good depth in middle relief'] },
      { group: 'Infield', grade: 'B', depth: 3, avgWAR: 2.5, topPlayer: 'J.D. Morales (4.2 WAR)', concerns: ['1B defense', '2B aging'], strengths: ['SS is a star', '3B solid both ways'] },
      { group: 'Outfield', grade: 'B+', depth: 4, avgWAR: 2.8, topPlayer: 'Marcus Webb (5.5 WAR)', concerns: ['LF platoon needed'], strengths: ['CF elite', 'RF has power arm'] },
      { group: 'Catcher', grade: 'A-', depth: 2, avgWAR: 2.2, topPlayer: 'Miguel Santos (3.5 WAR)', concerns: ['Backup is weak offensively'], strengths: ['Elite framing', 'Strong arm'] },
      { group: 'DH', grade: 'B', depth: 2, avgWAR: 2.0, topPlayer: 'Carlos Delgado Jr. (3.2 WAR)', concerns: ['No defensive versatility'], strengths: ['Plus bat', 'Veteran presence'] },
    ],
    balance: {
      offenseVsDefense: 15,
      youthVsVeteran: 28.4,
      leftVsRight: { leftPct: 35, rightPct: 55, switchPct: 10 },
      speedVsPower: 'Power-leaning with avg speed',
      overallBalance: 'good',
    },
    biggestStrength: 'Starting rotation depth with three legit top-of-rotation arms',
    biggestWeakness: 'Lack of elite left-handed relief option for late-game matchups',
    recommendations: [
      'Target LHP reliever at deadline or via trade',
      'Consider platoon partner for LF to maximize production',
      'Develop backup catcher bat through AAA reps',
      'Lock up Alejandro Vega long-term before arb 3',
    ],
  };
}
