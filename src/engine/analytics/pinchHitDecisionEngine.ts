// Pinch Hit Decision Engine — optimal PH matchup recommendations based on game state

export interface PHCandidate {
  name: string;
  hand: 'L' | 'R' | 'S';
  avgVsL: number;
  avgVsR: number;
  clutchRating: number;    // 20-80
  platoonAdv: number;      // expected wOBA boost
  recommendation: number;  // 0-100 score
}

export interface PHDecision {
  currentBatter: string;
  currentBatterHand: 'L' | 'R';
  currentPitcher: string;
  currentPitcherHand: 'L' | 'R';
  inning: number;
  outs: number;
  runnersOn: string;
  leverage: number;         // 0-5
  candidates: PHCandidate[];
  bestOption: string;
  expectedRunGain: number;
}

export interface PHEngineData {
  decisions: PHDecision[];
  seasonPHAvg: number;
  teamPHRank: number;
}

export function generateDemoPinchHitEngine(): PHEngineData {
  return {
    seasonPHAvg: .248,
    teamPHRank: 8,
    decisions: [
      { currentBatter: 'Jackson Whitfield', currentBatterHand: 'R', currentPitcher: 'Tyler Glasnow', currentPitcherHand: 'R', inning: 7, outs: 1, runnersOn: '1st & 2nd', leverage: 3.8, bestOption: 'Aiden Park', expectedRunGain: 0.18, candidates: [
        { name: 'Aiden Park', hand: 'L', avgVsL: .245, avgVsR: .285, clutchRating: 62, platoonAdv: 0.035, recommendation: 88 },
        { name: 'Dimitri Kazakov', hand: 'L', avgVsL: .238, avgVsR: .275, clutchRating: 55, platoonAdv: 0.028, recommendation: 72 },
      ]},
      { currentBatter: 'Tomas Herrera', currentBatterHand: 'R', currentPitcher: 'Derek Solis', currentPitcherHand: 'L', inning: 8, outs: 0, runnersOn: '2nd', leverage: 4.2, bestOption: 'Victor Robles III', expectedRunGain: 0.22, candidates: [
        { name: 'Victor Robles III', hand: 'L', avgVsL: .298, avgVsR: .268, clutchRating: 58, platoonAdv: 0.042, recommendation: 92 },
        { name: 'Ricky Sandoval', hand: 'S', avgVsL: .282, avgVsR: .292, clutchRating: 65, platoonAdv: 0.015, recommendation: 78 },
      ]},
    ],
  };
}
