// Injury Recovery Timeline — track rehab milestones and projected return dates

export type RehabPhase = 'acute' | 'rehab' | 'conditioning' | 'minor-league' | 'ready';

export interface RehabMilestone {
  date: string;
  description: string;
  phase: RehabPhase;
  completed: boolean;
}

export interface InjuredPlayer {
  playerId: string;
  name: string;
  position: string;
  injury: string;
  severity: 'minor' | 'moderate' | 'severe';
  injuryDate: string;
  projectedReturn: string;
  daysOut: number;
  daysRemaining: number;
  currentPhase: RehabPhase;
  progressPct: number;         // 0-100
  milestones: RehabMilestone[];
  setbackRisk: number;          // 0-100
  replacementWAR: number;       // replacement's WAR while out
}

export interface InjuryRecoveryData {
  injured: InjuredPlayer[];
  totalWARLost: number;
  ilStints: number;
}

export function getPhaseColor(phase: RehabPhase): string {
  switch (phase) {
    case 'acute': return '#ef4444';
    case 'rehab': return '#f59e0b';
    case 'conditioning': return '#3b82f6';
    case 'minor-league': return '#8b5cf6';
    case 'ready': return '#22c55e';
  }
}

export function getSeverityColor(severity: InjuredPlayer['severity']): string {
  switch (severity) {
    case 'minor': return '#f59e0b';
    case 'moderate': return '#ef4444';
    case 'severe': return '#dc2626';
  }
}

export function generateDemoInjuryRecovery(): InjuryRecoveryData {
  const injured: InjuredPlayer[] = [
    {
      playerId: 'I1', name: 'Anthony Santander', position: 'RF', injury: 'Oblique Strain',
      severity: 'moderate', injuryDate: 'Jun 5', projectedReturn: 'Jul 8', daysOut: 22, daysRemaining: 12,
      currentPhase: 'conditioning', progressPct: 65, setbackRisk: 18, replacementWAR: 0.1,
      milestones: [
        { date: 'Jun 5', description: 'Placed on 15-day IL', phase: 'acute', completed: true },
        { date: 'Jun 8', description: 'Began light stretching', phase: 'acute', completed: true },
        { date: 'Jun 12', description: 'Started dry swings', phase: 'rehab', completed: true },
        { date: 'Jun 16', description: 'Batting cage work', phase: 'rehab', completed: true },
        { date: 'Jun 20', description: 'Simulated at-bats', phase: 'conditioning', completed: true },
        { date: 'Jun 25', description: 'Live BP sessions', phase: 'conditioning', completed: false },
        { date: 'Jul 1', description: 'MiLB rehab assignment', phase: 'minor-league', completed: false },
        { date: 'Jul 8', description: 'Activation target', phase: 'ready', completed: false },
      ],
    },
    {
      playerId: 'I2', name: 'Kyle Bradish', position: 'SP', injury: 'UCL Sprain',
      severity: 'severe', injuryDate: 'Apr 18', projectedReturn: 'Sep 1', daysOut: 75, daysRemaining: 65,
      currentPhase: 'rehab', progressPct: 35, setbackRisk: 32, replacementWAR: -0.3,
      milestones: [
        { date: 'Apr 18', description: 'Placed on 60-day IL', phase: 'acute', completed: true },
        { date: 'Apr 30', description: 'PRP injection', phase: 'acute', completed: true },
        { date: 'May 15', description: 'Started throwing program', phase: 'rehab', completed: true },
        { date: 'Jun 1', description: 'Long toss to 120ft', phase: 'rehab', completed: true },
        { date: 'Jun 20', description: 'Mound sessions begin', phase: 'rehab', completed: false },
        { date: 'Jul 10', description: 'Simulated games', phase: 'conditioning', completed: false },
        { date: 'Jul 25', description: 'Minor league starts', phase: 'minor-league', completed: false },
        { date: 'Aug 15', description: 'Build to 80+ pitches', phase: 'minor-league', completed: false },
        { date: 'Sep 1', description: 'Activation target', phase: 'ready', completed: false },
      ],
    },
    {
      playerId: 'I3', name: 'Jorge Mateo', position: 'SS', injury: 'Hamstring Strain',
      severity: 'minor', injuryDate: 'Jun 18', projectedReturn: 'Jun 30', daysOut: 8, daysRemaining: 4,
      currentPhase: 'conditioning', progressPct: 82, setbackRisk: 10, replacementWAR: 0.0,
      milestones: [
        { date: 'Jun 18', description: 'Placed on 10-day IL', phase: 'acute', completed: true },
        { date: 'Jun 20', description: 'Light running', phase: 'rehab', completed: true },
        { date: 'Jun 22', description: 'Full sprinting', phase: 'conditioning', completed: true },
        { date: 'Jun 25', description: 'Fielding drills', phase: 'conditioning', completed: true },
        { date: 'Jun 28', description: 'Full workouts', phase: 'conditioning', completed: false },
        { date: 'Jun 30', description: 'Activation target', phase: 'ready', completed: false },
      ],
    },
    {
      playerId: 'I4', name: 'John Means', position: 'SP', injury: 'Tommy John Recovery',
      severity: 'severe', injuryDate: 'Mar 2024', projectedReturn: 'Jul 15', daysOut: 450, daysRemaining: 19,
      currentPhase: 'minor-league', progressPct: 92, setbackRisk: 15, replacementWAR: 0.0,
      milestones: [
        { date: 'Mar 2024', description: 'UCL reconstruction', phase: 'acute', completed: true },
        { date: 'Sep 2024', description: 'Resumed throwing', phase: 'rehab', completed: true },
        { date: 'Jan 2025', description: 'Mound work resumed', phase: 'rehab', completed: true },
        { date: 'Apr 2025', description: 'Simulated games', phase: 'conditioning', completed: true },
        { date: 'May 2025', description: 'Minor league starts', phase: 'minor-league', completed: true },
        { date: 'Jun 2025', description: '5 innings / 75 pitches', phase: 'minor-league', completed: true },
        { date: 'Jul 1', description: 'Cleared for 90+ pitches', phase: 'minor-league', completed: false },
        { date: 'Jul 15', description: 'Activation target', phase: 'ready', completed: false },
      ],
    },
  ];

  return {
    injured,
    totalWARLost: 4.2,
    ilStints: 9,
  };
}
