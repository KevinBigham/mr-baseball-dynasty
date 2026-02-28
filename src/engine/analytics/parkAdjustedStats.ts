// ── Park-Adjusted Stats ──────────────────────────────────────────
// Recalculates player stats with park factor normalization

export interface ParkFactor {
  parkName: string;
  teamName: string;
  overallFactor: number;   // 100 = neutral
  hrFactor: number;
  twoBaseFactor: number;
  runFactor: number;
  kFactor: number;
  bbFactor: number;
}

export interface ParkAdjPlayer {
  playerName: string;
  position: string;
  homePark: string;
  rawStats: { stat: string; raw: number; adjusted: number; delta: number }[];
  overallImpact: string;
  benefitRank: number;     // 1=most helped, negative=most hurt
}

export interface ParkAdjustedData {
  teamName: string;
  parkFactors: ParkFactor[];
  players: ParkAdjPlayer[];
  mostHelped: string;
  mostHurt: string;
}

export function getDeltaColor(delta: number): string {
  if (delta > 0) return '#22c55e';
  if (delta < 0) return '#ef4444';
  return '#9ca3af';
}

export function generateDemoParkAdjusted(): ParkAdjustedData {
  const parkFactors: ParkFactor[] = [
    { parkName: 'Oracle Park', teamName: 'SFG', overallFactor: 95, hrFactor: 88, twoBaseFactor: 102, runFactor: 92, kFactor: 103, bbFactor: 98 },
    { parkName: 'Coors Field', teamName: 'COL', overallFactor: 118, hrFactor: 115, twoBaseFactor: 120, runFactor: 122, kFactor: 88, bbFactor: 98 },
    { parkName: 'Yankee Stadium', teamName: 'NYY', overallFactor: 108, hrFactor: 112, twoBaseFactor: 95, runFactor: 106, kFactor: 97, bbFactor: 100 },
    { parkName: 'Petco Park', teamName: 'SDP', overallFactor: 93, hrFactor: 90, twoBaseFactor: 96, runFactor: 90, kFactor: 105, bbFactor: 101 },
    { parkName: 'Great American', teamName: 'CIN', overallFactor: 110, hrFactor: 114, twoBaseFactor: 105, runFactor: 112, kFactor: 95, bbFactor: 99 },
    { parkName: 'Tropicana Field', teamName: 'TBR', overallFactor: 97, hrFactor: 95, twoBaseFactor: 98, runFactor: 96, kFactor: 100, bbFactor: 102 },
  ];

  const players: ParkAdjPlayer[] = [
    {
      playerName: 'Carlos Delgado Jr.',
      position: 'DH',
      homePark: 'Oracle Park',
      benefitRank: -2,
      overallImpact: 'Oracle Park suppresses HR by 12% — true power is underrated',
      rawStats: [
        { stat: 'HR', raw: 28, adjusted: 32, delta: 4 },
        { stat: 'RBI', raw: 85, adjusted: 92, delta: 7 },
        { stat: 'AVG', raw: 0.278, adjusted: 0.285, delta: 0.007 },
        { stat: 'SLG', raw: 0.495, adjusted: 0.535, delta: 0.040 },
        { stat: 'wOBA', raw: 0.358, adjusted: 0.378, delta: 0.020 },
      ],
    },
    {
      playerName: 'Marcus Webb',
      position: 'CF',
      homePark: 'Oracle Park',
      benefitRank: -1,
      overallImpact: 'Contact-first approach limits Oracle Park penalty — still gains from normalization',
      rawStats: [
        { stat: 'HR', raw: 12, adjusted: 14, delta: 2 },
        { stat: 'RBI', raw: 58, adjusted: 63, delta: 5 },
        { stat: 'AVG', raw: 0.302, adjusted: 0.308, delta: 0.006 },
        { stat: 'SLG', raw: 0.418, adjusted: 0.440, delta: 0.022 },
        { stat: 'wOBA', raw: 0.345, adjusted: 0.358, delta: 0.013 },
      ],
    },
    {
      playerName: 'Terrence Baylor',
      position: '1B',
      homePark: 'Oracle Park',
      benefitRank: -3,
      overallImpact: 'Pull-heavy power profile most suppressed by Oracle Park dimensions',
      rawStats: [
        { stat: 'HR', raw: 35, adjusted: 40, delta: 5 },
        { stat: 'RBI', raw: 98, adjusted: 108, delta: 10 },
        { stat: 'AVG', raw: 0.255, adjusted: 0.262, delta: 0.007 },
        { stat: 'SLG', raw: 0.530, adjusted: 0.580, delta: 0.050 },
        { stat: 'wOBA', raw: 0.370, adjusted: 0.395, delta: 0.025 },
      ],
    },
    {
      playerName: 'J.D. Morales',
      position: '3B',
      homePark: 'Oracle Park',
      benefitRank: 1,
      overallImpact: 'Gap hitter benefits from Oracle Park triples alley; stats hold up',
      rawStats: [
        { stat: 'HR', raw: 18, adjusted: 17, delta: -1 },
        { stat: 'RBI', raw: 72, adjusted: 71, delta: -1 },
        { stat: 'AVG', raw: 0.290, adjusted: 0.286, delta: -0.004 },
        { stat: 'SLG', raw: 0.445, adjusted: 0.438, delta: -0.007 },
        { stat: 'wOBA', raw: 0.350, adjusted: 0.346, delta: -0.004 },
      ],
    },
  ];

  return {
    teamName: 'San Francisco Giants',
    parkFactors,
    players,
    mostHelped: 'J.D. Morales',
    mostHurt: 'Terrence Baylor',
  };
}
