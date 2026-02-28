// ── Minor League Standings Tracker ───────────────────────────────
// Tracks affiliate standings, records, and playoff contention

export interface MiLBTeam {
  level: string;              // AAA, AA, A+, A
  teamName: string;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number;
  streak: string;
  lastTen: string;
  playoffContention: 'clinched' | 'in hunt' | 'eliminated' | 'leading';
  topProspect: string;
  notablePerformance: string;
}

export interface MiLBStandingsData {
  parentTeam: string;
  affiliates: MiLBTeam[];
  systemWinPct: number;
  promotions: { playerName: string; from: string; to: string; date: string }[];
  rehabAssignments: { playerName: string; level: string; status: string }[];
}

export function getContColor(cont: string): string {
  if (cont === 'clinched' || cont === 'leading') return '#22c55e';
  if (cont === 'in hunt') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoMiLBStandings(): MiLBStandingsData {
  return {
    parentTeam: 'San Francisco Giants',
    systemWinPct: 0.545,
    affiliates: [
      {
        level: 'AAA',
        teamName: 'Sacramento River Cats',
        wins: 52,
        losses: 38,
        winPct: 0.578,
        gamesBack: 0,
        streak: 'W4',
        lastTen: '7-3',
        playoffContention: 'leading',
        topProspect: 'Ryan Whitaker',
        notablePerformance: 'Whitaker: 8-3, 2.85 ERA in 18 starts',
      },
      {
        level: 'AA',
        teamName: 'Richmond Flying Squirrels',
        wins: 48,
        losses: 42,
        winPct: 0.533,
        gamesBack: 3.5,
        streak: 'L2',
        lastTen: '5-5',
        playoffContention: 'in hunt',
        topProspect: 'Julio Herrera',
        notablePerformance: 'Herrera: .295/.365/.475 with 14 HR, 22 SB',
      },
      {
        level: 'A+',
        teamName: 'Eugene Emeralds',
        wins: 45,
        losses: 45,
        winPct: 0.500,
        gamesBack: 8.0,
        streak: 'W1',
        lastTen: '4-6',
        playoffContention: 'eliminated',
        topProspect: 'Devon Jackson',
        notablePerformance: 'Jackson: .248 but 22 HR with 65 RBI — raw power',
      },
      {
        level: 'A',
        teamName: 'San Jose Giants',
        wins: 55,
        losses: 35,
        winPct: 0.611,
        gamesBack: 0,
        streak: 'W6',
        lastTen: '8-2',
        playoffContention: 'clinched',
        topProspect: 'Lucas Ortiz',
        notablePerformance: 'Ortiz: 10-1, 1.95 ERA — dominant LHP prospect',
      },
    ],
    promotions: [
      { playerName: 'Miguel Santos', from: 'AA', to: 'AAA', date: 'Jun 15' },
      { playerName: 'Tyler Kim', from: 'A+', to: 'AA', date: 'Jul 2' },
      { playerName: 'Jake Williams', from: 'A', to: 'A+', date: 'Jun 28' },
    ],
    rehabAssignments: [
      { playerName: 'Chris Nakamura', level: 'AAA', status: 'Day 3 of 5 — ready to return' },
      { playerName: 'Sean Manaea', level: 'AAA', status: 'Rehab start scheduled tomorrow' },
    ],
  };
}
