// Situational Hitting Splits — batting performance by game situations

export interface SituationSplit {
  situation: string;
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  rbi: number;
  clutchRating: number;    // 0-100
}

export interface SituationalHitter {
  name: string;
  position: string;
  overallClutch: number;   // 0-100
  splits: SituationSplit[];
  bestSituation: string;
  worstSituation: string;
}

export interface SituationalHittingData {
  teamName: string;
  players: SituationalHitter[];
  teamRISPAvg: number;
  teamClutchRating: number;
}

export function getClutchColor(clutch: number): string {
  if (clutch >= 75) return '#22c55e';
  if (clutch >= 50) return '#3b82f6';
  if (clutch >= 25) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoSituationalHitting(): SituationalHittingData {
  return {
    teamName: 'San Francisco Giants',
    teamRISPAvg: .272,
    teamClutchRating: 68,
    players: [
      {
        name: 'Carlos Delgado Jr.', position: 'DH', overallClutch: 85,
        bestSituation: 'RISP 2 Outs', worstSituation: 'Bases Loaded',
        splits: [
          { situation: 'RISP', pa: 145, avg: .312, obp: .402, slg: .568, ops: .970, rbi: 58, clutchRating: 88 },
          { situation: 'RISP 2 Outs', pa: 62, avg: .335, obp: .420, slg: .612, ops: 1.032, rbi: 32, clutchRating: 92 },
          { situation: 'Bases Loaded', pa: 18, avg: .250, obp: .333, slg: .438, ops: .771, rbi: 12, clutchRating: 55 },
          { situation: 'Late & Close', pa: 85, avg: .298, obp: .385, slg: .525, ops: .910, rbi: 22, clutchRating: 82 },
          { situation: 'High Leverage', pa: 98, avg: .305, obp: .395, slg: .548, ops: .943, rbi: 35, clutchRating: 86 },
        ],
      },
      {
        name: 'Jaylen Torres', position: 'SS', overallClutch: 72,
        bestSituation: 'Late & Close', worstSituation: 'RISP 2 Outs',
        splits: [
          { situation: 'RISP', pa: 132, avg: .278, obp: .365, slg: .445, ops: .810, rbi: 42, clutchRating: 70 },
          { situation: 'RISP 2 Outs', pa: 55, avg: .245, obp: .328, slg: .388, ops: .716, rbi: 18, clutchRating: 48 },
          { situation: 'Bases Loaded', pa: 15, avg: .308, obp: .400, slg: .538, ops: .938, rbi: 14, clutchRating: 78 },
          { situation: 'Late & Close', pa: 78, avg: .312, obp: .392, slg: .488, ops: .880, rbi: 15, clutchRating: 82 },
          { situation: 'High Leverage', pa: 88, avg: .285, obp: .372, slg: .458, ops: .830, rbi: 28, clutchRating: 75 },
        ],
      },
      {
        name: 'Marcus Webb', position: 'CF', overallClutch: 45,
        bestSituation: 'Bases Loaded', worstSituation: 'Late & Close',
        splits: [
          { situation: 'RISP', pa: 120, avg: .242, obp: .318, slg: .398, ops: .716, rbi: 35, clutchRating: 42 },
          { situation: 'RISP 2 Outs', pa: 48, avg: .228, obp: .295, slg: .375, ops: .670, rbi: 12, clutchRating: 35 },
          { situation: 'Bases Loaded', pa: 12, avg: .333, obp: .417, slg: .583, ops: 1.000, rbi: 10, clutchRating: 72 },
          { situation: 'Late & Close', pa: 72, avg: .218, obp: .298, slg: .345, ops: .643, rbi: 8, clutchRating: 30 },
          { situation: 'High Leverage', pa: 82, avg: .238, obp: .312, slg: .378, ops: .690, rbi: 18, clutchRating: 38 },
        ],
      },
    ],
  };
}
