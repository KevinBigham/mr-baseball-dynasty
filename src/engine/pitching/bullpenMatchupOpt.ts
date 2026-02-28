// Bullpen Matchup Optimizer — optimal reliever selection based on batter matchups

export interface MatchupOption {
  relieverName: string;
  hand: 'L' | 'R';
  vsCurrentBatter: number;    // projected out probability
  fatigue: number;            // 0-100
  arsenalFit: string;         // description of why this is good/bad
  matchupScore: number;       // 0-100
  recentERA: number;
}

export interface BPOptScenario {
  inning: number;
  batter: string;
  batterHand: 'L' | 'R';
  situation: string;
  leverage: number;
  options: MatchupOption[];
  bestChoice: string;
}

export interface BPOptData {
  teamName: string;
  scenarios: BPOptScenario[];
  bullpenHealth: number;       // 0-100 overall
}

export function generateDemoBPOpt(): BPOptData {
  return {
    teamName: 'San Francisco Giants',
    bullpenHealth: 68,
    scenarios: [
      { inning: 7, batter: 'Shohei Ohtani', batterHand: 'L', situation: 'Runner on 2nd, 1 out', leverage: 4.2, bestChoice: 'Tyler Kim', options: [
        { relieverName: 'Tyler Kim', hand: 'R', vsCurrentBatter: 72, fatigue: 8, arsenalFit: 'High-velo fastball + slider neutralizes LHB power', matchupScore: 92, recentERA: 2.88 },
        { relieverName: 'Colton Braithwaite', hand: 'R', vsCurrentBatter: 65, fatigue: 22, arsenalFit: 'Good but prefers to save for 9th', matchupScore: 78, recentERA: 1.82 },
        { relieverName: 'Derek Solis', hand: 'L', vsCurrentBatter: 58, fatigue: 35, arsenalFit: 'L-on-L but Ohtani crushes LHP', matchupScore: 55, recentERA: 2.68 },
      ]},
      { inning: 8, batter: 'Mookie Betts', batterHand: 'R', situation: 'Bases empty, 0 out', leverage: 3.5, bestChoice: 'Marcus Rivera', options: [
        { relieverName: 'Marcus Rivera', hand: 'R', vsCurrentBatter: 68, fatigue: 62, arsenalFit: 'Sinker/slider combo effective vs Betts', matchupScore: 74, recentERA: 3.15 },
        { relieverName: 'Tyler Kim', hand: 'R', vsCurrentBatter: 64, fatigue: 18, arsenalFit: 'Would work but save for higher leverage', matchupScore: 70, recentERA: 2.88 },
      ]},
    ],
  };
}
