// Runner Advancement Model — model baserunner advancement probabilities

export interface AdvancementScenario {
  situation: string;       // e.g. "Runner on 1st, single to RF"
  runner: string;
  speed: number;           // 20-80 scale
  outfielderArm: number;   // 20-80 scale
  advancePct: number;      // probability of advancing extra base
  scorePct: number;        // probability of scoring
  outPct: number;          // probability of being thrown out
  recommendation: 'send' | 'hold' | 'aggressive' | 'conservative';
}

export interface RunnerAdvPlayer {
  name: string;
  position: string;
  speed: number;
  baserunningIQ: number;   // 0-100
  extraBasesTaken: number;
  extraBasesOpps: number;
  successRate: number;
  timesThrown: number;
}

export interface RunnerAdvancementData {
  teamName: string;
  teamExtraBaseRate: number;
  teamAdvRank: number;
  scenarios: AdvancementScenario[];
  players: RunnerAdvPlayer[];
}

export function getAdvRecColor(rec: string): string {
  if (rec === 'send') return '#22c55e';
  if (rec === 'aggressive') return '#3b82f6';
  if (rec === 'conservative') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoRunnerAdvancement(): RunnerAdvancementData {
  return {
    teamName: 'San Francisco Giants',
    teamExtraBaseRate: .428,
    teamAdvRank: 11,
    scenarios: [
      { situation: 'Runner on 1st, single to RF', runner: 'Jaylen Torres', speed: 65, outfielderArm: 60, advancePct: 72, scorePct: 0, outPct: 8, recommendation: 'send' },
      { situation: 'Runner on 2nd, single to CF', runner: 'Marcus Webb', speed: 70, outfielderArm: 55, advancePct: 85, scorePct: 85, outPct: 5, recommendation: 'send' },
      { situation: 'Runner on 1st, double to LF gap', runner: 'Carlos Delgado Jr.', speed: 35, outfielderArm: 50, advancePct: 45, scorePct: 45, outPct: 22, recommendation: 'hold' },
      { situation: 'Runner on 2nd, single to RF', runner: 'Danny Okoye', speed: 30, outfielderArm: 65, advancePct: 35, scorePct: 35, outPct: 28, recommendation: 'hold' },
      { situation: 'Runner on 1st, single to LF', runner: 'Andre Flowers', speed: 60, outfielderArm: 45, advancePct: 68, scorePct: 0, outPct: 10, recommendation: 'aggressive' },
    ],
    players: [
      { name: 'Jaylen Torres', position: 'SS', speed: 65, baserunningIQ: 82, extraBasesTaken: 28, extraBasesOpps: 55, successRate: 90, timesThrown: 3 },
      { name: 'Marcus Webb', position: 'CF', speed: 70, baserunningIQ: 75, extraBasesTaken: 32, extraBasesOpps: 60, successRate: 88, timesThrown: 4 },
      { name: 'Andre Flowers', position: 'LF', speed: 60, baserunningIQ: 68, extraBasesTaken: 18, extraBasesOpps: 38, successRate: 82, timesThrown: 4 },
      { name: 'Carlos Delgado Jr.', position: 'DH', speed: 35, baserunningIQ: 55, extraBasesTaken: 8, extraBasesOpps: 32, successRate: 72, timesThrown: 3 },
      { name: 'Danny Okoye', position: '1B', speed: 30, baserunningIQ: 45, extraBasesTaken: 5, extraBasesOpps: 28, successRate: 62, timesThrown: 3 },
    ],
  };
}
