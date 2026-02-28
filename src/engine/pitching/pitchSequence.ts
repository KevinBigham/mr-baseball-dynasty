/**
 * Pitch Sequence Analysis
 *
 * Tracks pitch-to-pitch sequencing patterns, tunneling combos,
 * predictability scores, and sequence effectiveness. Key for
 * identifying pitcher tendencies and improving pitch calling.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PredictabilityGrade = 'deceptive' | 'varied' | 'average' | 'patterned' | 'predictable';

export const PREDICTABILITY_DISPLAY: Record<PredictabilityGrade, { label: string; color: string; emoji: string }> = {
  deceptive:   { label: 'Deceptive',    color: '#22c55e', emoji: '🎭' },
  varied:      { label: 'Varied',       color: '#3b82f6', emoji: '🔀' },
  average:     { label: 'Average',      color: '#eab308', emoji: '➖' },
  patterned:   { label: 'Patterned',    color: '#f97316', emoji: '📊' },
  predictable: { label: 'Predictable',  color: '#ef4444', emoji: '🎯' },
};

export interface SequenceCombo {
  first: string;
  second: string;
  frequency: number;       // % of times this combo occurs
  whiffRate: number;       // whiff % on second pitch
  runValue: number;        // run value per 100 (negative = good for pitcher)
  tunnelScore: number;     // 0-100 how well pitches tunnel
}

export interface CountTendency {
  count: string;           // e.g. "0-0", "1-2", "3-2"
  topPitch: string;
  topPitchPct: number;
  secondPitch: string;
  secondPitchPct: number;
  zoneRate: number;
}

export interface PitcherSequenceProfile {
  id: number;
  name: string;
  team: string;
  pos: string;
  overall: number;
  predictabilityGrade: PredictabilityGrade;
  predictabilityScore: number;   // 0-100, lower = more deceptive
  topCombos: SequenceCombo[];
  countTendencies: CountTendency[];
  firstPitchBreakdown: Record<string, number>;  // pitch type -> % usage
  twoStrikeApproach: string;
  sequenceNotes: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPredictabilityGrade(score: number): PredictabilityGrade {
  if (score <= 20) return 'deceptive';
  if (score <= 35) return 'varied';
  if (score <= 50) return 'average';
  if (score <= 70) return 'patterned';
  return 'predictable';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoSequences(): PitcherSequenceProfile[] {
  return [
    {
      id: 0, name: 'Gerrit Cole', team: 'NYY', pos: 'SP', overall: 89,
      predictabilityGrade: 'varied', predictabilityScore: 28,
      topCombos: [
        { first: '4-Seam', second: 'Slider', frequency: 22, whiffRate: 38, runValue: -2.8, tunnelScore: 85 },
        { first: '4-Seam', second: 'Knuckle Curve', frequency: 15, whiffRate: 32, runValue: -1.5, tunnelScore: 72 },
        { first: 'Slider', second: '4-Seam', frequency: 12, whiffRate: 18, runValue: -0.8, tunnelScore: 78 },
        { first: '4-Seam', second: '4-Seam', frequency: 18, whiffRate: 25, runValue: -1.2, tunnelScore: 90 },
      ],
      countTendencies: [
        { count: '0-0', topPitch: '4-Seam', topPitchPct: 62, secondPitch: 'Slider', secondPitchPct: 22, zoneRate: 58 },
        { count: '0-2', topPitch: 'Slider', topPitchPct: 45, secondPitch: 'Knuckle Curve', secondPitchPct: 28, zoneRate: 32 },
        { count: '1-2', topPitch: 'Slider', topPitchPct: 40, secondPitch: '4-Seam', secondPitchPct: 30, zoneRate: 38 },
        { count: '3-2', topPitch: '4-Seam', topPitchPct: 55, secondPitch: 'Slider', secondPitchPct: 30, zoneRate: 52 },
      ],
      firstPitchBreakdown: { '4-Seam': 62, 'Slider': 22, 'Changeup': 10, 'Knuckle Curve': 6 },
      twoStrikeApproach: 'Expands with slider glove-side, elevates 4-seam. Rarely wastes.',
      sequenceNotes: 'Uses 4-seam to set up slider tunnel. Predictable 1st pitch FB but varies well after.',
    },
    {
      id: 1, name: 'Logan Webb', team: 'SF', pos: 'SP', overall: 82,
      predictabilityGrade: 'deceptive', predictabilityScore: 18,
      topCombos: [
        { first: 'Sinker', second: 'Changeup', frequency: 25, whiffRate: 30, runValue: -3.2, tunnelScore: 88 },
        { first: 'Changeup', second: 'Slider', frequency: 18, whiffRate: 28, runValue: -2.0, tunnelScore: 70 },
        { first: 'Sinker', second: 'Slider', frequency: 15, whiffRate: 25, runValue: -1.5, tunnelScore: 75 },
        { first: 'Sinker', second: 'Sinker', frequency: 20, whiffRate: 12, runValue: -0.5, tunnelScore: 95 },
      ],
      countTendencies: [
        { count: '0-0', topPitch: 'Sinker', topPitchPct: 50, secondPitch: 'Changeup', secondPitchPct: 25, zoneRate: 65 },
        { count: '0-2', topPitch: 'Changeup', topPitchPct: 38, secondPitch: 'Slider', secondPitchPct: 30, zoneRate: 28 },
        { count: '1-2', topPitch: 'Slider', topPitchPct: 35, secondPitch: 'Changeup', secondPitchPct: 30, zoneRate: 35 },
        { count: '3-2', topPitch: 'Sinker', topPitchPct: 60, secondPitch: 'Changeup', secondPitchPct: 25, zoneRate: 55 },
      ],
      firstPitchBreakdown: { 'Sinker': 50, 'Changeup': 25, 'Slider': 15, 'Curveball': 10 },
      twoStrikeApproach: 'Tunnels changeup off sinker. Uses slider as chase pitch glove-side.',
      sequenceNotes: 'Elite sinker-changeup tunnel. Hard to predict pitch type due to similar release points.',
    },
    {
      id: 2, name: 'Spencer Strider', team: 'ATL', pos: 'SP', overall: 85,
      predictabilityGrade: 'patterned', predictabilityScore: 62,
      topCombos: [
        { first: '4-Seam', second: '4-Seam', frequency: 30, whiffRate: 28, runValue: -1.8, tunnelScore: 95 },
        { first: '4-Seam', second: 'Slider', frequency: 28, whiffRate: 42, runValue: -3.5, tunnelScore: 82 },
        { first: 'Slider', second: '4-Seam', frequency: 15, whiffRate: 22, runValue: -0.5, tunnelScore: 80 },
        { first: '4-Seam', second: 'Changeup', frequency: 10, whiffRate: 25, runValue: -1.0, tunnelScore: 65 },
      ],
      countTendencies: [
        { count: '0-0', topPitch: '4-Seam', topPitchPct: 72, secondPitch: 'Slider', secondPitchPct: 20, zoneRate: 62 },
        { count: '0-2', topPitch: 'Slider', topPitchPct: 52, secondPitch: '4-Seam', secondPitchPct: 35, zoneRate: 25 },
        { count: '1-2', topPitch: '4-Seam', topPitchPct: 48, secondPitch: 'Slider', secondPitchPct: 42, zoneRate: 40 },
        { count: '3-2', topPitch: '4-Seam', topPitchPct: 78, secondPitch: 'Slider', secondPitchPct: 18, zoneRate: 60 },
      ],
      firstPitchBreakdown: { '4-Seam': 72, 'Slider': 20, 'Changeup': 8 },
      twoStrikeApproach: 'Blow it by with heat or slider. Two-pitch approach is predictable but stuff is elite.',
      sequenceNotes: 'Heavily fastball reliant. Predictable arsenal but velocity makes up for it.',
    },
    {
      id: 3, name: 'Framber Valdez', team: 'HOU', pos: 'SP', overall: 82,
      predictabilityGrade: 'average', predictabilityScore: 42,
      topCombos: [
        { first: 'Sinker', second: 'Curveball', frequency: 28, whiffRate: 35, runValue: -2.5, tunnelScore: 65 },
        { first: 'Curveball', second: 'Sinker', frequency: 20, whiffRate: 10, runValue: -0.8, tunnelScore: 60 },
        { first: 'Sinker', second: 'Changeup', frequency: 18, whiffRate: 22, runValue: -1.2, tunnelScore: 80 },
        { first: 'Sinker', second: 'Sinker', frequency: 15, whiffRate: 8, runValue: -0.3, tunnelScore: 92 },
      ],
      countTendencies: [
        { count: '0-0', topPitch: 'Sinker', topPitchPct: 58, secondPitch: 'Curveball', secondPitchPct: 25, zoneRate: 60 },
        { count: '0-2', topPitch: 'Curveball', topPitchPct: 48, secondPitch: 'Sinker', secondPitchPct: 28, zoneRate: 22 },
        { count: '1-2', topPitch: 'Curveball', topPitchPct: 42, secondPitch: 'Changeup', secondPitchPct: 25, zoneRate: 30 },
        { count: '3-2', topPitch: 'Sinker', topPitchPct: 65, secondPitch: 'Curveball', secondPitchPct: 22, zoneRate: 50 },
      ],
      firstPitchBreakdown: { 'Sinker': 58, 'Curveball': 25, 'Changeup': 12, 'Cutter': 5 },
      twoStrikeApproach: 'Buries curveball for swings. Occasional changeup to LHH.',
      sequenceNotes: 'Sinker-curve pitcher. Speed differential is weapon. Predictable pattern but good execution.',
    },
  ];
}
