// Win Probability Chart — track win probability swings during a game

export interface WPEvent {
  inning: number;
  halfInning: 'top' | 'bottom';
  event: string;
  wpBefore: number;       // 0-100
  wpAfter: number;        // 0-100
  wpDelta: number;
  leverage: number;       // leverage index
  player: string;
}

export interface WinProbabilityData {
  teamName: string;
  opponent: string;
  finalScore: string;
  result: 'W' | 'L';
  highPoint: number;
  lowPoint: number;
  biggestSwing: number;
  events: WPEvent[];
}

export function getWPColor(wp: number): string {
  if (wp >= 75) return '#22c55e';
  if (wp >= 50) return '#3b82f6';
  if (wp >= 25) return '#f59e0b';
  return '#ef4444';
}

export function getDeltaColor(delta: number): string {
  if (delta >= 10) return '#22c55e';
  if (delta > 0) return '#3b82f6';
  if (delta > -10) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoWinProbability(): WinProbabilityData {
  return {
    teamName: 'San Francisco Giants',
    opponent: 'Los Angeles Dodgers',
    finalScore: '6-4',
    result: 'W',
    highPoint: 95,
    lowPoint: 22,
    biggestSwing: 28,
    events: [
      { inning: 1, halfInning: 'top', event: 'Ohtani 2-run HR', wpBefore: 50, wpAfter: 35, wpDelta: -15, leverage: 1.2, player: 'Shohei Ohtani' },
      { inning: 2, halfInning: 'bottom', event: 'Torres 2B, Webb RBI 1B', wpBefore: 35, wpAfter: 42, wpDelta: 7, leverage: 1.0, player: 'Jaylen Torres' },
      { inning: 3, halfInning: 'bottom', event: 'Delgado Jr. 3-run HR', wpBefore: 38, wpAfter: 66, wpDelta: 28, leverage: 1.8, player: 'Carlos Delgado Jr.' },
      { inning: 5, halfInning: 'top', event: 'Betts RBI double', wpBefore: 68, wpAfter: 55, wpDelta: -13, leverage: 1.5, player: 'Mookie Betts' },
      { inning: 6, halfInning: 'bottom', event: 'Robles solo HR', wpBefore: 55, wpAfter: 72, wpDelta: 17, leverage: 1.3, player: 'Victor Robles III' },
      { inning: 7, halfInning: 'bottom', event: 'Sandoval sac fly', wpBefore: 72, wpAfter: 82, wpDelta: 10, leverage: 1.1, player: 'Ricky Sandoval' },
      { inning: 8, halfInning: 'top', event: 'Freeman BB, Muncy K', wpBefore: 82, wpAfter: 85, wpDelta: 3, leverage: 2.2, player: 'Freddie Freeman' },
      { inning: 9, halfInning: 'top', event: 'Braithwaite 1-2-3 save', wpBefore: 88, wpAfter: 95, wpDelta: 7, leverage: 2.8, player: 'Colton Braithwaite' },
    ],
  };
}
