// Batting Order Impact Model — measure how lineup slot affects production

export interface SlotImpact {
  slot: number;
  currentBatter: string;
  position: string;
  paPerGame: number;
  runsScoredContrib: number;
  rbiContrib: number;
  optimalSlot: number;
  impactDelta: number;         // runs gained/lost from non-optimal placement
  wOBA: number;
  leverage: number;            // avg leverage of ABs in this slot
}

export interface BattingOrderImpactData {
  teamName: string;
  totalRunsScored: number;
  optimalProjectedRuns: number;
  currentEfficiency: number;   // 0-100
  slots: SlotImpact[];
}

export function getEfficiencyColor(eff: number): string {
  if (eff >= 90) return '#22c55e';
  if (eff >= 75) return '#3b82f6';
  if (eff >= 60) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoBattingOrderImpact(): BattingOrderImpactData {
  return {
    teamName: 'San Francisco Giants',
    totalRunsScored: 412,
    optimalProjectedRuns: 438,
    currentEfficiency: 94.1,
    slots: [
      { slot: 1, currentBatter: 'Jaylen Torres', position: 'SS', paPerGame: 4.5, runsScoredContrib: 62, rbiContrib: 34, optimalSlot: 1, impactDelta: 0, wOBA: .358, leverage: 0.92 },
      { slot: 2, currentBatter: 'Marcus Webb', position: 'CF', paPerGame: 4.3, runsScoredContrib: 55, rbiContrib: 48, optimalSlot: 2, impactDelta: 0, wOBA: .345, leverage: 1.05 },
      { slot: 3, currentBatter: 'Carlos Delgado Jr.', position: 'DH', paPerGame: 4.2, runsScoredContrib: 48, rbiContrib: 72, optimalSlot: 3, impactDelta: 0, wOBA: .392, leverage: 1.18 },
      { slot: 4, currentBatter: 'Victor Robles III', position: 'RF', paPerGame: 4.1, runsScoredContrib: 42, rbiContrib: 65, optimalSlot: 5, impactDelta: -3.2, wOBA: .338, leverage: 1.15 },
      { slot: 5, currentBatter: 'Tomas Herrera', position: '3B', paPerGame: 4.0, runsScoredContrib: 38, rbiContrib: 55, optimalSlot: 4, impactDelta: -2.8, wOBA: .342, leverage: 1.08 },
      { slot: 6, currentBatter: 'Ricky Sandoval', position: '2B', paPerGame: 3.9, runsScoredContrib: 35, rbiContrib: 42, optimalSlot: 6, impactDelta: 0, wOBA: .318, leverage: 0.95 },
      { slot: 7, currentBatter: 'Danny Okoye', position: '1B', paPerGame: 3.8, runsScoredContrib: 30, rbiContrib: 38, optimalSlot: 7, impactDelta: 0, wOBA: .305, leverage: 0.88 },
      { slot: 8, currentBatter: 'Kenji Matsuda', position: 'C', paPerGame: 3.7, runsScoredContrib: 22, rbiContrib: 28, optimalSlot: 9, impactDelta: -1.5, wOBA: .278, leverage: 0.75 },
      { slot: 9, currentBatter: 'Andre Flowers', position: 'LF', paPerGame: 3.6, runsScoredContrib: 28, rbiContrib: 30, optimalSlot: 8, impactDelta: -1.2, wOBA: .295, leverage: 0.72 },
    ],
  };
}
