// Defensive Replacement Engine — optimal late-game defensive substitutions

export interface DefReplacementOption {
  currentPlayer: string;
  currentPosition: string;
  currentDefRating: number;   // 0-100
  replacement: string;
  replacementDefRating: number;
  ratingGain: number;
  offenseLoss: number;         // expected run loss from lost bat
  netBenefit: number;          // runs saved - offense lost
  recommendation: 'strong-yes' | 'yes' | 'situational' | 'no';
}

export interface DefReplacementScenario {
  inning: number;
  leadSize: number;
  outs: number;
  options: DefReplacementOption[];
}

export interface DefReplacementData {
  teamName: string;
  scenarios: DefReplacementScenario[];
  seasonDefSubsUsed: number;
  seasonRunsSaved: number;
}

export function getNetBenefitColor(net: number): string {
  if (net >= 0.1) return '#22c55e';
  if (net >= 0) return '#3b82f6';
  if (net >= -0.05) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoDefReplacement(): DefReplacementData {
  return {
    teamName: 'San Francisco Giants',
    seasonDefSubsUsed: 42,
    seasonRunsSaved: 8.5,
    scenarios: [
      {
        inning: 8, leadSize: 2, outs: 0,
        options: [
          { currentPlayer: 'Victor Robles III', currentPosition: 'RF', currentDefRating: 55, replacement: 'Andre Flowers', replacementDefRating: 82, ratingGain: 27, offenseLoss: 0.05, netBenefit: 0.18, recommendation: 'strong-yes' },
          { currentPlayer: 'Danny Okoye', currentPosition: '1B', currentDefRating: 45, replacement: 'Brandon Mitchell', replacementDefRating: 72, ratingGain: 27, offenseLoss: 0.08, netBenefit: 0.12, recommendation: 'yes' },
          { currentPlayer: 'Tomas Herrera', currentPosition: '3B', currentDefRating: 62, replacement: 'Chris Novak', replacementDefRating: 78, ratingGain: 16, offenseLoss: 0.12, netBenefit: 0.02, recommendation: 'situational' },
        ],
      },
      {
        inning: 9, leadSize: 1, outs: 0,
        options: [
          { currentPlayer: 'Carlos Delgado Jr.', currentPosition: 'DH', currentDefRating: 30, replacement: 'Andre Flowers', replacementDefRating: 82, ratingGain: 52, offenseLoss: 0.15, netBenefit: 0.22, recommendation: 'strong-yes' },
          { currentPlayer: 'Kenji Matsuda', currentPosition: 'C', currentDefRating: 68, replacement: 'Ryan Salazar', replacementDefRating: 85, ratingGain: 17, offenseLoss: 0.04, netBenefit: 0.10, recommendation: 'yes' },
        ],
      },
    ],
  };
}
