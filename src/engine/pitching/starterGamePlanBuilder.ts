// ── Starter Game Plan Builder ────────────────────────────────────
// Creates pitch-by-pitch game plans for starting pitchers vs opponent lineups

export interface BatterPlan {
  batterName: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  avgAgainst: number;
  opsAgainst: number;
  keyWeakness: string;
  pitchPlan: PitchPlanStep[];
  dangerRating: number;    // 1-10
}

export interface PitchPlanStep {
  count: string;
  pitch: string;
  location: string;
  intent: string;
  successRate: number;
}

export interface StarterGamePlan {
  pitcherName: string;
  opponent: string;
  gameDate: string;
  projectedPitchCount: number;
  projectedInnings: number;
  overallStrategy: string;
  batterPlans: BatterPlan[];
  keyMatchups: string[];
  pitchMixSuggestion: { pitch: string; pct: number }[];
}

export interface StarterGamePlanData {
  teamName: string;
  plan: StarterGamePlan;
}

export function getDangerColor(rating: number): string {
  if (rating >= 8) return '#ef4444';
  if (rating >= 5) return '#f59e0b';
  return '#22c55e';
}

export function generateDemoStarterGamePlan(): StarterGamePlanData {
  const plan: StarterGamePlan = {
    pitcherName: 'Alejandro Vega',
    opponent: 'Los Angeles Dodgers',
    gameDate: 'June 14',
    projectedPitchCount: 98,
    projectedInnings: 6.2,
    overallStrategy: 'Attack with sinker/slider combo; limit damage from 3-4-5; use changeup to neutralize LHH',
    batterPlans: [
      {
        batterName: 'Mookie Betts',
        position: 'RF',
        bats: 'R',
        avgAgainst: 0.285,
        opsAgainst: 0.810,
        keyWeakness: 'Elevated sinker, slider backdoor',
        dangerRating: 8,
        pitchPlan: [
          { count: '0-0', pitch: 'Sinker', location: 'Down & in', intent: 'Get ahead, induce ground ball', successRate: 62 },
          { count: '0-1', pitch: 'Slider', location: 'Backdoor', intent: 'Freeze or weak contact', successRate: 55 },
          { count: '1-2', pitch: 'Changeup', location: 'Down & away', intent: 'Chase pitch for K', successRate: 48 },
        ],
      },
      {
        batterName: 'Freddie Freeman',
        position: '1B',
        bats: 'L',
        avgAgainst: 0.310,
        opsAgainst: 0.890,
        keyWeakness: 'Changeup away, high fastball',
        dangerRating: 9,
        pitchPlan: [
          { count: '0-0', pitch: 'Changeup', location: 'Away', intent: 'Neutralize LH advantage', successRate: 58 },
          { count: '1-0', pitch: 'Sinker', location: 'Glove side', intent: 'Weak groundball', successRate: 50 },
          { count: '1-1', pitch: 'Four-seam', location: 'Up & in', intent: 'Jam for foul ball', successRate: 52 },
          { count: '1-2', pitch: 'Slider', location: 'Bury', intent: 'Put away', successRate: 45 },
        ],
      },
      {
        batterName: 'Will Smith',
        position: 'C',
        bats: 'R',
        avgAgainst: 0.240,
        opsAgainst: 0.720,
        keyWeakness: 'Sliders down & away',
        dangerRating: 6,
        pitchPlan: [
          { count: '0-0', pitch: 'Sinker', location: 'In', intent: 'Get ahead', successRate: 65 },
          { count: '0-1', pitch: 'Slider', location: 'Down & away', intent: 'Expand zone', successRate: 60 },
          { count: '0-2', pitch: 'Slider', location: 'Bury', intent: 'Strikeout', successRate: 52 },
        ],
      },
      {
        batterName: 'Max Muncy',
        position: '3B',
        bats: 'L',
        avgAgainst: 0.195,
        opsAgainst: 0.660,
        keyWeakness: 'Changeup down, fastball elevated',
        dangerRating: 5,
        pitchPlan: [
          { count: '0-0', pitch: 'Changeup', location: 'Down', intent: 'Soft contact early', successRate: 62 },
          { count: '0-1', pitch: 'Four-seam', location: 'Up', intent: 'Uncomfortable swing', successRate: 58 },
          { count: '1-2', pitch: 'Changeup', location: 'Down & away', intent: 'Chase for K', successRate: 55 },
        ],
      },
      {
        batterName: 'Teoscar Hernandez',
        position: 'LF',
        bats: 'R',
        avgAgainst: 0.260,
        opsAgainst: 0.780,
        keyWeakness: 'Breaking balls low, fastball in',
        dangerRating: 7,
        pitchPlan: [
          { count: '0-0', pitch: 'Sinker', location: 'In', intent: 'Set up breaking ball', successRate: 60 },
          { count: '1-0', pitch: 'Slider', location: 'Down & away', intent: 'Change eye level', successRate: 52 },
          { count: '1-1', pitch: 'Sinker', location: 'Down', intent: 'Ground ball', successRate: 58 },
        ],
      },
      {
        batterName: 'Gavin Lux',
        position: '2B',
        bats: 'L',
        avgAgainst: 0.210,
        opsAgainst: 0.580,
        keyWeakness: 'Struggles with velocity up',
        dangerRating: 3,
        pitchPlan: [
          { count: '0-0', pitch: 'Four-seam', location: 'Up', intent: 'Overpower early', successRate: 68 },
          { count: '0-1', pitch: 'Changeup', location: 'Down', intent: 'Speed change K', successRate: 62 },
        ],
      },
    ],
    keyMatchups: [
      'Freeman is 8-for-22 lifetime — must execute changeup away',
      'Betts sits fastball early — use off-speed on 0-0 if up by 3+',
      'Smith chases sliders at highest rate in lineup (38%)',
    ],
    pitchMixSuggestion: [
      { pitch: 'Sinker', pct: 35 },
      { pitch: 'Slider', pct: 25 },
      { pitch: 'Changeup', pct: 22 },
      { pitch: 'Four-seam', pct: 18 },
    ],
  };

  return { teamName: 'San Francisco Giants', plan };
}
