// Platoon Advantage Tracker — track L/R splits performance over time

export interface PlatoonPlayer {
  name: string;
  position: string;
  hand: 'L' | 'R' | 'S';
  vsLHP: { avg: number; obp: number; slg: number; ops: number; pa: number };
  vsRHP: { avg: number; obp: number; slg: number; ops: number; pa: number };
  platoonSplit: number;        // OPS diff (vsRHP - vsLHP for LHB, vsLHP - vsRHP for RHB)
  platoonGrade: string;        // A+ to F
  recommendation: 'start-vs-all' | 'platoon-only' | 'bench-vs-same' | 'everyday';
}

export interface PlatoonAdvTrackerData {
  teamName: string;
  teamPlatoonAdvantage: number;   // team-level OPS advantage in favorable matchups
  playersTracked: PlatoonPlayer[];
  bestPlatoonPair: { vs: string; player1: string; player2: string; combinedOPS: number };
}

export function getPlatoonGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoPlatoonAdvTracker(): PlatoonAdvTrackerData {
  return {
    teamName: 'San Francisco Giants',
    teamPlatoonAdvantage: .042,
    bestPlatoonPair: { vs: 'LHP', player1: 'Carlos Delgado Jr.', player2: 'Tomas Herrera', combinedOPS: .918 },
    playersTracked: [
      { name: 'Carlos Delgado Jr.', position: 'DH', hand: 'R', vsLHP: { avg: .312, obp: .402, slg: .585, ops: .987, pa: 125 }, vsRHP: { avg: .278, obp: .365, slg: .502, ops: .867, pa: 320 }, platoonSplit: .120, platoonGrade: 'A', recommendation: 'everyday' },
      { name: 'Jaylen Torres', position: 'SS', hand: 'R', vsLHP: { avg: .295, obp: .375, slg: .480, ops: .855, pa: 110 }, vsRHP: { avg: .268, obp: .342, slg: .425, ops: .767, pa: 285 }, platoonSplit: .088, platoonGrade: 'B+', recommendation: 'everyday' },
      { name: 'Marcus Webb', position: 'CF', hand: 'L', vsLHP: { avg: .235, obp: .295, slg: .365, ops: .660, pa: 95 }, vsRHP: { avg: .298, obp: .372, slg: .492, ops: .864, pa: 310 }, platoonSplit: .204, platoonGrade: 'C', recommendation: 'bench-vs-same' },
      { name: 'Victor Robles III', position: 'RF', hand: 'L', vsLHP: { avg: .248, obp: .312, slg: .398, ops: .710, pa: 88 }, vsRHP: { avg: .285, obp: .358, slg: .468, ops: .826, pa: 295 }, platoonSplit: .116, platoonGrade: 'B-', recommendation: 'platoon-only' },
      { name: 'Tomas Herrera', position: '3B', hand: 'R', vsLHP: { avg: .302, obp: .368, slg: .518, ops: .886, pa: 105 }, vsRHP: { avg: .255, obp: .322, slg: .405, ops: .727, pa: 280 }, platoonSplit: .159, platoonGrade: 'A-', recommendation: 'start-vs-all' },
      { name: 'Ricky Sandoval', position: '2B', hand: 'S', vsLHP: { avg: .275, obp: .348, slg: .420, ops: .768, pa: 92 }, vsRHP: { avg: .282, obp: .355, slg: .435, ops: .790, pa: 275 }, platoonSplit: .022, platoonGrade: 'A+', recommendation: 'everyday' },
    ],
  };
}
