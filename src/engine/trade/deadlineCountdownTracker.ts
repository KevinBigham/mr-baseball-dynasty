// Trade Deadline Countdown Tracker — track deadline urgency and remaining moves

export interface DeadlineTask {
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  daysNeeded: number;
  notes: string;
}

export interface DeadlineTarget {
  playerName: string;
  team: string;
  position: string;
  askingPrice: string;
  likelihood: number;     // 0-100
  urgency: 'now' | 'soon' | 'monitor';
}

export interface DeadlineCountdownData {
  teamName: string;
  daysUntilDeadline: number;
  deadlineDate: string;
  posture: 'buyer' | 'seller' | 'stand-pat';
  budgetRemaining: number;    // millions
  tasks: DeadlineTask[];
  targets: DeadlineTarget[];
  completedDeals: number;
}

export function getPriorityColor(p: string): string {
  if (p === 'critical') return '#ef4444';
  if (p === 'high') return '#f59e0b';
  if (p === 'medium') return '#3b82f6';
  return '#6b7280';
}

export function getStatusColor(s: string): string {
  if (s === 'completed') return '#22c55e';
  if (s === 'in-progress') return '#f59e0b';
  if (s === 'blocked') return '#ef4444';
  return '#6b7280';
}

export function generateDemoDeadlineCountdown(): DeadlineCountdownData {
  return {
    teamName: 'San Francisco Giants',
    daysUntilDeadline: 18,
    deadlineDate: 'July 30, 2026',
    posture: 'buyer',
    budgetRemaining: 12.5,
    completedDeals: 1,
    tasks: [
      { task: 'Acquire setup reliever', priority: 'critical', status: 'in-progress', daysNeeded: 5, notes: 'Talking to 3 teams — CLE, MIL, CIN' },
      { task: 'Add LHP to bullpen', priority: 'high', status: 'pending', daysNeeded: 7, notes: 'Contingent on reliever deal' },
      { task: 'Find corner OF bat', priority: 'medium', status: 'in-progress', daysNeeded: 10, notes: 'Exploring rental options' },
      { task: 'Extend Jaylen Torres', priority: 'high', status: 'blocked', daysNeeded: 14, notes: 'Agent wants $180M — too high' },
      { task: 'Clear 40-man roster spot', priority: 'low', status: 'completed', daysNeeded: 0, notes: 'DFA Brandon Mitchell' },
    ],
    targets: [
      { playerName: 'Emmanuel Clase', team: 'CLE', position: 'RP', askingPrice: '2 top-15 prospects', likelihood: 45, urgency: 'now' },
      { playerName: 'Bryan Woo', team: 'SEA', position: 'SP', askingPrice: '1 top-10 + 2 lottery', likelihood: 30, urgency: 'monitor' },
      { playerName: 'Tommy Edman', team: 'STL', position: 'UTL', askingPrice: '1 mid-level prospect', likelihood: 65, urgency: 'soon' },
      { playerName: 'Andrew Chafin', team: 'DET', position: 'LRP', askingPrice: '1 A-ball arm', likelihood: 80, urgency: 'now' },
    ],
  };
}
