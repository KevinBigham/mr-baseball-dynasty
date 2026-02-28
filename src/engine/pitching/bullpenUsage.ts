/**
 * Bullpen Usage Patterns
 *
 * Tracks relief pitcher workload, rest patterns, high-leverage
 * usage, and optimal bullpen deployment. Monitors back-to-back
 * appearances and 3-day workload limits.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type AvailabilityStatus = 'fully_rested' | 'available' | 'low_leverage' | 'emergency_only' | 'unavailable';

export const AVAILABILITY_DISPLAY: Record<AvailabilityStatus, { label: string; emoji: string; color: string }> = {
  fully_rested:  { label: 'Fully Rested',  emoji: '🟢', color: '#22c55e' },
  available:     { label: 'Available',      emoji: '🔵', color: '#3b82f6' },
  low_leverage:  { label: 'Low Leverage',   emoji: '🟡', color: '#eab308' },
  emergency_only:{ label: 'Emergency Only', emoji: '🟠', color: '#f97316' },
  unavailable:   { label: 'Unavailable',    emoji: '🔴', color: '#ef4444' },
};

export type RelieverRole = 'closer' | 'setup' | 'high_leverage' | 'middle' | 'long' | 'mop_up' | 'lefty_specialist';

export const ROLE_DISPLAY: Record<RelieverRole, { label: string; color: string }> = {
  closer:           { label: 'Closer',           color: '#ef4444' },
  setup:            { label: 'Setup',            color: '#f97316' },
  high_leverage:    { label: 'High Leverage',    color: '#eab308' },
  middle:           { label: 'Middle Relief',    color: '#3b82f6' },
  long:             { label: 'Long Relief',      color: '#6b7280' },
  mop_up:           { label: 'Mop Up',           color: '#94a3b8' },
  lefty_specialist: { label: 'Lefty Specialist', color: '#8b5cf6' },
};

export interface BullpenArm {
  id: number;
  name: string;
  overall: number;
  role: RelieverRole;
  hand: 'L' | 'R';
  era: number;
  whip: number;
  kPer9: number;
  saves: number;
  holds: number;
  appearances: number;
  inningsPitched: number;
  availability: AvailabilityStatus;
  daysRest: number;
  pitchesLast3Days: number;
  consecutiveAppearances: number;
  leverageIndex: number;      // avg LI faced
  inheritedRunnersScored: number;
  inheritedRunnersTotal: number;
  warmingUp: boolean;
}

export interface BullpenSummary {
  totalArms: number;
  fullyRested: number;
  available: number;
  limited: number;
  unavailable: number;
  avgEra: number;
  totalSaves: number;
  totalHolds: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getAvailability(arm: BullpenArm): AvailabilityStatus {
  if (arm.daysRest === 0 && arm.consecutiveAppearances >= 2) return 'unavailable';
  if (arm.pitchesLast3Days >= 60) return 'unavailable';
  if (arm.daysRest === 0 && arm.consecutiveAppearances === 1) return 'emergency_only';
  if (arm.pitchesLast3Days >= 45) return 'low_leverage';
  if (arm.daysRest >= 2) return 'fully_rested';
  return 'available';
}

export function getBullpenSummary(arms: BullpenArm[]): BullpenSummary {
  return {
    totalArms: arms.length,
    fullyRested: arms.filter(a => a.availability === 'fully_rested').length,
    available: arms.filter(a => a.availability === 'available').length,
    limited: arms.filter(a => a.availability === 'low_leverage' || a.availability === 'emergency_only').length,
    unavailable: arms.filter(a => a.availability === 'unavailable').length,
    avgEra: Math.round(arms.reduce((s, a) => s + a.era, 0) / arms.length * 100) / 100,
    totalSaves: arms.reduce((s, a) => s + a.saves, 0),
    totalHolds: arms.reduce((s, a) => s + a.holds, 0),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoBullpen(): BullpenArm[] {
  const data = [
    { name: 'Emmanuel Clase',   ovr: 88, role: 'closer' as RelieverRole,          hand: 'R' as const, era: 1.45, whip: 0.88, k9: 9.8,  sv: 38, hd: 0,  app: 62, ip: 64.1, rest: 2, p3d: 0,  con: 0, li: 2.1, irs: 3, irt: 15 },
    { name: 'Devin Williams',   ovr: 85, role: 'setup' as RelieverRole,           hand: 'R' as const, era: 1.80, whip: 0.95, k9: 13.2, sv: 2,  hd: 28, app: 58, ip: 55.0, rest: 1, p3d: 22, con: 1, li: 1.8, irs: 2, irt: 12 },
    { name: 'Ryan Helsley',     ovr: 83, role: 'high_leverage' as RelieverRole,   hand: 'R' as const, era: 2.10, whip: 1.05, k9: 11.5, sv: 5,  hd: 22, app: 55, ip: 52.0, rest: 0, p3d: 40, con: 2, li: 1.6, irs: 5, irt: 18 },
    { name: 'Andrew Kittredge', ovr: 72, role: 'middle' as RelieverRole,          hand: 'R' as const, era: 3.45, whip: 1.18, k9: 8.2,  sv: 0,  hd: 15, app: 48, ip: 50.0, rest: 3, p3d: 0,  con: 0, li: 0.9, irs: 8, irt: 22 },
    { name: 'Jose Alvarado',    ovr: 78, role: 'lefty_specialist' as RelieverRole, hand: 'L' as const, era: 2.65, whip: 1.12, k9: 10.8, sv: 1,  hd: 18, app: 52, ip: 48.0, rest: 1, p3d: 28, con: 1, li: 1.4, irs: 4, irt: 14 },
    { name: 'Phil Maton',       ovr: 70, role: 'middle' as RelieverRole,          hand: 'R' as const, era: 3.80, whip: 1.22, k9: 7.5,  sv: 0,  hd: 10, app: 45, ip: 55.0, rest: 0, p3d: 55, con: 1, li: 0.7, irs: 10, irt: 25 },
    { name: 'Lucas Sims',       ovr: 68, role: 'long' as RelieverRole,            hand: 'R' as const, era: 4.10, whip: 1.30, k9: 9.0,  sv: 0,  hd: 5,  app: 35, ip: 62.0, rest: 4, p3d: 0,  con: 0, li: 0.5, irs: 12, irt: 30 },
    { name: 'Tyler Rogers',     ovr: 65, role: 'mop_up' as RelieverRole,          hand: 'L' as const, era: 4.50, whip: 1.35, k9: 6.0,  sv: 0,  hd: 3,  app: 40, ip: 58.0, rest: 2, p3d: 15, con: 0, li: 0.3, irs: 14, irt: 28 },
  ];

  return data.map((d, i) => {
    const arm: BullpenArm = {
      id: i,
      name: d.name,
      overall: d.ovr,
      role: d.role,
      hand: d.hand,
      era: d.era,
      whip: d.whip,
      kPer9: d.k9,
      saves: d.sv,
      holds: d.hd,
      appearances: d.app,
      inningsPitched: d.ip,
      availability: 'available',
      daysRest: d.rest,
      pitchesLast3Days: d.p3d,
      consecutiveAppearances: d.con,
      leverageIndex: d.li,
      inheritedRunnersScored: d.irs,
      inheritedRunnersTotal: d.irt,
      warmingUp: false,
    };
    arm.availability = getAvailability(arm);
    return arm;
  });
}
