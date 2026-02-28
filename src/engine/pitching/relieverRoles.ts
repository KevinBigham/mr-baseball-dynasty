/**
 * Relief Pitcher Roles
 *
 * Manages closer, setup, middle relief, and specialist
 * role assignments. Tracks save situations, hold opportunities,
 * high-leverage performance, and role effectiveness.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BullpenRole = 'closer' | 'setup' | 'middle' | 'long' | 'loogy' | 'mop_up';
export type Effectiveness = 'dominant' | 'effective' | 'average' | 'shaky' | 'liability';

export const ROLE_DISPLAY: Record<BullpenRole, { label: string; color: string; emoji: string }> = {
  closer:  { label: 'Closer',      color: '#ef4444', emoji: '🔒' },
  setup:   { label: 'Setup',       color: '#f97316', emoji: '🔧' },
  middle:  { label: 'Middle',      color: '#eab308', emoji: '⚙️' },
  long:    { label: 'Long Relief', color: '#3b82f6', emoji: '📏' },
  loogy:   { label: 'Specialist',  color: '#a855f7', emoji: '🎯' },
  mop_up:  { label: 'Mop-Up',     color: '#888',    emoji: '🧹' },
};

export const EFFECTIVENESS_DISPLAY: Record<Effectiveness, { label: string; color: string }> = {
  dominant:  { label: 'Dominant',   color: '#22c55e' },
  effective: { label: 'Effective',  color: '#3b82f6' },
  average:   { label: 'Average',   color: '#eab308' },
  shaky:     { label: 'Shaky',     color: '#f97316' },
  liability: { label: 'Liability', color: '#ef4444' },
};

export interface RelieverProfile {
  id: number;
  name: string;
  overall: number;
  role: BullpenRole;
  effectiveness: Effectiveness;
  era: number;
  saves: number;
  holds: number;
  blownSaves: number;
  inningsPitched: number;
  k9: number;
  bb9: number;
  whip: number;
  highLevERA: number;        // ERA in high leverage
  inheritedRunnersScored: number; // % of inherited runners that scored
  consecutiveDays: number;   // max consecutive days available
  restDays: number;          // days since last outing
  isAvailable: boolean;
}

export interface BullpenRolesSummary {
  totalRelievers: number;
  closerName: string;
  closerSaves: number;
  teamBullpenERA: number;
  blownSaveTotal: number;
  dominantCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getEffectiveness(era: number, k9: number, whip: number): Effectiveness {
  const score = (10 - era) * 3 + k9 + (2 - whip) * 5;
  if (score >= 35) return 'dominant';
  if (score >= 28) return 'effective';
  if (score >= 20) return 'average';
  if (score >= 12) return 'shaky';
  return 'liability';
}

export function getBullpenRolesSummary(relievers: RelieverProfile[]): BullpenRolesSummary {
  const closer = relievers.find(r => r.role === 'closer');
  const n = relievers.length;
  return {
    totalRelievers: n,
    closerName: closer?.name ?? 'TBD',
    closerSaves: closer?.saves ?? 0,
    teamBullpenERA: Math.round(relievers.reduce((s, r) => s + r.era, 0) / n * 100) / 100,
    blownSaveTotal: relievers.reduce((s, r) => s + r.blownSaves, 0),
    dominantCount: relievers.filter(r => r.effectiveness === 'dominant').length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoRelieverRoles(): RelieverProfile[] {
  return [
    { id: 0, name: 'Emmanuel Clase', overall: 88, role: 'closer', effectiveness: 'dominant',
      era: 1.25, saves: 38, holds: 0, blownSaves: 3, inningsPitched: 62, k9: 9.5, bb9: 1.2, whip: 0.85,
      highLevERA: 0.95, inheritedRunnersScored: 12, consecutiveDays: 3, restDays: 1, isAvailable: true },
    { id: 1, name: 'Ryan Helsley', overall: 85, role: 'setup', effectiveness: 'dominant',
      era: 1.85, saves: 2, holds: 25, blownSaves: 1, inningsPitched: 58, k9: 12.5, bb9: 2.0, whip: 0.92,
      highLevERA: 1.45, inheritedRunnersScored: 18, consecutiveDays: 2, restDays: 0, isAvailable: true },
    { id: 2, name: 'Devin Williams', overall: 82, role: 'setup', effectiveness: 'effective',
      era: 2.85, saves: 0, holds: 20, blownSaves: 2, inningsPitched: 52, k9: 14.0, bb9: 3.5, whip: 1.05,
      highLevERA: 2.50, inheritedRunnersScored: 22, consecutiveDays: 2, restDays: 2, isAvailable: true },
    { id: 3, name: 'Clay Holmes', overall: 75, role: 'middle', effectiveness: 'average',
      era: 3.45, saves: 0, holds: 15, blownSaves: 4, inningsPitched: 55, k9: 8.0, bb9: 4.0, whip: 1.25,
      highLevERA: 4.20, inheritedRunnersScored: 35, consecutiveDays: 3, restDays: 1, isAvailable: true },
    { id: 4, name: 'Andrew Chafin', overall: 72, role: 'loogy', effectiveness: 'effective',
      era: 2.50, saves: 0, holds: 18, blownSaves: 1, inningsPitched: 45, k9: 10.0, bb9: 2.5, whip: 1.00,
      highLevERA: 2.10, inheritedRunnersScored: 15, consecutiveDays: 2, restDays: 0, isAvailable: false },
    { id: 5, name: 'Jose Alvarado', overall: 74, role: 'middle', effectiveness: 'shaky',
      era: 4.15, saves: 1, holds: 10, blownSaves: 5, inningsPitched: 48, k9: 11.0, bb9: 5.5, whip: 1.40,
      highLevERA: 5.80, inheritedRunnersScored: 42, consecutiveDays: 2, restDays: 3, isAvailable: true },
    { id: 6, name: 'Long Reliever', overall: 68, role: 'long', effectiveness: 'average',
      era: 3.80, saves: 0, holds: 5, blownSaves: 2, inningsPitched: 70, k9: 7.5, bb9: 2.8, whip: 1.20,
      highLevERA: 4.50, inheritedRunnersScored: 30, consecutiveDays: 4, restDays: 2, isAvailable: true },
    { id: 7, name: 'Mop-Up Man', overall: 58, role: 'mop_up', effectiveness: 'liability',
      era: 5.40, saves: 0, holds: 1, blownSaves: 3, inningsPitched: 35, k9: 6.0, bb9: 4.5, whip: 1.55,
      highLevERA: 7.20, inheritedRunnersScored: 55, consecutiveDays: 4, restDays: 0, isAvailable: true },
  ];
}
