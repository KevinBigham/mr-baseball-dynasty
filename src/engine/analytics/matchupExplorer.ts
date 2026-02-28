/**
 * Matchup Explorer
 *
 * Head-to-head batter vs pitcher historical matchup data.
 * Tracks at-bat outcomes, pitch tendencies in matchup,
 * advantage/disadvantage ratings, and key situational splits.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchupEdge = 'batter_dominant' | 'batter_edge' | 'even' | 'pitcher_edge' | 'pitcher_dominant';

export const EDGE_DISPLAY: Record<MatchupEdge, { label: string; color: string; emoji: string }> = {
  batter_dominant:  { label: 'Batter Dominant',  color: '#22c55e', emoji: '🟢' },
  batter_edge:     { label: 'Batter Edge',      color: '#3b82f6', emoji: '🔵' },
  even:            { label: 'Even',              color: '#eab308', emoji: '🟡' },
  pitcher_edge:    { label: 'Pitcher Edge',      color: '#f97316', emoji: '🟠' },
  pitcher_dominant: { label: 'Pitcher Dominant', color: '#ef4444', emoji: '🔴' },
};

export interface MatchupOutcome {
  abs: number;
  avg: number;
  obp: number;
  slg: number;
  hr: number;
  k: number;
  bb: number;
  rbi: number;
}

export interface PitchTendencyInMatchup {
  pitchType: string;
  usage: number;       // % thrown in this matchup
  avgVelo: number;
  whiffRate: number;
  batAvg: number;      // batting avg vs this pitch
}

export interface Matchup {
  id: number;
  batterName: string;
  batterTeam: string;
  batterPos: string;
  pitcherName: string;
  pitcherTeam: string;
  pitcherThrows: 'L' | 'R';
  edge: MatchupEdge;
  outcomes: MatchupOutcome;
  pitchTendencies: PitchTendencyInMatchup[];
  lastMeeting: string;
  sampleSize: number;
  notes: string;
}

export interface MatchupSummary {
  totalMatchups: number;
  batterDominant: number;
  pitcherDominant: number;
  evenCount: number;
  avgSampleSize: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getEdge(avg: number, ops: number): MatchupEdge {
  const score = avg * 1000 + ops * 500;
  if (score >= 1100) return 'batter_dominant';
  if (score >= 800) return 'batter_edge';
  if (score >= 550) return 'even';
  if (score >= 350) return 'pitcher_edge';
  return 'pitcher_dominant';
}

export function getMatchupSummary(matchups: Matchup[]): MatchupSummary {
  return {
    totalMatchups: matchups.length,
    batterDominant: matchups.filter(m => m.edge === 'batter_dominant' || m.edge === 'batter_edge').length,
    pitcherDominant: matchups.filter(m => m.edge === 'pitcher_dominant' || m.edge === 'pitcher_edge').length,
    evenCount: matchups.filter(m => m.edge === 'even').length,
    avgSampleSize: Math.round(matchups.reduce((s, m) => s + m.sampleSize, 0) / matchups.length),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoMatchups(): Matchup[] {
  return [
    {
      id: 0, batterName: 'Juan Soto', batterTeam: 'NYY', batterPos: 'RF',
      pitcherName: 'Gerrit Cole', pitcherTeam: 'NYY', pitcherThrows: 'R',
      edge: 'even',
      outcomes: { abs: 28, avg: .286, obp: .400, slg: .464, hr: 2, k: 5, bb: 6, rbi: 4 },
      pitchTendencies: [
        { pitchType: '4-Seam', usage: 48, avgVelo: 97.2, whiffRate: 22, batAvg: .308 },
        { pitchType: 'Slider', usage: 30, avgVelo: 88.5, whiffRate: 35, batAvg: .200 },
        { pitchType: 'Knuckle Curve', usage: 15, avgVelo: 82.0, whiffRate: 28, batAvg: .333 },
        { pitchType: 'Changeup', usage: 7, avgVelo: 90.0, whiffRate: 18, batAvg: .500 },
      ],
      lastMeeting: 'Aug 15', sampleSize: 28,
      notes: 'Soto patient vs Cole — walks at high rate. Vulnerable to slider away.',
    },
    {
      id: 1, batterName: 'Shohei Ohtani', batterTeam: 'LAD', batterPos: 'DH',
      pitcherName: 'Framber Valdez', pitcherTeam: 'HOU', pitcherThrows: 'L',
      edge: 'batter_dominant',
      outcomes: { abs: 18, avg: .389, obp: .450, slg: .778, hr: 3, k: 2, bb: 2, rbi: 7 },
      pitchTendencies: [
        { pitchType: 'Sinker', usage: 55, avgVelo: 94.0, whiffRate: 10, batAvg: .400 },
        { pitchType: 'Curveball', usage: 30, avgVelo: 82.5, whiffRate: 25, batAvg: .333 },
        { pitchType: 'Changeup', usage: 15, avgVelo: 87.0, whiffRate: 20, batAvg: .500 },
      ],
      lastMeeting: 'Jul 22', sampleSize: 18,
      notes: 'Ohtani crushes Valdez sinker. No reliable out pitch identified.',
    },
    {
      id: 2, batterName: 'Freddie Freeman', batterTeam: 'LAD', batterPos: '1B',
      pitcherName: 'Max Fried', pitcherTeam: 'ATL', pitcherThrows: 'L',
      edge: 'pitcher_edge',
      outcomes: { abs: 42, avg: .214, obp: .300, slg: .333, hr: 1, k: 10, bb: 5, rbi: 3 },
      pitchTendencies: [
        { pitchType: '4-Seam', usage: 35, avgVelo: 94.5, whiffRate: 20, batAvg: .250 },
        { pitchType: 'Curveball', usage: 35, avgVelo: 76.0, whiffRate: 38, batAvg: .143 },
        { pitchType: 'Slider', usage: 20, avgVelo: 84.0, whiffRate: 30, batAvg: .200 },
        { pitchType: 'Changeup', usage: 10, avgVelo: 86.0, whiffRate: 22, batAvg: .333 },
      ],
      lastMeeting: 'Aug 8', sampleSize: 42,
      notes: 'Fried curves dominate Freeman. LHP matchup suppresses power.',
    },
    {
      id: 3, batterName: 'Mookie Betts', batterTeam: 'LAD', batterPos: '2B',
      pitcherName: 'Zack Wheeler', pitcherTeam: 'PHI', pitcherThrows: 'R',
      edge: 'batter_edge',
      outcomes: { abs: 35, avg: .314, obp: .380, slg: .543, hr: 3, k: 6, bb: 3, rbi: 5 },
      pitchTendencies: [
        { pitchType: '4-Seam', usage: 40, avgVelo: 96.8, whiffRate: 18, batAvg: .357 },
        { pitchType: 'Slider', usage: 32, avgVelo: 87.0, whiffRate: 28, batAvg: .273 },
        { pitchType: 'Curveball', usage: 15, avgVelo: 80.0, whiffRate: 32, batAvg: .200 },
        { pitchType: 'Changeup', usage: 13, avgVelo: 89.0, whiffRate: 15, batAvg: .500 },
      ],
      lastMeeting: 'Aug 12', sampleSize: 35,
      notes: 'Betts sits fastball and adjusts. Timing Wheeler well. Curveball only out pitch.',
    },
    {
      id: 4, batterName: 'Salvador Perez', batterTeam: 'KC', batterPos: 'C',
      pitcherName: 'Dylan Cease', pitcherTeam: 'SD', pitcherThrows: 'R',
      edge: 'pitcher_dominant',
      outcomes: { abs: 22, avg: .136, obp: .167, slg: .227, hr: 0, k: 10, bb: 1, rbi: 1 },
      pitchTendencies: [
        { pitchType: '4-Seam', usage: 45, avgVelo: 96.5, whiffRate: 30, batAvg: .100 },
        { pitchType: 'Slider', usage: 35, avgVelo: 85.0, whiffRate: 45, batAvg: .125 },
        { pitchType: 'Knuckle Curve', usage: 12, avgVelo: 79.0, whiffRate: 35, batAvg: .333 },
        { pitchType: 'Changeup', usage: 8, avgVelo: 88.0, whiffRate: 20, batAvg: .000 },
      ],
      lastMeeting: 'Jul 30', sampleSize: 22,
      notes: 'Perez is completely overmatched. Chases sliders at extremely high rate.',
    },
    {
      id: 5, batterName: 'Luis Arraez', batterTeam: 'SD', batterPos: '1B',
      pitcherName: 'Spencer Strider', pitcherTeam: 'ATL', pitcherThrows: 'R',
      edge: 'even',
      outcomes: { abs: 15, avg: .267, obp: .313, slg: .333, hr: 0, k: 3, bb: 1, rbi: 2 },
      pitchTendencies: [
        { pitchType: '4-Seam', usage: 55, avgVelo: 98.0, whiffRate: 12, batAvg: .286 },
        { pitchType: 'Slider', usage: 35, avgVelo: 86.0, whiffRate: 25, batAvg: .200 },
        { pitchType: 'Changeup', usage: 10, avgVelo: 89.0, whiffRate: 8, batAvg: .500 },
      ],
      lastMeeting: 'Jun 18', sampleSize: 15,
      notes: 'Arraez contact ability neutralizes Strider velocity. No power threat though.',
    },
  ];
}
