// ── Team Defensive Shift Analyzer ────────────────────────────────
// Evaluates effectiveness of defensive positioning and shifts

export interface ShiftScenario {
  againstBatter: string;
  shiftType: string;          // "Full shift", "Partial shift", "No shift", "Custom"
  groundBalls: number;
  outs: number;
  hits: number;
  runsPreventedVsNoShift: number;
  successRate: number;
}

export interface PositionShiftData {
  position: string;
  playerName: string;
  shiftCompliance: number;   // 0-100
  reactTime: number;         // seconds
  rangeWithShift: number;    // 0-100
  runsAboveAvgPos: number;
}

export interface DefShiftAnalysis {
  teamName: string;
  totalShifts: number;
  shiftSuccessRate: number;
  runsPreventedByShifts: number;
  shiftScenarios: ShiftScenario[];
  positionData: PositionShiftData[];
  shiftRecommendations: { scenario: string; recommendation: string; expectedBenefit: string }[];
  leagueShiftRank: number;
}

export function getSuccessColor(rate: number): string {
  if (rate >= 70) return '#22c55e';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoDefShiftAnalysis(): DefShiftAnalysis {
  return {
    teamName: 'San Francisco Giants',
    totalShifts: 482,
    shiftSuccessRate: 64.3,
    runsPreventedByShifts: 18,
    leagueShiftRank: 7,
    shiftScenarios: [
      { againstBatter: 'LHH Pull Hitters', shiftType: 'Full shift', groundBalls: 145, outs: 98, hits: 47, runsPreventedVsNoShift: 6.2, successRate: 67.6 },
      { againstBatter: 'RHH Pull Hitters', shiftType: 'Partial shift', groundBalls: 118, outs: 72, hits: 46, runsPreventedVsNoShift: 4.1, successRate: 61.0 },
      { againstBatter: 'Spray Hitters', shiftType: 'No shift', groundBalls: 92, outs: 55, hits: 37, runsPreventedVsNoShift: 0, successRate: 59.8 },
      { againstBatter: 'Bunters', shiftType: 'Custom', groundBalls: 38, outs: 28, hits: 10, runsPreventedVsNoShift: 2.8, successRate: 73.7 },
      { againstBatter: 'LHH Oppo Gap', shiftType: 'Partial shift', groundBalls: 89, outs: 58, hits: 31, runsPreventedVsNoShift: 4.9, successRate: 65.2 },
    ],
    positionData: [
      { position: 'SS', playerName: 'Julio Herrera', shiftCompliance: 92, reactTime: 0.42, rangeWithShift: 88, runsAboveAvgPos: 8 },
      { position: '2B', playerName: 'Chris Nakamura', shiftCompliance: 88, reactTime: 0.45, rangeWithShift: 82, runsAboveAvgPos: 5 },
      { position: '3B', playerName: 'J.D. Morales', shiftCompliance: 85, reactTime: 0.48, rangeWithShift: 75, runsAboveAvgPos: 3 },
      { position: '1B', playerName: 'Terrence Baylor', shiftCompliance: 78, reactTime: 0.52, rangeWithShift: 65, runsAboveAvgPos: -2 },
      { position: 'CF', playerName: 'Marcus Webb', shiftCompliance: 95, reactTime: 0.38, rangeWithShift: 92, runsAboveAvgPos: 10 },
      { position: 'LF', playerName: 'Derek Palmer', shiftCompliance: 82, reactTime: 0.50, rangeWithShift: 70, runsAboveAvgPos: 1 },
      { position: 'RF', playerName: 'Tony Reyes', shiftCompliance: 86, reactTime: 0.44, rangeWithShift: 78, runsAboveAvgPos: 4 },
    ],
    shiftRecommendations: [
      { scenario: 'vs Freddie Freeman', recommendation: 'Full shift right — 72% pull rate on GB', expectedBenefit: '+2.1 runs/season' },
      { scenario: 'vs Kyle Schwarber', recommendation: 'Full shift right — extreme pull tendency', expectedBenefit: '+1.8 runs/season' },
      { scenario: 'vs Juan Soto', recommendation: 'Standard alignment — too much oppo power', expectedBenefit: 'N/A — shift costs runs' },
      { scenario: 'RISP situations', recommendation: 'Reduce shift aggressiveness — cut runs not outs', expectedBenefit: '+0.5 runs saved' },
    ],
  };
}
