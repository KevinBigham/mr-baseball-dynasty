// Team Chemistry Web — relationship network between players

export interface ChemistryLink {
  player1: string;
  player2: string;
  strength: number;       // -100 to 100
  type: 'mentor' | 'rival' | 'friend' | 'neutral' | 'tension';
  reason: string;
}

export interface ChemistryNode {
  name: string;
  position: string;
  chemScore: number;      // -100 to 100 individual chemistry contribution
  connections: number;
  role: 'leader' | 'connector' | 'loner' | 'disruptor' | 'glue-guy';
}

export interface ChemistryWebData {
  teamName: string;
  overallChemistry: number;
  chemGrade: string;
  nodes: ChemistryNode[];
  links: ChemistryLink[];
}

export function getLinkColor(type: string): string {
  if (type === 'mentor') return '#3b82f6';
  if (type === 'friend') return '#22c55e';
  if (type === 'rival') return '#ef4444';
  if (type === 'tension') return '#f59e0b';
  return '#6b7280';
}

export function getRoleColor(role: string): string {
  if (role === 'leader') return '#f59e0b';
  if (role === 'connector') return '#22c55e';
  if (role === 'glue-guy') return '#3b82f6';
  if (role === 'disruptor') return '#ef4444';
  return '#6b7280';
}

export function generateDemoChemistryWeb(): ChemistryWebData {
  return {
    teamName: 'San Francisco Giants',
    overallChemistry: 74,
    chemGrade: 'B+',
    nodes: [
      { name: 'Carlos Delgado Jr.', position: 'DH', chemScore: 85, connections: 5, role: 'leader' },
      { name: 'Jaylen Torres', position: 'SS', chemScore: 78, connections: 4, role: 'connector' },
      { name: 'Marcus Webb', position: 'CF', chemScore: 82, connections: 5, role: 'glue-guy' },
      { name: 'Ricky Sandoval', position: '2B', chemScore: 72, connections: 3, role: 'connector' },
      { name: 'Greg Thornton', position: 'SP', chemScore: 55, connections: 2, role: 'loner' },
      { name: 'Victor Robles III', position: 'RF', chemScore: 48, connections: 3, role: 'disruptor' },
      { name: 'Javier Castillo', position: 'SP', chemScore: 68, connections: 3, role: 'connector' },
      { name: 'Tomas Herrera', position: '3B', chemScore: 65, connections: 2, role: 'neutral' },
    ],
    links: [
      { player1: 'Carlos Delgado Jr.', player2: 'Jaylen Torres', strength: 82, type: 'friend', reason: 'Dominican heritage bond, workout partners' },
      { player1: 'Carlos Delgado Jr.', player2: 'Marcus Webb', strength: 75, type: 'friend', reason: 'Shared draft class, mutual respect' },
      { player1: 'Marcus Webb', player2: 'Ricky Sandoval', strength: 68, type: 'friend', reason: 'Up-the-middle chemistry, double play partners' },
      { player1: 'Greg Thornton', player2: 'Javier Castillo', strength: 72, type: 'mentor', reason: 'Veteran pitcher mentoring young ace' },
      { player1: 'Victor Robles III', player2: 'Tomas Herrera', strength: -25, type: 'tension', reason: 'Competing for lineup spot, public disagreement' },
      { player1: 'Carlos Delgado Jr.', player2: 'Victor Robles III', strength: -15, type: 'rival', reason: 'Both want cleanup spot, competitive friction' },
      { player1: 'Jaylen Torres', player2: 'Ricky Sandoval', strength: 55, type: 'friend', reason: 'Middle infield combo, complementary styles' },
      { player1: 'Marcus Webb', player2: 'Javier Castillo', strength: 45, type: 'friend', reason: 'Castillo appreciates Webb\'s outfield defense' },
    ],
  };
}
