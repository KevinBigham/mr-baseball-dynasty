// Prospect Scouting Dashboard — comprehensive scouting overview for top prospects

export interface ScoutGrade {
  tool: string;
  current: number;       // 20-80 scale
  future: number;        // 20-80 projected
  trend: 'up' | 'down' | 'flat';
}

export interface ProspectScoutEntry {
  name: string;
  position: string;
  age: number;
  level: string;
  overallFV: number;     // future value (20-80)
  eta: string;
  risk: 'low' | 'medium' | 'high' | 'extreme';
  grades: ScoutGrade[];
  summary: string;
  comp: string;          // MLB player comparison
}

export interface ProspectScoutDashData {
  teamName: string;
  systemRanking: number;
  top100Count: number;
  prospects: ProspectScoutEntry[];
}

export function getFVColor(fv: number): string {
  if (fv >= 60) return '#22c55e';
  if (fv >= 50) return '#3b82f6';
  if (fv >= 45) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoProspectScoutDash(): ProspectScoutDashData {
  return {
    teamName: 'San Francisco Giants',
    systemRanking: 8,
    top100Count: 4,
    prospects: [
      {
        name: 'Miguel Santos', position: 'SS', age: 22, level: 'AAA', overallFV: 60, eta: '2026',
        risk: 'low', comp: 'Carlos Correa',
        summary: 'Elite defender with advanced plate approach. Plus arm and instincts at short.',
        grades: [
          { tool: 'Hit', current: 55, future: 60, trend: 'up' },
          { tool: 'Power', current: 45, future: 55, trend: 'up' },
          { tool: 'Speed', current: 55, future: 50, trend: 'flat' },
          { tool: 'Field', current: 70, future: 70, trend: 'flat' },
          { tool: 'Arm', current: 65, future: 65, trend: 'flat' },
        ],
      },
      {
        name: 'Tyler Washington', position: 'OF', age: 23, level: 'AAA', overallFV: 55, eta: '2026',
        risk: 'medium', comp: 'Giancarlo Stanton (lite)',
        summary: 'Monster raw power with concerning chase rates. Could be a middle-of-the-order bat if the hit tool refines.',
        grades: [
          { tool: 'Hit', current: 40, future: 50, trend: 'up' },
          { tool: 'Power', current: 70, future: 70, trend: 'flat' },
          { tool: 'Speed', current: 50, future: 45, trend: 'down' },
          { tool: 'Field', current: 50, future: 50, trend: 'flat' },
          { tool: 'Arm', current: 60, future: 60, trend: 'flat' },
        ],
      },
      {
        name: 'Jordan Park', position: 'SP', age: 21, level: 'AA', overallFV: 55, eta: '2027',
        risk: 'high', comp: 'Nestor Cortes (with better stuff)',
        summary: 'Wipeout slider with developing changeup. Command is the question mark but the ceiling is a #2 starter.',
        grades: [
          { tool: 'Fastball', current: 55, future: 60, trend: 'up' },
          { tool: 'Slider', current: 65, future: 70, trend: 'up' },
          { tool: 'Changeup', current: 40, future: 55, trend: 'up' },
          { tool: 'Command', current: 40, future: 55, trend: 'up' },
          { tool: 'Stamina', current: 45, future: 55, trend: 'up' },
        ],
      },
      {
        name: 'Derek Liu', position: 'RP', age: 24, level: 'AAA', overallFV: 50, eta: '2026',
        risk: 'low', comp: 'Andres Munoz',
        summary: 'Electric arm out of the pen. 98 mph heat with wipeout slider. Could be a late-inning weapon immediately.',
        grades: [
          { tool: 'Fastball', current: 70, future: 70, trend: 'flat' },
          { tool: 'Slider', current: 60, future: 65, trend: 'up' },
          { tool: 'Command', current: 45, future: 50, trend: 'up' },
        ],
      },
      {
        name: 'Kai Nakamura', position: '2B', age: 19, level: 'A', overallFV: 55, eta: '2028',
        risk: 'extreme', comp: 'Jose Altuve',
        summary: 'Undersized but incredibly toolsy infielder. Advanced bat-to-ball skills with surprising pop for his frame.',
        grades: [
          { tool: 'Hit', current: 50, future: 65, trend: 'up' },
          { tool: 'Power', current: 35, future: 50, trend: 'up' },
          { tool: 'Speed', current: 60, future: 55, trend: 'flat' },
          { tool: 'Field', current: 55, future: 60, trend: 'up' },
          { tool: 'Arm', current: 50, future: 50, trend: 'flat' },
        ],
      },
    ],
  };
}
