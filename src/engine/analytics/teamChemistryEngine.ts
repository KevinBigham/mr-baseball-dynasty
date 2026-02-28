// ── Team Chemistry Engine ────────────────────────────────────────
// Models player relationships, clubhouse chemistry, and morale impact

export interface PlayerRelationship {
  player1: string;
  player2: string;
  relationship: 'best friends' | 'good' | 'neutral' | 'tension' | 'conflict';
  chemBonus: number;       // -5 to +5
  reason: string;
}

export interface ClubhouseLeader {
  playerName: string;
  leadershipType: string;
  influence: number;       // 0-100
  effect: string;
}

export interface ChemistryEvent {
  date: string;
  event: string;
  impact: 'positive' | 'negative' | 'neutral';
  chemChange: number;
}

export interface TeamChemistryData {
  teamName: string;
  overallChemistry: number;    // 0-100
  chemistryGrade: string;
  leagueRank: number;
  performanceBoost: number;    // wins added/lost
  relationships: PlayerRelationship[];
  leaders: ClubhouseLeader[];
  recentEvents: ChemistryEvent[];
  cliques: { name: string; members: string[]; vibe: string }[];
}

export function getChemColor(chem: number): string {
  if (chem >= 80) return '#22c55e';
  if (chem >= 60) return '#3b82f6';
  if (chem >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getRelColor(rel: string): string {
  if (rel === 'best friends') return '#22c55e';
  if (rel === 'good') return '#3b82f6';
  if (rel === 'neutral') return '#9ca3af';
  if (rel === 'tension') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoTeamChemistry(): TeamChemistryData {
  return {
    teamName: 'San Francisco Giants',
    overallChemistry: 78,
    chemistryGrade: 'B+',
    leagueRank: 6,
    performanceBoost: 2.5,
    relationships: [
      { player1: 'Marcus Webb', player2: 'Julio Herrera', relationship: 'best friends', chemBonus: 5, reason: 'Dominican connection; workout partners since minors' },
      { player1: 'Alejandro Vega', player2: 'Miguel Santos', relationship: 'good', chemBonus: 3, reason: 'Battery chemistry; trust built over 2 seasons' },
      { player1: 'Carlos Delgado Jr.', player2: 'Terrence Baylor', relationship: 'good', chemBonus: 2, reason: 'Veteran mentorship; Delgado coaches Baylor on approach' },
      { player1: 'Brandon Crawford', player2: 'Derek Palmer', relationship: 'tension', chemBonus: -2, reason: 'Playing time dispute; Crawford unhappy with reduced role' },
      { player1: 'Ryan Walker', player2: 'Tyler Rogers', relationship: 'neutral', chemBonus: 0, reason: 'Professional but distant; compete for same setup role' },
    ],
    leaders: [
      { playerName: 'Marcus Webb', leadershipType: 'Vocal Leader', influence: 92, effect: '+3% team OPS when Webb is in lineup' },
      { playerName: 'Alejandro Vega', leadershipType: 'Lead by Example', influence: 85, effect: 'Rotation ERA 0.3 lower when Vega starts day before' },
      { playerName: 'Carlos Delgado Jr.', leadershipType: 'Veteran Mentor', influence: 78, effect: 'Young hitters BA +.015 in games Delgado plays' },
      { playerName: 'Camilo Doval', leadershipType: 'Bullpen Captain', influence: 80, effect: 'Relief ERA 0.5 lower when Doval is closing' },
    ],
    recentEvents: [
      { date: 'Jul 12', event: 'Walk-off win celebration — team bonding moment', impact: 'positive', chemChange: 3 },
      { date: 'Jul 10', event: 'Losing streak reaches 3 — some finger-pointing', impact: 'negative', chemChange: -2 },
      { date: 'Jul 8', event: 'Team BBQ organized by Webb — full attendance', impact: 'positive', chemChange: 4 },
      { date: 'Jul 5', event: 'Crawford benched — visible frustration', impact: 'negative', chemChange: -3 },
      { date: 'Jul 3', event: 'Herrera callup — warm welcome from veterans', impact: 'positive', chemChange: 2 },
    ],
    cliques: [
      { name: 'Latin Connection', members: ['Marcus Webb', 'Julio Herrera', 'Alejandro Vega', 'Camilo Doval'], vibe: 'Tight-knit; energetic; positive locker room presence' },
      { name: 'Veterans Club', members: ['Brandon Crawford', 'Carlos Delgado Jr.', 'Derek Palmer'], vibe: 'Experienced; some tension with younger players getting time' },
      { name: 'Young Guns', members: ['Ryan Whitaker', 'Devon Jackson', 'Miguel Santos'], vibe: 'Hungry and eager; bonding through minor league experience' },
    ],
  };
}
