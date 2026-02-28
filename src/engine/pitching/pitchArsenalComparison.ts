// Pitch Arsenal Comparison — compare arsenals between pitchers on staff

export interface PitchProfile {
  pitchType: string;
  velocity: number;
  spinRate: number;
  usage: number;          // percentage
  whiffRate: number;
  putawayRate: number;
  grade: string;          // A+ to F
}

export interface ArsenalProfile {
  pitcherName: string;
  role: 'SP' | 'RP' | 'CL';
  throws: 'L' | 'R';
  pitches: PitchProfile[];
  bestPitch: string;
  worstPitch: string;
  arsenalGrade: string;
}

export interface PitchArsenalCompData {
  teamName: string;
  pitchers: ArsenalProfile[];
  teamAvgPitchTypes: number;
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoPitchArsenalComp(): PitchArsenalCompData {
  return {
    teamName: 'San Francisco Giants',
    teamAvgPitchTypes: 3.8,
    pitchers: [
      {
        pitcherName: 'Javier Castillo', role: 'SP', throws: 'R', bestPitch: 'FF', worstPitch: 'CH', arsenalGrade: 'A-',
        pitches: [
          { pitchType: 'FF', velocity: 96.2, spinRate: 2380, usage: 42, whiffRate: 26.5, putawayRate: 18.2, grade: 'A' },
          { pitchType: 'SL', velocity: 87.5, spinRate: 2650, usage: 28, whiffRate: 35.2, putawayRate: 22.8, grade: 'A-' },
          { pitchType: 'CH', velocity: 88.0, spinRate: 1720, usage: 18, whiffRate: 22.1, putawayRate: 15.5, grade: 'B' },
          { pitchType: 'CB', velocity: 80.2, spinRate: 2850, usage: 12, whiffRate: 28.8, putawayRate: 20.1, grade: 'B+' },
        ],
      },
      {
        pitcherName: 'Greg Thornton', role: 'SP', throws: 'R', bestPitch: 'SI', worstPitch: 'CB', arsenalGrade: 'B',
        pitches: [
          { pitchType: 'SI', velocity: 93.5, spinRate: 2150, usage: 38, whiffRate: 18.5, putawayRate: 12.8, grade: 'B+' },
          { pitchType: 'FF', velocity: 94.0, spinRate: 2280, usage: 22, whiffRate: 21.2, putawayRate: 14.5, grade: 'B' },
          { pitchType: 'CB', velocity: 80.5, spinRate: 2700, usage: 22, whiffRate: 25.5, putawayRate: 18.2, grade: 'B-' },
          { pitchType: 'CH', velocity: 85.2, spinRate: 1680, usage: 18, whiffRate: 20.8, putawayRate: 14.0, grade: 'C+' },
        ],
      },
      {
        pitcherName: 'Marcus Rivera', role: 'RP', throws: 'L', bestPitch: 'SL', worstPitch: 'FF', arsenalGrade: 'B+',
        pitches: [
          { pitchType: 'FF', velocity: 94.8, spinRate: 2420, usage: 45, whiffRate: 24.0, putawayRate: 16.5, grade: 'B' },
          { pitchType: 'SL', velocity: 85.5, spinRate: 2780, usage: 40, whiffRate: 38.5, putawayRate: 28.2, grade: 'A' },
          { pitchType: 'CH', velocity: 86.0, spinRate: 1650, usage: 15, whiffRate: 22.5, putawayRate: 15.0, grade: 'B-' },
        ],
      },
      {
        pitcherName: 'Colton Braithwaite', role: 'CL', throws: 'R', bestPitch: 'FF', worstPitch: 'SL', arsenalGrade: 'A',
        pitches: [
          { pitchType: 'FF', velocity: 98.5, spinRate: 2520, usage: 55, whiffRate: 32.0, putawayRate: 22.5, grade: 'A+' },
          { pitchType: 'SL', velocity: 89.0, spinRate: 2850, usage: 35, whiffRate: 42.5, putawayRate: 32.0, grade: 'A' },
          { pitchType: 'CH', velocity: 90.0, spinRate: 1750, usage: 10, whiffRate: 25.0, putawayRate: 18.0, grade: 'B' },
        ],
      },
    ],
  };
}
