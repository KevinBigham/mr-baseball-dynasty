// Player Aging Projections — model performance decline curves by position

export interface AgingProfile {
  name: string;
  position: string;
  age: number;
  currentOVR: number;
  peakAge: number;
  declineRate: number;         // OVR points lost per year after peak
  projections: Array<{ age: number; ovr: number; war: number }>;
  riskLevel: 'low' | 'medium' | 'high';
  contractYearsLeft: number;
  category: 'pre-peak' | 'peak' | 'early-decline' | 'decline';
}

export interface AgingProjectionData {
  teamName: string;
  avgTeamAge: number;
  players: AgingProfile[];
}

export function getCategoryColor(cat: string): string {
  if (cat === 'pre-peak') return '#3b82f6';
  if (cat === 'peak') return '#22c55e';
  if (cat === 'early-decline') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoAgingProjections(): AgingProjectionData {
  return {
    teamName: 'San Francisco Giants',
    avgTeamAge: 28.4,
    players: [
      { name: 'Carlos Delgado Jr.', position: 'DH', age: 28, currentOVR: 88, peakAge: 28, declineRate: 2.5, projections: [{ age: 28, ovr: 88, war: 5.5 }, { age: 29, ovr: 86, war: 5.0 }, { age: 30, ovr: 84, war: 4.5 }, { age: 31, ovr: 81, war: 3.8 }, { age: 32, ovr: 78, war: 3.0 }], riskLevel: 'low', contractYearsLeft: 4, category: 'peak' },
      { name: 'Jaylen Torres', position: 'SS', age: 26, currentOVR: 82, peakAge: 28, declineRate: 2.0, projections: [{ age: 26, ovr: 82, war: 4.2 }, { age: 27, ovr: 84, war: 4.8 }, { age: 28, ovr: 86, war: 5.2 }, { age: 29, ovr: 85, war: 4.8 }, { age: 30, ovr: 83, war: 4.2 }], riskLevel: 'low', contractYearsLeft: 3, category: 'pre-peak' },
      { name: 'Greg Thornton', position: 'SP', age: 33, currentOVR: 70, peakAge: 29, declineRate: 3.0, projections: [{ age: 33, ovr: 70, war: 2.0 }, { age: 34, ovr: 67, war: 1.5 }, { age: 35, ovr: 64, war: 1.0 }], riskLevel: 'high', contractYearsLeft: 1, category: 'decline' },
      { name: 'Marcus Webb', position: 'CF', age: 27, currentOVR: 80, peakAge: 27, declineRate: 2.5, projections: [{ age: 27, ovr: 80, war: 4.0 }, { age: 28, ovr: 78, war: 3.5 }, { age: 29, ovr: 76, war: 3.0 }, { age: 30, ovr: 73, war: 2.5 }], riskLevel: 'medium', contractYearsLeft: 2, category: 'peak' },
      { name: 'Victor Robles III', position: 'RF', age: 28, currentOVR: 78, peakAge: 27, declineRate: 2.0, projections: [{ age: 28, ovr: 78, war: 3.2 }, { age: 29, ovr: 76, war: 2.8 }, { age: 30, ovr: 74, war: 2.4 }], riskLevel: 'medium', contractYearsLeft: 2, category: 'early-decline' },
      { name: 'Ricky Sandoval', position: '2B', age: 25, currentOVR: 74, peakAge: 28, declineRate: 1.5, projections: [{ age: 25, ovr: 74, war: 2.6 }, { age: 26, ovr: 76, war: 3.0 }, { age: 27, ovr: 78, war: 3.4 }, { age: 28, ovr: 80, war: 3.8 }], riskLevel: 'low', contractYearsLeft: 5, category: 'pre-peak' },
    ],
  };
}
