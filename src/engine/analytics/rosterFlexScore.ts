// Roster Flexibility Score — measures positional versatility and depth across the 26-man roster

export interface FlexPlayer {
  name: string;
  primaryPos: string;
  eligiblePositions: string[];
  positionCount: number;
  flexScore: number;        // 0-100
  utilityValue: number;     // added wins from versatility
  defensiveRating: Record<string, number>;  // position -> rating (20-80)
}

export interface RosterFlexData {
  teamName: string;
  overallFlexScore: number;
  flexGrade: string;
  leagueRank: number;
  positionCoverage: Record<string, number>;  // position -> # of eligible players
  players: FlexPlayer[];
  weakSpots: string[];
  strengths: string[];
}

export function getFlexColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#3b82f6';
  if (score >= 30) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoRosterFlex(): RosterFlexData {
  const players: FlexPlayer[] = [
    { name: 'Jaylen Torres', primaryPos: 'SS', eligiblePositions: ['SS', '2B', '3B'], positionCount: 3, flexScore: 82, utilityValue: 0.6, defensiveRating: { SS: 65, '2B': 55, '3B': 50 } },
    { name: 'Ricky Sandoval', primaryPos: '2B', eligiblePositions: ['2B', 'SS', 'LF'], positionCount: 3, flexScore: 78, utilityValue: 0.5, defensiveRating: { '2B': 70, SS: 45, LF: 40 } },
    { name: 'Marcus Webb', primaryPos: 'CF', eligiblePositions: ['CF', 'LF', 'RF'], positionCount: 3, flexScore: 85, utilityValue: 0.7, defensiveRating: { CF: 70, LF: 65, RF: 60 } },
    { name: 'Tomas Herrera', primaryPos: '3B', eligiblePositions: ['3B', '1B'], positionCount: 2, flexScore: 55, utilityValue: 0.3, defensiveRating: { '3B': 60, '1B': 50 } },
    { name: 'Aiden Park', primaryPos: 'LF', eligiblePositions: ['LF', 'RF', 'CF', '1B'], positionCount: 4, flexScore: 90, utilityValue: 0.8, defensiveRating: { LF: 55, RF: 50, CF: 40, '1B': 45 } },
    { name: 'Carlos Delgado Jr.', primaryPos: 'DH', eligiblePositions: ['DH'], positionCount: 1, flexScore: 10, utilityValue: 0, defensiveRating: { DH: 0 } },
    { name: 'Victor Robles III', primaryPos: 'RF', eligiblePositions: ['RF', 'LF'], positionCount: 2, flexScore: 48, utilityValue: 0.2, defensiveRating: { RF: 60, LF: 55 } },
    { name: 'Dimitri Kazakov', primaryPos: '1B', eligiblePositions: ['1B'], positionCount: 1, flexScore: 15, utilityValue: 0, defensiveRating: { '1B': 55 } },
    { name: 'Jackson Whitfield', primaryPos: 'C', eligiblePositions: ['C', '1B'], positionCount: 2, flexScore: 42, utilityValue: 0.2, defensiveRating: { C: 60, '1B': 35 } },
  ];

  return {
    teamName: 'San Francisco Giants',
    overallFlexScore: 68,
    flexGrade: 'B+',
    leagueRank: 8,
    positionCoverage: { C: 1, '1B': 3, '2B': 2, '3B': 2, SS: 2, LF: 3, CF: 2, RF: 3, DH: 1 },
    players,
    weakSpots: ['Only 1 catcher on roster', 'DH-only player limits pinch-hit options', 'No backup SS with plus defense'],
    strengths: ['Strong OF versatility (Webb, Park)', 'Middle infield depth (Torres, Sandoval)', 'Park provides 4-position flexibility'],
  };
}
