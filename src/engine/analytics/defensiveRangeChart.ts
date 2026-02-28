// Defensive Range Chart — visual range/zone coverage per fielder

export type FieldZone = 'shallow_left' | 'deep_left' | 'shallow_center' | 'deep_center' | 'shallow_right' | 'deep_right' | 'infield_left' | 'infield_middle' | 'infield_right' | 'bunt';

export interface ZoneCoverage {
  zone: FieldZone;
  attempts: number;
  converted: number;
  conversionRate: number;     // 0-1
  leagueAvgRate: number;
  oaa: number;                // outs above average
}

export interface FielderRange {
  playerId: string;
  name: string;
  position: string;
  innings: number;
  totalOAA: number;
  rangeScore: number;          // 0-100
  armScore: number;            // 0-100
  firstStepScore: number;      // 0-100
  errorRate: number;           // errors per 100 chances
  zones: ZoneCoverage[];
  overallGrade: 'Gold Glove' | 'Above Avg' | 'Average' | 'Below Avg' | 'Liability';
}

export interface DefensiveRangeData {
  fielders: FielderRange[];
  teamDRS: number;
  teamOAA: number;
}

export function getGradeColor(grade: FielderRange['overallGrade']): string {
  switch (grade) {
    case 'Gold Glove': return '#f59e0b';
    case 'Above Avg': return '#22c55e';
    case 'Average': return '#3b82f6';
    case 'Below Avg': return '#9ca3af';
    case 'Liability': return '#ef4444';
  }
}

export function getOAAColor(oaa: number): string {
  if (oaa >= 5) return '#22c55e';
  if (oaa >= 0) return '#3b82f6';
  if (oaa >= -5) return '#f59e0b';
  return '#ef4444';
}

const ZONE_LABELS: Record<FieldZone, string> = {
  shallow_left: 'SH-L', deep_left: 'DP-L', shallow_center: 'SH-C', deep_center: 'DP-C',
  shallow_right: 'SH-R', deep_right: 'DP-R', infield_left: 'IF-L', infield_middle: 'IF-M',
  infield_right: 'IF-R', bunt: 'BUNT',
};
export { ZONE_LABELS };

export function generateDemoDefensiveRange(): DefensiveRangeData {
  const fielders: FielderRange[] = [
    {
      playerId: 'F1', name: 'Gunnar Henderson', position: 'SS', innings: 880, totalOAA: 12,
      rangeScore: 82, armScore: 75, firstStepScore: 88, errorRate: 1.4, overallGrade: 'Above Avg',
      zones: [
        { zone: 'infield_left', attempts: 145, converted: 122, conversionRate: .841, leagueAvgRate: .790, oaa: 5 },
        { zone: 'infield_middle', attempts: 168, converted: 148, conversionRate: .881, leagueAvgRate: .855, oaa: 4 },
        { zone: 'infield_right', attempts: 92, converted: 74, conversionRate: .804, leagueAvgRate: .780, oaa: 2 },
        { zone: 'shallow_left', attempts: 35, converted: 22, conversionRate: .629, leagueAvgRate: .600, oaa: 1 },
        { zone: 'shallow_center', attempts: 28, converted: 16, conversionRate: .571, leagueAvgRate: .560, oaa: 0 },
        { zone: 'bunt', attempts: 18, converted: 16, conversionRate: .889, leagueAvgRate: .880, oaa: 0 },
      ],
    },
    {
      playerId: 'F2', name: 'Jorge Mateo', position: '2B', innings: 620, totalOAA: 8,
      rangeScore: 90, armScore: 65, firstStepScore: 92, errorRate: 2.1, overallGrade: 'Above Avg',
      zones: [
        { zone: 'infield_left', attempts: 78, converted: 60, conversionRate: .769, leagueAvgRate: .720, oaa: 3 },
        { zone: 'infield_middle', attempts: 110, converted: 98, conversionRate: .891, leagueAvgRate: .865, oaa: 3 },
        { zone: 'infield_right', attempts: 88, converted: 74, conversionRate: .841, leagueAvgRate: .820, oaa: 2 },
        { zone: 'shallow_right', attempts: 22, converted: 14, conversionRate: .636, leagueAvgRate: .580, oaa: 1 },
        { zone: 'shallow_center', attempts: 18, converted: 10, conversionRate: .556, leagueAvgRate: .550, oaa: 0 },
        { zone: 'bunt', attempts: 12, converted: 10, conversionRate: .833, leagueAvgRate: .850, oaa: -1 },
      ],
    },
    {
      playerId: 'F3', name: 'Cedric Mullins', position: 'CF', innings: 950, totalOAA: 15,
      rangeScore: 88, armScore: 70, firstStepScore: 85, errorRate: 0.8, overallGrade: 'Gold Glove',
      zones: [
        { zone: 'shallow_left', attempts: 82, converted: 78, conversionRate: .951, leagueAvgRate: .920, oaa: 3 },
        { zone: 'deep_left', attempts: 45, converted: 28, conversionRate: .622, leagueAvgRate: .560, oaa: 3 },
        { zone: 'shallow_center', attempts: 95, converted: 92, conversionRate: .968, leagueAvgRate: .955, oaa: 1 },
        { zone: 'deep_center', attempts: 52, converted: 34, conversionRate: .654, leagueAvgRate: .580, oaa: 4 },
        { zone: 'shallow_right', attempts: 68, converted: 64, conversionRate: .941, leagueAvgRate: .910, oaa: 2 },
        { zone: 'deep_right', attempts: 38, converted: 22, conversionRate: .579, leagueAvgRate: .540, oaa: 2 },
      ],
    },
    {
      playerId: 'F4', name: 'Anthony Santander', position: 'RF', innings: 900, totalOAA: -4,
      rangeScore: 45, armScore: 72, firstStepScore: 40, errorRate: 1.2, overallGrade: 'Below Avg',
      zones: [
        { zone: 'shallow_right', attempts: 88, converted: 78, conversionRate: .886, leagueAvgRate: .910, oaa: -2 },
        { zone: 'deep_right', attempts: 42, converted: 18, conversionRate: .429, leagueAvgRate: .480, oaa: -2 },
        { zone: 'shallow_center', attempts: 32, converted: 28, conversionRate: .875, leagueAvgRate: .890, oaa: 0 },
        { zone: 'deep_center', attempts: 18, converted: 8, conversionRate: .444, leagueAvgRate: .450, oaa: 0 },
      ],
    },
    {
      playerId: 'F5', name: 'Ryan Mountcastle', position: '1B', innings: 880, totalOAA: 2,
      rangeScore: 55, armScore: 50, firstStepScore: 52, errorRate: 1.5, overallGrade: 'Average',
      zones: [
        { zone: 'infield_right', attempts: 165, converted: 155, conversionRate: .939, leagueAvgRate: .935, oaa: 1 },
        { zone: 'infield_middle', attempts: 42, converted: 32, conversionRate: .762, leagueAvgRate: .740, oaa: 1 },
        { zone: 'shallow_right', attempts: 22, converted: 14, conversionRate: .636, leagueAvgRate: .640, oaa: 0 },
        { zone: 'bunt', attempts: 28, converted: 25, conversionRate: .893, leagueAvgRate: .890, oaa: 0 },
      ],
    },
  ];

  return { fielders, teamDRS: 33, teamOAA: 28 };
}
