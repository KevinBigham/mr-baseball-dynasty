// ── Home/Away Performance ────────────────────────────────────────
// Analyzes team and player home vs away splits

export interface HomeAwaySplit {
  playerName: string;
  position: string;
  homeBA: number;
  homeOPS: number;
  homeHR: number;
  awayBA: number;
  awayOPS: number;
  awayHR: number;
  splitDelta: number;       // OPS difference (positive = better at home)
  splitLabel: 'home heavy' | 'away heavy' | 'balanced';
}

export interface TeamHomeAway {
  location: 'Home' | 'Away';
  wins: number;
  losses: number;
  winPct: number;
  runsPerGame: number;
  runsAllowedPerGame: number;
  teamBA: number;
  teamERA: number;
  teamOPS: number;
}

export interface HomeAwayData {
  teamName: string;
  homeRecord: string;
  awayRecord: string;
  teamSplits: TeamHomeAway[];
  playerSplits: HomeAwaySplit[];
  biggestHomeAdvantage: string;
  biggestAwayStruggle: string;
  interleagueRecord: string;
}

export function getSplitColor(label: string): string {
  if (label === 'home heavy') return '#22c55e';
  if (label === 'away heavy') return '#3b82f6';
  return '#9ca3af';
}

function getSplitLabel(delta: number): 'home heavy' | 'away heavy' | 'balanced' {
  if (delta > 0.050) return 'home heavy';
  if (delta < -0.050) return 'away heavy';
  return 'balanced';
}

export function generateDemoHomeAway(): HomeAwayData {
  const playerSplits: HomeAwaySplit[] = [
    { playerName: 'Carlos Delgado Jr.', position: 'DH', homeBA: 0.298, homeOPS: 0.905, homeHR: 18, awayBA: 0.255, awayOPS: 0.762, awayHR: 10, splitDelta: 0.143, splitLabel: 'home heavy' },
    { playerName: 'Marcus Webb', position: 'CF', homeBA: 0.310, homeOPS: 0.880, homeHR: 8, awayBA: 0.295, awayOPS: 0.842, awayHR: 4, splitDelta: 0.038, splitLabel: 'balanced' },
    { playerName: 'Terrence Baylor', position: '1B', homeBA: 0.272, homeOPS: 0.870, homeHR: 22, awayBA: 0.238, awayOPS: 0.725, awayHR: 13, splitDelta: 0.145, splitLabel: 'home heavy' },
    { playerName: 'J.D. Morales', position: '3B', homeBA: 0.285, homeOPS: 0.810, homeHR: 10, awayBA: 0.296, awayOPS: 0.835, awayHR: 8, splitDelta: -0.025, splitLabel: 'balanced' },
    { playerName: 'Tony Reyes', position: 'RF', homeBA: 0.255, homeOPS: 0.748, homeHR: 8, awayBA: 0.270, awayOPS: 0.812, awayHR: 10, splitDelta: -0.064, splitLabel: 'away heavy' },
    { playerName: 'Derek Palmer', position: 'LF', homeBA: 0.268, homeOPS: 0.755, homeHR: 6, awayBA: 0.242, awayOPS: 0.695, awayHR: 4, splitDelta: 0.060, splitLabel: 'home heavy' },
  ];

  return {
    teamName: 'San Francisco Giants',
    homeRecord: '30-15',
    awayRecord: '20-25',
    teamSplits: [
      { location: 'Home', wins: 30, losses: 15, winPct: 0.667, runsPerGame: 4.8, runsAllowedPerGame: 3.5, teamBA: 0.268, teamERA: 3.42, teamOPS: 0.765 },
      { location: 'Away', wins: 20, losses: 25, winPct: 0.444, runsPerGame: 3.5, runsAllowedPerGame: 4.2, teamBA: 0.245, teamERA: 4.15, teamOPS: 0.702 },
    ],
    playerSplits,
    biggestHomeAdvantage: 'Terrence Baylor (+.145 OPS at home)',
    biggestAwayStruggle: 'Pitching staff ERA 4.15 on road vs 3.42 at home',
    interleagueRecord: '8-4',
  };
}
