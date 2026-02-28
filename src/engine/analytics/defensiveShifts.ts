/**
 * Defensive Shifts & Positioning
 *
 * Post-shift-ban era defensive positioning system. Tracks
 * traditional alignments, strategic positioning tweaks,
 * outfield depth adjustments, and their effectiveness.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = 'standard' | 'shade_pull' | 'shade_oppo' | 'no_doubles' | 'infield_in' | 'outfield_deep' | 'outfield_shallow' | 'bunt_defense';

export const SHIFT_DISPLAY: Record<ShiftType, { label: string; emoji: string; color: string; desc: string }> = {
  standard:         { label: 'Standard',       emoji: '⬜', color: '#6b7280', desc: 'Traditional positioning' },
  shade_pull:       { label: 'Shade Pull',     emoji: '⬅️', color: '#3b82f6', desc: 'Position players toward pull side' },
  shade_oppo:       { label: 'Shade Oppo',     emoji: '➡️', color: '#22c55e', desc: 'Position players toward opposite field' },
  no_doubles:       { label: 'No Doubles',     emoji: '🛑', color: '#ef4444', desc: 'Corner OFs guard lines, deep positioning' },
  infield_in:       { label: 'Infield In',     emoji: '⬆️', color: '#f97316', desc: 'Infield plays shallow to cut off runs' },
  outfield_deep:    { label: 'OF Deep',        emoji: '⬇️', color: '#8b5cf6', desc: 'Outfield plays back to prevent XBH' },
  outfield_shallow: { label: 'OF Shallow',     emoji: '🔼', color: '#eab308', desc: 'Outfield plays in to prevent singles/sac flies' },
  bunt_defense:     { label: 'Bunt Defense',   emoji: '🏃', color: '#06b6d4', desc: 'Corners charge, protect against bunt' },
};

export interface ShiftProfile {
  id: number;
  batterName: string;
  batterTeam: string;
  batterHand: 'L' | 'R' | 'S';
  pullPct: number;          // % of batted balls pulled
  centerPct: number;
  oppoPct: number;
  gbPct: number;            // ground ball %
  fbPct: number;            // fly ball %
  ldPct: number;            // line drive %
  recommendedShift: ShiftType;
  shiftEffectiveness: number;  // -10 to +10 runs saved
  currentShift: ShiftType;
  wOBAvsStandard: number;      // wOBA against standard alignment
  wOBAvsShift: number;         // wOBA against recommended shift
}

export interface ShiftSummary {
  totalProfiles: number;
  pullHeavy: number;       // batters with >45% pull
  oppoHeavy: number;       // batters with >35% oppo
  avgEffectiveness: number;
  totalRunsSaved: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function recommendShift(pullPct: number, gbPct: number, situation: string): ShiftType {
  if (situation === 'bunt') return 'bunt_defense';
  if (situation === 'no_doubles') return 'no_doubles';
  if (situation === 'infield_in') return 'infield_in';
  if (pullPct >= 48 && gbPct >= 50) return 'shade_pull';
  if (pullPct <= 32) return 'shade_oppo';
  if (gbPct <= 30) return 'outfield_deep';
  return 'standard';
}

export function getShiftSummary(profiles: ShiftProfile[]): ShiftSummary {
  return {
    totalProfiles: profiles.length,
    pullHeavy: profiles.filter(p => p.pullPct >= 45).length,
    oppoHeavy: profiles.filter(p => p.oppoPct >= 35).length,
    avgEffectiveness: Math.round(profiles.reduce((s, p) => s + p.shiftEffectiveness, 0) / profiles.length * 10) / 10,
    totalRunsSaved: Math.round(profiles.reduce((s, p) => s + p.shiftEffectiveness, 0) * 10) / 10,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const BATTER_DATA = [
  { name: 'Kyle Schwarber', team: 'PHI', hand: 'L' as const, pull: 52, center: 28, oppo: 20, gb: 35, fb: 42, ld: 23 },
  { name: 'Joey Gallo', team: 'MIN', hand: 'L' as const, pull: 55, center: 25, oppo: 20, gb: 30, fb: 50, ld: 20 },
  { name: 'Aaron Judge', team: 'NYY', hand: 'R' as const, pull: 45, center: 30, oppo: 25, gb: 32, fb: 44, ld: 24 },
  { name: 'Yordan Alvarez', team: 'HOU', hand: 'L' as const, pull: 43, center: 32, oppo: 25, gb: 38, fb: 38, ld: 24 },
  { name: 'Freddie Freeman', team: 'LAD', hand: 'L' as const, pull: 35, center: 35, oppo: 30, gb: 45, fb: 30, ld: 25 },
  { name: 'Juan Soto', team: 'NYY', hand: 'L' as const, pull: 38, center: 33, oppo: 29, gb: 40, fb: 35, ld: 25 },
  { name: 'Bryce Harper', team: 'PHI', hand: 'L' as const, pull: 42, center: 30, oppo: 28, gb: 36, fb: 40, ld: 24 },
  { name: 'Ronald Acuna Jr.', team: 'ATL', hand: 'R' as const, pull: 40, center: 32, oppo: 28, gb: 42, fb: 33, ld: 25 },
  { name: 'Mookie Betts', team: 'LAD', hand: 'R' as const, pull: 36, center: 34, oppo: 30, gb: 38, fb: 36, ld: 26 },
  { name: 'Matt Olson', team: 'ATL', hand: 'L' as const, pull: 50, center: 27, oppo: 23, gb: 33, fb: 45, ld: 22 },
];

export function generateDemoShifts(): ShiftProfile[] {
  return BATTER_DATA.map((b, i) => {
    const recommended = recommendShift(b.pull, b.gb, 'normal');
    const effectiveness = b.pull >= 45 ? 3 + (i % 5) : b.pull <= 35 ? 1 + (i % 3) : -1 + (i % 2);

    return {
      id: i,
      batterName: b.name,
      batterTeam: b.team,
      batterHand: b.hand,
      pullPct: b.pull,
      centerPct: b.center,
      oppoPct: b.oppo,
      gbPct: b.gb,
      fbPct: b.fb,
      ldPct: b.ld,
      recommendedShift: recommended,
      shiftEffectiveness: effectiveness,
      currentShift: i < 3 ? recommended : 'standard',
      wOBAvsStandard: Math.round((0.320 + (b.pull - 40) * 0.003) * 1000) / 1000,
      wOBAvsShift: Math.round((0.300 + (b.pull - 40) * 0.001) * 1000) / 1000,
    };
  });
}
