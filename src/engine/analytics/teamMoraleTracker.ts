// Team Morale Tracker — monitor overall team morale and individual satisfaction

export interface PlayerMorale {
  name: string;
  position: string;
  morale: number;          // 0-100
  trend: 'rising' | 'falling' | 'stable';
  factors: string[];       // what's affecting morale
  riskOfIssue: boolean;
}

export interface MoraleEvent {
  date: string;
  event: string;
  impact: number;          // -20 to +20
  affectedPlayers: string[];
}

export interface TeamMoraleData {
  teamName: string;
  teamMorale: number;      // 0-100
  moraleTrend: 'rising' | 'falling' | 'stable';
  players: PlayerMorale[];
  recentEvents: MoraleEvent[];
  atRiskCount: number;
}

export function getMoraleColor(morale: number): string {
  if (morale >= 80) return '#22c55e';
  if (morale >= 60) return '#3b82f6';
  if (morale >= 40) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoTeamMorale(): TeamMoraleData {
  return {
    teamName: 'San Francisco Giants',
    teamMorale: 72,
    moraleTrend: 'rising',
    atRiskCount: 2,
    players: [
      { name: 'Carlos Delgado Jr.', position: 'DH', morale: 92, trend: 'rising', factors: ['Team winning', 'All-Star selection', 'Extension talks positive'], riskOfIssue: false },
      { name: 'Jaylen Torres', position: 'SS', morale: 78, trend: 'stable', factors: ['Playing every day', 'Wants extension'], riskOfIssue: false },
      { name: 'Marcus Webb', position: 'CF', morale: 55, trend: 'falling', factors: ['In a slump', 'Benched twice this week', 'Trade rumors'], riskOfIssue: true },
      { name: 'Greg Thornton', position: 'SP', morale: 45, trend: 'falling', factors: ['Poor recent performance', 'Moved down in rotation', 'Bullpen talk'], riskOfIssue: true },
      { name: 'Colton Braithwaite', position: 'CL', morale: 88, trend: 'rising', factors: ['Dominant saves streak', 'All-Star buzz', 'Team leader role'], riskOfIssue: false },
      { name: 'Ricky Sandoval', position: '2B', morale: 75, trend: 'stable', factors: ['Consistent playing time', 'Comfortable in clubhouse'], riskOfIssue: false },
    ],
    recentEvents: [
      { date: 'Jul 10', event: '5-game winning streak', impact: 8, affectedPlayers: ['All'] },
      { date: 'Jul 8', event: 'Thornton demoted to bullpen talk', impact: -12, affectedPlayers: ['Greg Thornton'] },
      { date: 'Jul 5', event: 'Webb benched for defensive replacement', impact: -8, affectedPlayers: ['Marcus Webb'] },
      { date: 'Jul 3', event: 'Delgado Jr. All-Star selection announced', impact: 15, affectedPlayers: ['Carlos Delgado Jr.', 'All'] },
      { date: 'Jun 28', event: 'Walk-off win vs Dodgers', impact: 10, affectedPlayers: ['All'] },
    ],
  };
}
