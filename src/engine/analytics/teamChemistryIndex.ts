// Team Chemistry Index — comprehensive team chemistry scoring system
// Mr. Baseball Dynasty

export type ChemistryFactor = 'clubhouse_leadership' | 'veteran_presence' | 'winning_culture' | 'personality_mix' | 'language_diversity' | 'age_balance' | 'contract_harmony' | 'recent_success';

export interface ChemistryComponent {
  factor: ChemistryFactor;
  label: string;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  keyDrivers: string[];
}

export interface TeamChemistryProfile {
  teamId: number;
  teamName: string;
  overallIndex: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  components: ChemistryComponent[];
  leaders: { name: string; role: string; impact: number }[];
  concerns: string[];
  chemistryWAR: number; // estimated WAR impact of chemistry
}

export function generateDemoChemistryIndex(): TeamChemistryProfile[] {
  const teams = [
    { name: 'New York Navigators', id: 1 },
    { name: 'Los Angeles Stars', id: 2 },
    { name: 'Chicago Windrunners', id: 3 },
    { name: 'Houston Oilmen', id: 4 },
    { name: 'Boston Harbormasters', id: 5 },
    { name: 'Atlanta Firebirds', id: 6 },
  ];

  const factorDefs: { factor: ChemistryFactor; label: string }[] = [
    { factor: 'clubhouse_leadership', label: 'Clubhouse Leadership' },
    { factor: 'veteran_presence', label: 'Veteran Presence' },
    { factor: 'winning_culture', label: 'Winning Culture' },
    { factor: 'personality_mix', label: 'Personality Mix' },
    { factor: 'language_diversity', label: 'Language/Culture' },
    { factor: 'age_balance', label: 'Age Balance' },
    { factor: 'contract_harmony', label: 'Contract Harmony' },
    { factor: 'recent_success', label: 'Recent Success' },
  ];

  const trends: ChemistryComponent['trend'][] = ['improving', 'stable', 'declining'];
  const grades: TeamChemistryProfile['grade'][] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
  const leaderRoles = ['Captain', 'Veteran Leader', 'Glue Guy', 'Motivator', 'Mediator'];
  const driverOpts = [
    'Strong clubhouse veterans', 'Recent winning streak', 'Good mix of personalities',
    'Language bridge players', 'Fair contract distribution', 'Core group under 30',
    'Manager connects with players', 'Playoff experience', 'Homegrown core bonded',
  ];
  const concernOpts = [
    'Clubhouse divide over playing time', 'Salary disparity friction',
    'Multiple new acquisitions adjusting', 'Young roster lacks leadership',
    'Language barrier in bullpen', 'Recent losing streak affecting morale',
  ];

  return teams.map((t, i) => {
    const components: ChemistryComponent[] = factorDefs.map(fd => ({
      factor: fd.factor,
      label: fd.label,
      score: 40 + Math.floor(Math.random() * 55),
      trend: trends[Math.floor(Math.random() * 3)],
      keyDrivers: [driverOpts[Math.floor(Math.random() * driverOpts.length)]],
    }));

    const overall = Math.floor(components.reduce((s, c) => s + c.score, 0) / components.length);
    const gradeIdx = overall > 90 ? 0 : overall > 80 ? 1 : overall > 72 ? 2 : overall > 64 ? 3 : overall > 56 ? 4 : overall > 48 ? 5 : overall > 40 ? 6 : 7;

    return {
      teamId: t.id,
      teamName: t.name,
      overallIndex: overall,
      grade: grades[gradeIdx],
      components,
      leaders: Array.from({ length: 3 }, (_, j) => ({
        name: [`Marcus Rivera`, `Tyler Brooks`, `Jake Morrison`, `Carlos Delgado`, `Sam Whitfield`][Math.floor(Math.random() * 5)],
        role: leaderRoles[j % leaderRoles.length],
        impact: +(5 + Math.random() * 15).toFixed(1),
      })),
      concerns: Array.from({ length: Math.floor(Math.random() * 3) }, () =>
        concernOpts[Math.floor(Math.random() * concernOpts.length)]
      ),
      chemistryWAR: +(-1 + Math.random() * 4).toFixed(1),
    };
  });
}
