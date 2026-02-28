// Salary Arbitration Predictor — predict arbitration hearing outcomes

export interface ArbComparable {
  playerName: string;
  year: number;
  stats: string;
  awarded: number;
}

export interface ArbCase {
  playerName: string;
  position: string;
  serviceTime: string;
  currentSalary: number;
  teamOffer: number;
  playerAsk: number;
  predictedAward: number;
  teamWinProb: number;      // 0-100
  keyStats: string;
  comparables: ArbComparable[];
  recommendation: 'settle' | 'file' | 'non-tender';
}

export interface SalaryArbPredictorData {
  teamName: string;
  totalArbEligible: number;
  projectedCost: number;     // millions
  cases: ArbCase[];
}

export function getArbRecColor(rec: string): string {
  if (rec === 'settle') return '#22c55e';
  if (rec === 'file') return '#3b82f6';
  return '#ef4444';
}

export function generateDemoSalaryArbPredictor(): SalaryArbPredictorData {
  return {
    teamName: 'San Francisco Giants',
    totalArbEligible: 4,
    projectedCost: 28.5,
    cases: [
      {
        playerName: 'Victor Robles III', position: 'RF', serviceTime: '3.142', currentSalary: 4.2,
        teamOffer: 7.5, playerAsk: 9.8, predictedAward: 8.2, teamWinProb: 62,
        keyStats: '.265/.340/.445, 18 HR, 2.2 WAR',
        recommendation: 'settle',
        comparables: [
          { playerName: 'Bryan Reynolds', year: 2023, stats: '.260/.345/.450, 20 HR', awarded: 8.5 },
          { playerName: 'Teoscar Hernandez', year: 2022, stats: '.270/.325/.460, 22 HR', awarded: 8.0 },
        ],
      },
      {
        playerName: 'Ricky Sandoval', position: '2B', serviceTime: '2.168', currentSalary: 2.8,
        teamOffer: 5.0, playerAsk: 6.5, predictedAward: 5.4, teamWinProb: 70,
        keyStats: '.272/.348/.420, 12 HR, 1.8 WAR',
        recommendation: 'settle',
        comparables: [
          { playerName: 'Nico Hoerner', year: 2024, stats: '.280/.340/.400, 10 HR', awarded: 5.2 },
          { playerName: 'Andres Gimenez', year: 2024, stats: '.265/.330/.415, 14 HR', awarded: 5.8 },
        ],
      },
      {
        playerName: 'Derek Solis', position: 'RP', serviceTime: '3.085', currentSalary: 3.5,
        teamOffer: 5.2, playerAsk: 7.0, predictedAward: 5.8, teamWinProb: 55,
        keyStats: '2.68 ERA, 58.2 IP, 65 K, 1.5 WAR',
        recommendation: 'file',
        comparables: [
          { playerName: 'Scott Barlow', year: 2023, stats: '2.80 ERA, 60 IP', awarded: 5.5 },
          { playerName: 'Ryan Pressly', year: 2022, stats: '2.50 ERA, 55 IP', awarded: 6.2 },
        ],
      },
      {
        playerName: 'Kenji Matsuda', position: 'C', serviceTime: '2.045', currentSalary: 1.8,
        teamOffer: 3.5, playerAsk: 4.8, predictedAward: 3.8, teamWinProb: 68,
        keyStats: '.252/.325/.380, 10 HR, framing +8 runs, 1.2 WAR',
        recommendation: 'settle',
        comparables: [
          { playerName: 'Jonah Heim', year: 2024, stats: '.248/.315/.400, 12 HR', awarded: 4.0 },
          { playerName: 'Sean Murphy', year: 2023, stats: '.260/.330/.420, 14 HR', awarded: 4.5 },
        ],
      },
    ],
  };
}
