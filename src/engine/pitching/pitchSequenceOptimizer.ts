// Pitch Sequence Optimizer — recommend optimal pitch sequences by count

export interface SequenceStep {
  count: string;         // e.g. "0-0", "1-2"
  recommendedPitch: string;
  velocity: number;
  location: string;
  expectedResult: string;
  successPct: number;
}

export interface PitcherSequencePlan {
  pitcherName: string;
  batterName: string;
  batterHand: 'L' | 'R';
  situation: string;
  sequence: SequenceStep[];
  strikeoutProb: number;
  weakContactProb: number;
}

export interface PitchSequenceOptData {
  teamName: string;
  plans: PitcherSequencePlan[];
  teamStrikeoutRate: number;
  teamWeakContactRate: number;
}

export function generateDemoPitchSequenceOpt(): PitchSequenceOptData {
  return {
    teamName: 'San Francisco Giants',
    teamStrikeoutRate: 24.2,
    teamWeakContactRate: 38.5,
    plans: [
      {
        pitcherName: 'Javier Castillo', batterName: 'Shohei Ohtani', batterHand: 'L', situation: 'Runner on 2nd, 1 out',
        strikeoutProb: 28, weakContactProb: 35,
        sequence: [
          { count: '0-0', recommendedPitch: 'FF', velocity: 96, location: 'Up and in', expectedResult: 'Called strike or foul', successPct: 62 },
          { count: '0-1', recommendedPitch: 'SL', velocity: 87, location: 'Back door low', expectedResult: 'Swing and miss', successPct: 45 },
          { count: '0-2', recommendedPitch: 'CH', velocity: 88, location: 'Down and away', expectedResult: 'Chase / weak contact', successPct: 52 },
          { count: '1-2', recommendedPitch: 'FF', velocity: 97, location: 'Up in zone', expectedResult: 'Swing through or pop up', successPct: 38 },
        ],
      },
      {
        pitcherName: 'Greg Thornton', batterName: 'Mookie Betts', batterHand: 'R', situation: 'Bases empty, 0 out',
        strikeoutProb: 22, weakContactProb: 42,
        sequence: [
          { count: '0-0', recommendedPitch: 'SI', velocity: 93, location: 'Low and away', expectedResult: 'Ground ball or take', successPct: 55 },
          { count: '1-0', recommendedPitch: 'FF', velocity: 94, location: 'Middle-in', expectedResult: 'Strike looking or foul', successPct: 48 },
          { count: '1-1', recommendedPitch: 'CB', velocity: 80, location: 'Bury it', expectedResult: 'Chase swing', successPct: 40 },
          { count: '1-2', recommendedPitch: 'SI', velocity: 93, location: 'Glove side low', expectedResult: 'Ground ball DP', successPct: 45 },
        ],
      },
    ],
  };
}
