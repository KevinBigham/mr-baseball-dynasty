// Prospect Scouting Report Generator — in-depth scouting reports for farm system
// Mr. Baseball Dynasty

export type ToolName = 'Hit' | 'Power' | 'Speed' | 'Arm' | 'Field' | 'Fastball' | 'Breaking' | 'Changeup' | 'Command';

export interface ToolGrade {
  tool: ToolName;
  current: number; // 20-80 scale
  future: number;  // 20-80 scale
  trend: 'improving' | 'steady' | 'declining';
}

export type ReportGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';

export interface ScoutObservation {
  date: string;
  scout: string;
  note: string;
  confidence: number; // 0-100
}

export interface ProspectScoutReport {
  prospectId: number;
  name: string;
  age: number;
  position: string;
  currentLevel: string;
  overallGrade: ReportGrade;
  eta: number;
  risk: 'low' | 'medium' | 'high' | 'extreme';
  ceiling: string;
  floor: string;
  tools: ToolGrade[];
  observations: ScoutObservation[];
  summary: string;
}

export function generateDemoScoutReports(): ProspectScoutReport[] {
  const prospects = [
    { name: 'Jaylen Torres', pos: 'SS', level: 'AA', age: 21 },
    { name: 'Kenji Watanabe', pos: 'RHP', level: 'AAA', age: 23 },
    { name: 'Diego Ramirez', pos: 'CF', level: 'A+', age: 20 },
    { name: 'Caleb Thompson', pos: 'LHP', level: 'AA', age: 22 },
    { name: 'Elias Moreno', pos: '3B', level: 'A', age: 19 },
    { name: 'Ryu Nakamura', pos: 'C', level: 'AAA', age: 24 },
    { name: 'Andre Williams', pos: 'OF', level: 'A+', age: 20 },
    { name: 'Mason Clark', pos: 'RHP', level: 'AA', age: 21 },
  ];

  const grades: ReportGrade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
  const risks: Array<'low' | 'medium' | 'high' | 'extreme'> = ['low', 'medium', 'high', 'extreme'];
  const scouts = ['Bill Henderson', 'Tony Mazza', 'Carlos Vega', 'Jim O\'Brien'];
  const trends: Array<'improving' | 'steady' | 'declining'> = ['improving', 'steady', 'declining'];

  const isPitcher = (pos: string) => pos === 'RHP' || pos === 'LHP';

  return prospects.map((p, i) => {
    const toolNames: ToolName[] = isPitcher(p.pos)
      ? ['Fastball', 'Breaking', 'Changeup', 'Command', 'Field']
      : ['Hit', 'Power', 'Speed', 'Arm', 'Field'];

    const tools: ToolGrade[] = toolNames.map(tool => ({
      tool,
      current: 30 + Math.floor(Math.random() * 35),
      future: 45 + Math.floor(Math.random() * 30),
      trend: trends[Math.floor(Math.random() * 3)],
    }));

    const observations: ScoutObservation[] = Array.from({ length: 3 }, (_, j) => ({
      date: `2026-0${j + 1}-${10 + Math.floor(Math.random() * 15)}`,
      scout: scouts[Math.floor(Math.random() * scouts.length)],
      note: [
        'Quick bat, good barrel control. Needs work on breaking balls away.',
        'Electric arm, touches 98. Slider is plus. Needs third pitch.',
        'Raw power is evident in BP. Game power lags behind. Patient approach.',
        'Smooth defender with soft hands. Above-avg arm for the position.',
        'Athletic frame with projection remaining. Coachable makeup.',
        'Competitive fire stands out. Plus runner who reads pitchers well.',
      ][Math.floor(Math.random() * 6)],
      confidence: 60 + Math.floor(Math.random() * 35),
    }));

    const ceilings = ['All-Star', 'Everyday regular', 'Above-avg regular', 'Solid starter', 'Utility role', 'Ace', 'Mid-rotation SP', 'Setup man'];
    const floors = ['Bench bat', 'Org depth', 'AAAA player', 'Back-end reliever', 'Platoon bat', 'Swingman', '5th starter', 'Pinch runner'];

    return {
      prospectId: 6000 + i,
      name: p.name,
      age: p.age,
      position: p.pos,
      currentLevel: p.level,
      overallGrade: grades[i],
      eta: 2026 + Math.floor(Math.random() * 3),
      risk: risks[Math.min(i % 4, 3)],
      ceiling: ceilings[i],
      floor: floors[i],
      tools,
      observations,
      summary: `${p.name} is a ${p.age}-year-old ${p.pos} currently at ${p.level}. Projects as a ${ceilings[i].toLowerCase()} with ${floors[i].toLowerCase()} floor.`,
    };
  });
}
