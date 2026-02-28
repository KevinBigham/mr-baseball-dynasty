// Scouting Trip Planner — schedule and track scouting assignments across levels

export type ScoutLevel = 'MLB' | 'AAA' | 'AA' | 'A+' | 'A' | 'Complex' | 'International';

export interface ScoutTarget {
  playerId: string;
  name: string;
  position: string;
  age: number;
  level: ScoutLevel;
  currentGrade: number;
  priority: 'high' | 'medium' | 'low';
  lastScouted: string;       // date
  daysSinceLastScout: number;
  notes: string;
}

export interface ScoutTrip {
  tripId: string;
  scoutName: string;
  destination: string;
  level: ScoutLevel;
  startDate: string;
  endDate: string;
  durationDays: number;
  targets: ScoutTarget[];
  estimatedCost: number;
  status: 'planned' | 'in-progress' | 'completed';
  gamesObserved: number;
}

export interface ScoutTripPlannerData {
  totalBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  activeScouts: number;
  trips: ScoutTrip[];
  upcomingTargets: ScoutTarget[];  // high-priority unscouted
}

export function getTripStatusColor(status: ScoutTrip['status']): string {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in-progress': return '#f59e0b';
    case 'planned': return '#3b82f6';
  }
}

export function getPriorityColor(priority: ScoutTarget['priority']): string {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#6b7280';
  }
}

export function generateDemoScoutTrips(): ScoutTripPlannerData {
  const trips: ScoutTrip[] = [
    {
      tripId: 'T1', scoutName: 'Mike Elias', destination: 'Bowie, MD', level: 'AA',
      startDate: 'Jun 15', endDate: 'Jun 22', durationDays: 7,
      targets: [
        { playerId: 'P1', name: 'Jackson Holliday', position: 'SS', age: 20, level: 'AA', currentGrade: 72, priority: 'high', lastScouted: 'Apr 10', daysSinceLastScout: 66, notes: 'Plus hit tool, evaluate arm strength' },
        { playerId: 'P2', name: 'Coby Mayo', position: '3B', age: 21, level: 'AA', currentGrade: 65, priority: 'medium', lastScouted: 'May 2', daysSinceLastScout: 44, notes: 'Raw power tool needs evaluation' },
      ],
      estimatedCost: 4200, status: 'planned', gamesObserved: 0,
    },
    {
      tripId: 'T2', scoutName: 'Phil Nevin', destination: 'Norfolk, VA', level: 'AAA',
      startDate: 'Jun 10', endDate: 'Jun 14', durationDays: 4,
      targets: [
        { playerId: 'P3', name: 'Heston Kjerstad', position: 'RF', age: 24, level: 'AAA', currentGrade: 60, priority: 'high', lastScouted: 'May 25', daysSinceLastScout: 16, notes: 'ML-ready bat, evaluate defense' },
      ],
      estimatedCost: 2800, status: 'in-progress', gamesObserved: 3,
    },
    {
      tripId: 'T3', scoutName: 'Gary Rajsich', destination: 'Dominican Republic', level: 'International',
      startDate: 'May 20', endDate: 'Jun 3', durationDays: 14,
      targets: [
        { playerId: 'P4', name: 'Luis Guerrero', position: 'SS', age: 17, level: 'International', currentGrade: 55, priority: 'high', lastScouted: 'Feb 12', daysSinceLastScout: 128, notes: 'Top J2 target, premium tools' },
        { playerId: 'P5', name: 'Carlos De La Cruz', position: 'OF', age: 16, level: 'International', currentGrade: 50, priority: 'medium', lastScouted: 'Mar 1', daysSinceLastScout: 111, notes: 'Projectable frame, raw speed' },
        { playerId: 'P6', name: 'Miguel Batista', position: 'RHP', age: 17, level: 'International', currentGrade: 52, priority: 'medium', lastScouted: 'Jan 20', daysSinceLastScout: 151, notes: 'Live arm, low 90s already' },
      ],
      estimatedCost: 12500, status: 'completed', gamesObserved: 11,
    },
    {
      tripId: 'T4', scoutName: 'Dave Littlefield', destination: 'Delmarva, MD', level: 'A',
      startDate: 'Jun 18', endDate: 'Jun 21', durationDays: 3,
      targets: [
        { playerId: 'P7', name: 'Dylan Beavers', position: 'OF', age: 22, level: 'A', currentGrade: 55, priority: 'low', lastScouted: 'May 10', daysSinceLastScout: 39, notes: 'Bat speed tool, struggles vs LHP' },
      ],
      estimatedCost: 1800, status: 'planned', gamesObserved: 0,
    },
    {
      tripId: 'T5', scoutName: 'Mike Elias', destination: 'Frisco, TX', level: 'AA',
      startDate: 'May 28', endDate: 'Jun 2', durationDays: 5,
      targets: [
        { playerId: 'P8', name: 'Wyatt Langford', position: 'OF', age: 22, level: 'AA', currentGrade: 68, priority: 'high', lastScouted: 'Apr 22', daysSinceLastScout: 47, notes: 'Fast mover, plus arm and bat' },
        { playerId: 'P9', name: 'Justin Foscue', position: '2B', age: 24, level: 'AA', currentGrade: 58, priority: 'medium', lastScouted: 'Mar 15', daysSinceLastScout: 85, notes: 'Average tools across the board' },
      ],
      estimatedCost: 3800, status: 'completed', gamesObserved: 5,
    },
  ];

  const upcomingTargets: ScoutTarget[] = [
    { playerId: 'P10', name: 'Sebastian Walcott', position: 'SS', age: 18, level: 'A', currentGrade: 62, priority: 'high', lastScouted: 'Apr 1', daysSinceLastScout: 70, notes: 'Premium tools, needs updated look' },
    { playerId: 'P11', name: 'Termarr Johnson', position: '2B', age: 20, level: 'A+', currentGrade: 60, priority: 'high', lastScouted: 'Mar 20', daysSinceLastScout: 82, notes: 'Elite bat speed, defensive concerns' },
    { playerId: 'P12', name: 'Max Clark', position: 'OF', age: 19, level: 'A', currentGrade: 63, priority: 'high', lastScouted: 'Apr 15', daysSinceLastScout: 56, notes: 'Plus-plus speed, bat developing' },
  ];

  return {
    totalBudget: 150000,
    budgetUsed: 25100,
    budgetRemaining: 124900,
    activeScouts: 4,
    trips,
    upcomingTargets,
  };
}
