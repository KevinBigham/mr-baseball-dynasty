// Defensive Positioning Optimizer — optimal shift and positioning recommendations

export interface DefPositionRec {
  position: string;
  player: string;
  currentX: number;
  currentY: number;
  optimalX: number;
  optimalY: number;
  shiftSavings: number;    // runs saved by optimal positioning
  hitsPrevented: number;
}

export interface BatterTendency {
  name: string;
  team: string;
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  gbPct: number;
  fbPct: number;
  ldPct: number;
  shiftRecommendation: 'heavy-pull' | 'standard' | 'no-shift' | 'reverse';
}

export interface DefOptData {
  teamName: string;
  currentRunsSaved: number;
  optimalRunsSaved: number;
  gainAvailable: number;
  positionRecs: DefPositionRec[];
  batterTendencies: BatterTendency[];
}

export function getShiftColor(rec: string): string {
  if (rec === 'heavy-pull') return '#ef4444';
  if (rec === 'standard') return '#3b82f6';
  if (rec === 'no-shift') return '#22c55e';
  return '#f59e0b';
}

export function generateDemoDefOptimizer(): DefOptData {
  return {
    teamName: 'San Francisco Giants',
    currentRunsSaved: 18.4,
    optimalRunsSaved: 26.8,
    gainAvailable: 8.4,
    positionRecs: [
      { position: 'SS', player: 'Jaylen Torres', currentX: -20, currentY: 120, optimalX: -15, optimalY: 125, shiftSavings: 1.8, hitsPrevented: 12 },
      { position: '2B', player: 'Ricky Sandoval', currentX: 18, currentY: 115, optimalX: 25, optimalY: 118, shiftSavings: 2.2, hitsPrevented: 15 },
      { position: '3B', player: 'Tomas Herrera', currentX: -45, currentY: 95, optimalX: -38, optimalY: 100, shiftSavings: 1.4, hitsPrevented: 8 },
      { position: 'CF', player: 'Marcus Webb', currentX: 0, currentY: 310, optimalX: 5, optimalY: 305, shiftSavings: 1.2, hitsPrevented: 6 },
      { position: 'RF', player: 'Victor Robles III', currentX: 55, currentY: 290, optimalX: 48, optimalY: 285, shiftSavings: 0.9, hitsPrevented: 5 },
      { position: 'LF', player: 'Aiden Park', currentX: -55, currentY: 285, optimalX: -50, optimalY: 280, shiftSavings: 0.6, hitsPrevented: 4 },
    ],
    batterTendencies: [
      { name: 'Aaron Judge', team: 'NYY', pullPct: 48.2, centerPct: 28.5, oppoPct: 23.3, gbPct: 32.1, fbPct: 42.8, ldPct: 25.1, shiftRecommendation: 'heavy-pull' },
      { name: 'Bryce Harper', team: 'PHI', pullPct: 42.8, centerPct: 32.1, oppoPct: 25.1, gbPct: 35.5, fbPct: 38.2, ldPct: 26.3, shiftRecommendation: 'standard' },
      { name: 'Luis Arraez', team: 'SD', pullPct: 28.5, centerPct: 38.2, oppoPct: 33.3, gbPct: 48.2, fbPct: 22.5, ldPct: 29.3, shiftRecommendation: 'no-shift' },
      { name: 'Juan Soto', team: 'NYM', pullPct: 38.5, centerPct: 34.2, oppoPct: 27.3, gbPct: 30.1, fbPct: 40.5, ldPct: 29.4, shiftRecommendation: 'standard' },
      { name: 'Freddie Freeman', team: 'LAD', pullPct: 35.2, centerPct: 36.5, oppoPct: 28.3, gbPct: 42.5, fbPct: 30.2, ldPct: 27.3, shiftRecommendation: 'no-shift' },
    ],
  };
}
