/**
 * Defensive Positioning Analysis
 *
 * Tracks defensive shift strategies, positioning effectiveness,
 * BABIP impact, and outs above average from positioning.
 * Key for optimizing team defense.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = 'standard' | 'shift_left' | 'shift_right' | 'extreme_shift' | 'no_shift';
export type PositioningGrade = 'elite' | 'plus' | 'average' | 'below_avg' | 'poor';

export const POSITIONING_DISPLAY: Record<PositioningGrade, { label: string; color: string; emoji: string }> = {
  elite:     { label: 'Elite',      color: '#22c55e', emoji: '🎯' },
  plus:      { label: 'Plus',       color: '#3b82f6', emoji: '👍' },
  average:   { label: 'Average',    color: '#eab308', emoji: '➖' },
  below_avg: { label: 'Below Avg',  color: '#f97316', emoji: '👎' },
  poor:      { label: 'Poor',       color: '#ef4444', emoji: '❌' },
};

export interface PositioningResult {
  shiftType: ShiftType;
  timesUsed: number;
  babipAgainst: number;
  outsAboveAvg: number;       // OAA from this positioning
  hitsPreventedEst: number;
}

export interface FielderPositioning {
  id: number;
  name: string;
  pos: string;
  overall: number;
  positioningGrade: PositioningGrade;
  oaaFromPositioning: number;
  babipImpact: number;         // BABIP reduction from positioning
  shiftResults: PositioningResult[];
  bestShift: string;
  optimalShiftPct: number;     // % of time correct shift was used
}

export interface PositioningSummary {
  teamOAA: number;
  teamBABIPImpact: number;
  totalHitsPrevented: number;
  elitePositioners: number;
  optimalShiftRate: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getPositioningGrade(oaa: number): PositioningGrade {
  if (oaa >= 8) return 'elite';
  if (oaa >= 4) return 'plus';
  if (oaa >= 0) return 'average';
  if (oaa >= -4) return 'below_avg';
  return 'poor';
}

export function getPositioningSummary(fielders: FielderPositioning[]): PositioningSummary {
  const n = fielders.length;
  return {
    teamOAA: fielders.reduce((s, f) => s + f.oaaFromPositioning, 0),
    teamBABIPImpact: Math.round(fielders.reduce((s, f) => s + f.babipImpact, 0) / n * 1000) / 1000,
    totalHitsPrevented: fielders.reduce((s, f) => s + f.shiftResults.reduce((ss, sr) => ss + sr.hitsPreventedEst, 0), 0),
    elitePositioners: fielders.filter(f => f.positioningGrade === 'elite').length,
    optimalShiftRate: Math.round(fielders.reduce((s, f) => s + f.optimalShiftPct, 0) / n),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoPositioning(): FielderPositioning[] {
  return [
    {
      id: 0, name: 'Mookie Betts', pos: '2B', overall: 88,
      positioningGrade: 'elite', oaaFromPositioning: 10, babipImpact: -.015,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 280, babipAgainst: .280, outsAboveAvg: 6, hitsPreventedEst: 12 },
        { shiftType: 'shift_right', timesUsed: 45, babipAgainst: .260, outsAboveAvg: 3, hitsPreventedEst: 5 },
        { shiftType: 'shift_left', timesUsed: 25, babipAgainst: .290, outsAboveAvg: 1, hitsPreventedEst: 2 },
      ],
      bestShift: 'standard', optimalShiftPct: 88,
    },
    {
      id: 1, name: 'Andres Gimenez', pos: 'SS', overall: 80,
      positioningGrade: 'plus', oaaFromPositioning: 6, babipImpact: -.010,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 300, babipAgainst: .285, outsAboveAvg: 4, hitsPreventedEst: 8 },
        { shiftType: 'shift_left', timesUsed: 50, babipAgainst: .270, outsAboveAvg: 2, hitsPreventedEst: 3 },
      ],
      bestShift: 'standard', optimalShiftPct: 82,
    },
    {
      id: 2, name: 'Matt Chapman', pos: '3B', overall: 82,
      positioningGrade: 'elite', oaaFromPositioning: 12, babipImpact: -.018,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 250, babipAgainst: .265, outsAboveAvg: 8, hitsPreventedEst: 15 },
        { shiftType: 'shift_right', timesUsed: 60, babipAgainst: .250, outsAboveAvg: 3, hitsPreventedEst: 5 },
        { shiftType: 'shift_left', timesUsed: 40, babipAgainst: .280, outsAboveAvg: 1, hitsPreventedEst: 2 },
      ],
      bestShift: 'standard', optimalShiftPct: 90,
    },
    {
      id: 3, name: 'Freddie Freeman', pos: '1B', overall: 87,
      positioningGrade: 'average', oaaFromPositioning: 1, babipImpact: -.002,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 320, babipAgainst: .295, outsAboveAvg: 1, hitsPreventedEst: 3 },
        { shiftType: 'shift_left', timesUsed: 30, babipAgainst: .300, outsAboveAvg: 0, hitsPreventedEst: 0 },
      ],
      bestShift: 'standard', optimalShiftPct: 75,
    },
    {
      id: 4, name: 'Nick Castellanos', pos: 'RF', overall: 74,
      positioningGrade: 'poor', oaaFromPositioning: -6, babipImpact: .012,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 280, babipAgainst: .310, outsAboveAvg: -4, hitsPreventedEst: -8 },
        { shiftType: 'shift_right', timesUsed: 20, babipAgainst: .330, outsAboveAvg: -2, hitsPreventedEst: -3 },
      ],
      bestShift: 'standard', optimalShiftPct: 60,
    },
    {
      id: 5, name: 'J.T. Realmuto', pos: 'C', overall: 78,
      positioningGrade: 'plus', oaaFromPositioning: 5, babipImpact: -.008,
      shiftResults: [
        { shiftType: 'standard', timesUsed: 350, babipAgainst: .282, outsAboveAvg: 5, hitsPreventedEst: 10 },
      ],
      bestShift: 'standard', optimalShiftPct: 85,
    },
  ];
}
