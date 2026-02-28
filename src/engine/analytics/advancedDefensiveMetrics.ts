// Advanced Defensive Metrics — comprehensive defensive analytics by position

export interface DefensivePlayer {
  name: string;
  position: string;
  innings: number;
  drs: number;             // defensive runs saved
  oaa: number;             // outs above average
  uzr: number;             // ultimate zone rating
  dwar: number;            // defensive WAR
  errors: number;
  fieldingPct: number;
  rangeRating: number;     // 0-100
  armRating: number;       // 0-100
  overallDefGrade: string; // A+ to F
}

export interface PositionDefSummary {
  position: string;
  teamRank: number;        // 1-30 among MLB teams at position
  totalDRS: number;
  bestPlayer: string;
}

export interface AdvDefMetricsData {
  teamName: string;
  teamDRS: number;
  teamOAA: number;
  teamDefRank: number;
  players: DefensivePlayer[];
  byPosition: PositionDefSummary[];
}

export function getDefGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoAdvDefMetrics(): AdvDefMetricsData {
  return {
    teamName: 'San Francisco Giants',
    teamDRS: 32,
    teamOAA: 18,
    teamDefRank: 8,
    players: [
      { name: 'Jaylen Torres', position: 'SS', innings: 820, drs: 12, oaa: 8, uzr: 10.5, dwar: 1.8, errors: 8, fieldingPct: .978, rangeRating: 82, armRating: 75, overallDefGrade: 'A-' },
      { name: 'Miguel Santos', position: 'SS (AAA)', innings: 650, drs: 15, oaa: 10, uzr: 12.2, dwar: 2.1, errors: 5, fieldingPct: .985, rangeRating: 88, armRating: 80, overallDefGrade: 'A' },
      { name: 'Ricky Sandoval', position: '2B', innings: 780, drs: 5, oaa: 3, uzr: 4.2, dwar: 0.8, errors: 6, fieldingPct: .982, rangeRating: 70, armRating: 60, overallDefGrade: 'B' },
      { name: 'Tomas Herrera', position: '3B', innings: 750, drs: 2, oaa: 1, uzr: 1.5, dwar: 0.4, errors: 12, fieldingPct: .958, rangeRating: 58, armRating: 72, overallDefGrade: 'C+' },
      { name: 'Marcus Webb', position: 'CF', innings: 800, drs: 8, oaa: 6, uzr: 7.8, dwar: 1.2, errors: 2, fieldingPct: .992, rangeRating: 78, armRating: 65, overallDefGrade: 'B+' },
      { name: 'Victor Robles III', position: 'RF', innings: 720, drs: -2, oaa: -1, uzr: -1.5, dwar: 0.1, errors: 4, fieldingPct: .978, rangeRating: 52, armRating: 68, overallDefGrade: 'C' },
      { name: 'Kenji Matsuda', position: 'C', innings: 680, drs: 6, oaa: 4, uzr: 5.2, dwar: 0.9, errors: 3, fieldingPct: .995, rangeRating: 65, armRating: 70, overallDefGrade: 'B+' },
      { name: 'Danny Okoye', position: '1B', innings: 740, drs: 1, oaa: 0, uzr: 0.8, dwar: 0.2, errors: 5, fieldingPct: .992, rangeRating: 45, armRating: 50, overallDefGrade: 'C+' },
    ],
    byPosition: [
      { position: 'SS', teamRank: 5, totalDRS: 12, bestPlayer: 'Jaylen Torres' },
      { position: 'CF', teamRank: 8, totalDRS: 8, bestPlayer: 'Marcus Webb' },
      { position: 'C', teamRank: 10, totalDRS: 6, bestPlayer: 'Kenji Matsuda' },
      { position: '2B', teamRank: 12, totalDRS: 5, bestPlayer: 'Ricky Sandoval' },
      { position: '3B', teamRank: 18, totalDRS: 2, bestPlayer: 'Tomas Herrera' },
      { position: '1B', teamRank: 15, totalDRS: 1, bestPlayer: 'Danny Okoye' },
      { position: 'RF', teamRank: 22, totalDRS: -2, bestPlayer: 'Victor Robles III' },
    ],
  };
}
