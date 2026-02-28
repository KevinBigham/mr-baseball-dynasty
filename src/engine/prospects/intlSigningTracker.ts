// ── International Signing Tracker ────────────────────────────────
// Tracks international free agent signings, budgets, and prospects

export interface IntlSignee {
  playerName: string;
  position: string;
  age: number;
  country: string;
  signingBonus: number;     // millions
  overallGrade: number;     // 20-80
  keyTool: string;
  scoutingSummary: string;
  eta: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface IntlBudget {
  totalPool: number;         // millions
  spent: number;
  remaining: number;
  bonusSlots: number;
  tradedIn: number;
  tradedOut: number;
}

export interface IntlRegion {
  region: string;
  prospects: number;
  avgGrade: number;
  topTarget: string;
}

export interface IntlSigningData {
  teamName: string;
  signingPeriod: string;
  budget: IntlBudget;
  signees: IntlSignee[];
  topTargets: IntlSignee[];
  regions: IntlRegion[];
}

export function getGradeColorIntl(grade: number): string {
  if (grade >= 60) return '#22c55e';
  if (grade >= 50) return '#3b82f6';
  if (grade >= 45) return '#f59e0b';
  return '#ef4444';
}

export function generateDemoIntlSigning(): IntlSigningData {
  return {
    teamName: 'San Francisco Giants',
    signingPeriod: 'January 15, 2027',
    budget: {
      totalPool: 5.8,
      spent: 3.2,
      remaining: 2.6,
      bonusSlots: 20,
      tradedIn: 0.5,
      tradedOut: 0,
    },
    signees: [
      { playerName: 'Luis Ramirez', position: 'SS', age: 16, country: 'Dominican Republic', signingBonus: 1.8, overallGrade: 55, keyTool: 'Plus bat speed', scoutingSummary: 'Advanced approach for age; projects as plus hitter with developing power', eta: '2030', riskLevel: 'medium' },
      { playerName: 'Yohan Castillo', position: 'RHP', age: 17, country: 'Venezuela', signingBonus: 0.8, overallGrade: 50, keyTool: '95 mph fastball', scoutingSummary: 'Electric arm; needs polish. Slider shows plus potential but inconsistent', eta: '2030', riskLevel: 'high' },
      { playerName: 'Kenji Tanaka', position: 'OF', age: 16, country: 'Japan', signingBonus: 0.4, overallGrade: 45, keyTool: 'Plus speed & defense', scoutingSummary: 'Toolsy CF with above-avg speed and arm. Bat needs development.', eta: '2031', riskLevel: 'high' },
      { playerName: 'Pedro Medina', position: 'C', age: 17, country: 'Colombia', signingBonus: 0.2, overallGrade: 45, keyTool: 'Strong arm (1.85 pop)', scoutingSummary: 'Defensive catcher; receiving skills advanced. Bat is a project.', eta: '2031', riskLevel: 'medium' },
    ],
    topTargets: [
      { playerName: 'Rafael Torres', position: 'SS', age: 16, country: 'Dominican Republic', signingBonus: 2.0, overallGrade: 60, keyTool: '80-grade speed', scoutingSummary: 'Top J2 prospect in class; elite speed tool with projectable frame', eta: '2030', riskLevel: 'low' },
      { playerName: 'Santiago Alvarez', position: 'OF', age: 16, country: 'Cuba', signingBonus: 1.5, overallGrade: 55, keyTool: 'Plus raw power', scoutingSummary: 'Big, physical OF with legitimate 30+ HR power projection', eta: '2030', riskLevel: 'medium' },
    ],
    regions: [
      { region: 'Dominican Republic', prospects: 8, avgGrade: 48, topTarget: 'Luis Ramirez (55)' },
      { region: 'Venezuela', prospects: 5, avgGrade: 45, topTarget: 'Yohan Castillo (50)' },
      { region: 'Cuba', prospects: 2, avgGrade: 50, topTarget: 'Santiago Alvarez (55)' },
      { region: 'Japan/Korea', prospects: 3, avgGrade: 42, topTarget: 'Kenji Tanaka (45)' },
      { region: 'Central America', prospects: 4, avgGrade: 40, topTarget: 'Pedro Medina (45)' },
    ],
  };
}
