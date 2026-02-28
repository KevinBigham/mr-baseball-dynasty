// Minor League Development Plan — structured development goals for prospects

export interface DevGoal {
  skill: string;
  currentLevel: number;     // 0-100
  targetLevel: number;
  timeline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  drills: string[];
}

export interface ProspectDevPlan {
  name: string;
  position: string;
  age: number;
  level: 'A' | 'A+' | 'AA' | 'AAA';
  overallProgress: number;  // 0-100
  goals: DevGoal[];
  coachNotes: string;
  nextEval: string;
}

export interface MinorLeagueDevPlanData {
  teamName: string;
  prospects: ProspectDevPlan[];
  totalProspectsInPlan: number;
  onTrackCount: number;
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return '#22c55e';
  if (progress >= 60) return '#3b82f6';
  if (progress >= 40) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoMinorLeagueDevPlan(): MinorLeagueDevPlanData {
  return {
    teamName: 'San Francisco Giants',
    totalProspectsInPlan: 12,
    onTrackCount: 8,
    prospects: [
      {
        name: 'Miguel Santos', position: 'SS', age: 22, level: 'AAA', overallProgress: 85,
        nextEval: 'March 15, 2027',
        coachNotes: 'Elite defender ready for the show. Needs reps vs LHP to round out his game.',
        goals: [
          { skill: 'Hit vs LHP', currentLevel: 62, targetLevel: 75, timeline: '3 months', priority: 'critical', drills: ['Lefty BP sessions 3x/week', 'Film study on LHP tendencies'] },
          { skill: 'Power Development', currentLevel: 55, targetLevel: 65, timeline: '6 months', priority: 'high', drills: ['Weighted bat work', 'Launch angle adjustment drills'] },
          { skill: 'Baserunning IQ', currentLevel: 70, targetLevel: 80, timeline: '2 months', priority: 'medium', drills: ['Lead distance optimization', 'First-to-third reads'] },
        ],
      },
      {
        name: 'Tyler Washington', position: 'OF', age: 23, level: 'AAA', overallProgress: 68,
        nextEval: 'April 1, 2027',
        coachNotes: 'Big raw power but needs to cut chase rate significantly. Mechanical adjustments ongoing.',
        goals: [
          { skill: 'Plate Discipline', currentLevel: 45, targetLevel: 65, timeline: '4 months', priority: 'critical', drills: ['Recognition drills', 'Shortened swing approach', 'Two-strike hitting plan'] },
          { skill: 'Breaking Ball Recognition', currentLevel: 40, targetLevel: 60, timeline: '6 months', priority: 'critical', drills: ['Pitch recognition software', 'Slider-heavy BP sessions'] },
          { skill: 'OF Routes', currentLevel: 65, targetLevel: 75, timeline: '3 months', priority: 'medium', drills: ['Drop step drills', 'Wall work', 'Fly ball reads off bat'] },
        ],
      },
      {
        name: 'Jordan Park', position: 'SP', age: 21, level: 'AA', overallProgress: 52,
        nextEval: 'May 1, 2027',
        coachNotes: 'High-ceiling arm with wipeout slider. Command and stamina are the keys to his development.',
        goals: [
          { skill: 'Fastball Command', currentLevel: 52, targetLevel: 70, timeline: '8 months', priority: 'critical', drills: ['Bullpen command sessions', 'Glove-side targeting', 'Pitch tunneling work'] },
          { skill: 'Stamina Building', currentLevel: 48, targetLevel: 70, timeline: '12 months', priority: 'high', drills: ['Extended outings (80+ pitches)', 'Conditioning program', 'Pitch efficiency focus'] },
          { skill: 'Changeup Development', currentLevel: 45, targetLevel: 60, timeline: '6 months', priority: 'high', drills: ['Grip experimentation', 'Arm speed matching drills'] },
          { skill: 'Composure Under Pressure', currentLevel: 42, targetLevel: 60, timeline: '6 months', priority: 'medium', drills: ['High-leverage sim situations', 'Mental performance coaching'] },
        ],
      },
    ],
  };
}
