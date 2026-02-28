// Clutch Performance Index V2 — advanced clutch metrics with context-aware grading

export interface ClutchSituation {
  situation: string;
  opportunities: number;
  successRate: number;     // 0-100
  wpa: number;             // win probability added
  leverage: number;        // avg leverage index
}

export interface ClutchPlayer {
  name: string;
  position: string;
  overallCPI: number;      // clutch performance index, 0-150 (100 = avg)
  rank: number;
  trend: 'rising' | 'falling' | 'stable';
  situations: ClutchSituation[];
  bestMoment: string;
  cpiGrade: string;        // A+ to F
}

export interface ClutchPerformanceIndexData {
  teamName: string;
  teamCPI: number;
  teamClutchRank: number;
  players: ClutchPlayer[];
}

export function getCPIColor(cpi: number): string {
  if (cpi >= 120) return '#22c55e';
  if (cpi >= 100) return '#3b82f6';
  if (cpi >= 80) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoClutchPerformanceIndex(): ClutchPerformanceIndexData {
  return {
    teamName: 'San Francisco Giants',
    teamCPI: 108,
    teamClutchRank: 7,
    players: [
      {
        name: 'Carlos Delgado Jr.', position: 'DH', overallCPI: 135, rank: 1, trend: 'rising', cpiGrade: 'A+',
        bestMoment: 'Walk-off grand slam vs LAD (Jul 2)',
        situations: [
          { situation: 'Tie Game 7th+', opportunities: 42, successRate: 38, wpa: 2.85, leverage: 2.8 },
          { situation: 'RISP 2 Outs', opportunities: 62, successRate: 34, wpa: 1.92, leverage: 1.9 },
          { situation: 'Go-Ahead AB', opportunities: 28, successRate: 36, wpa: 3.15, leverage: 3.2 },
        ],
      },
      {
        name: 'Colton Braithwaite', position: 'CL', overallCPI: 128, rank: 2, trend: 'stable', cpiGrade: 'A',
        bestMoment: 'Bases loaded K to end playoff game',
        situations: [
          { situation: 'Save Situations', opportunities: 28, successRate: 89, wpa: 4.20, leverage: 3.5 },
          { situation: 'High Leverage', opportunities: 45, successRate: 82, wpa: 3.80, leverage: 2.8 },
          { situation: 'Tying Run on Base', opportunities: 15, successRate: 87, wpa: 2.50, leverage: 3.8 },
        ],
      },
      {
        name: 'Marcus Webb', position: 'CF', overallCPI: 72, rank: 6, trend: 'falling', cpiGrade: 'C-',
        bestMoment: 'Diving catch to save a run (May 15)',
        situations: [
          { situation: 'Tie Game 7th+', opportunities: 38, successRate: 18, wpa: -0.85, leverage: 2.5 },
          { situation: 'RISP 2 Outs', opportunities: 48, successRate: 19, wpa: -1.20, leverage: 1.8 },
          { situation: 'Go-Ahead AB', opportunities: 22, successRate: 14, wpa: -1.50, leverage: 3.0 },
        ],
      },
      {
        name: 'Jaylen Torres', position: 'SS', overallCPI: 112, rank: 3, trend: 'rising', cpiGrade: 'B+',
        bestMoment: 'Game-tying HR in 9th vs SD (Jun 18)',
        situations: [
          { situation: 'Tie Game 7th+', opportunities: 35, successRate: 31, wpa: 1.50, leverage: 2.6 },
          { situation: 'RISP 2 Outs', opportunities: 55, successRate: 25, wpa: 0.85, leverage: 1.7 },
          { situation: 'Go-Ahead AB', opportunities: 20, successRate: 30, wpa: 1.80, leverage: 3.1 },
        ],
      },
    ],
  };
}
