// ─── Bullpen Management ───────────────────────────────────────────────────
// Reliever roles, fatigue tracking, warm-up status, and availability.

export type BullpenRole = 'closer' | 'setup' | 'middle' | 'long' | 'loogy' | 'mopup';

export interface RelieverStatus {
  id: number;
  name: string;
  role: BullpenRole;
  overall: number;
  era: number;
  saves: number;
  holds: number;
  fatigue: number;         // 0-100, 100 = gassed
  warmingUp: boolean;
  available: boolean;
  pitchedLastGame: boolean;
  pitchedLast2: boolean;
  consecutiveDays: number;
  inningsPitched: number;
  velocity: number;        // current velo
  baseVelocity: number;    // rested velo
}

export const ROLE_DISPLAY: Record<BullpenRole, { label: string; color: string; emoji: string; order: number }> = {
  closer: { label: 'Closer', color: '#ef4444', emoji: '🚪', order: 1 },
  setup:  { label: 'Setup', color: '#f59e0b', emoji: '🔧', order: 2 },
  middle: { label: 'Middle', color: '#3b82f6', emoji: '⚙️', order: 3 },
  long:   { label: 'Long Relief', color: '#22c55e', emoji: '📏', order: 4 },
  loogy:  { label: 'Specialist', color: '#a855f7', emoji: '🎯', order: 5 },
  mopup:  { label: 'Mop-Up', color: '#94a3b8', emoji: '🧹', order: 6 },
};

export function getFatigueLabel(fatigue: number): { label: string; color: string } {
  if (fatigue <= 20) return { label: 'Fresh', color: '#22c55e' };
  if (fatigue <= 40) return { label: 'Good', color: '#a3e635' };
  if (fatigue <= 60) return { label: 'Moderate', color: '#eab308' };
  if (fatigue <= 80) return { label: 'Tired', color: '#f97316' };
  return { label: 'Gassed', color: '#ef4444' };
}

export function getAvailability(r: RelieverStatus): { available: boolean; reason: string } {
  if (r.fatigue >= 90) return { available: false, reason: 'Too fatigued' };
  if (r.consecutiveDays >= 3) return { available: false, reason: '3 consecutive days' };
  if (r.pitchedLast2 && r.fatigue >= 60) return { available: false, reason: 'Pitched last 2, fatigued' };
  return { available: true, reason: 'Available' };
}

export function getVelocityDrop(r: RelieverStatus): number {
  if (r.fatigue <= 20) return 0;
  if (r.fatigue <= 50) return 1;
  if (r.fatigue <= 75) return 2;
  return 3;
}

export function warmUp(r: RelieverStatus): RelieverStatus {
  return { ...r, warmingUp: true, fatigue: Math.min(100, r.fatigue + 5) };
}

export function rest(r: RelieverStatus): RelieverStatus {
  const newFatigue = Math.max(0, r.fatigue - 25);
  return {
    ...r,
    fatigue: newFatigue,
    warmingUp: false,
    pitchedLastGame: false,
    consecutiveDays: 0,
    velocity: r.baseVelocity,
    available: true,
  };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoBullpen(): RelieverStatus[] {
  const relievers: Omit<RelieverStatus, 'available' | 'velocity'>[] = [
    { id: 1, name: 'Edwin Díaz', role: 'closer', overall: 82, era: 2.45, saves: 28, holds: 0, fatigue: 35, warmingUp: false, pitchedLastGame: true, pitchedLast2: false, consecutiveDays: 1, inningsPitched: 48, baseVelocity: 99 },
    { id: 2, name: 'Josh Hader', role: 'setup', overall: 78, era: 3.12, saves: 2, holds: 18, fatigue: 55, warmingUp: false, pitchedLastGame: true, pitchedLast2: true, consecutiveDays: 2, inningsPitched: 52, baseVelocity: 97 },
    { id: 3, name: 'Devin Williams', role: 'setup', overall: 76, era: 3.45, saves: 1, holds: 22, fatigue: 20, warmingUp: false, pitchedLastGame: false, pitchedLast2: false, consecutiveDays: 0, inningsPitched: 55, baseVelocity: 96 },
    { id: 4, name: 'Ryan Pressly', role: 'middle', overall: 72, era: 3.78, saves: 0, holds: 15, fatigue: 45, warmingUp: true, pitchedLastGame: false, pitchedLast2: true, consecutiveDays: 0, inningsPitched: 58, baseVelocity: 95 },
    { id: 5, name: 'Clay Holmes', role: 'middle', overall: 70, era: 3.92, saves: 3, holds: 12, fatigue: 70, warmingUp: false, pitchedLastGame: true, pitchedLast2: true, consecutiveDays: 2, inningsPitched: 62, baseVelocity: 97 },
    { id: 6, name: 'Andrew Kittredge', role: 'long', overall: 65, era: 4.15, saves: 0, holds: 8, fatigue: 10, warmingUp: false, pitchedLastGame: false, pitchedLast2: false, consecutiveDays: 0, inningsPitched: 70, baseVelocity: 93 },
    { id: 7, name: 'Sam Moll', role: 'loogy', overall: 62, era: 3.55, saves: 0, holds: 10, fatigue: 30, warmingUp: false, pitchedLastGame: false, pitchedLast2: false, consecutiveDays: 0, inningsPitched: 35, baseVelocity: 91 },
    { id: 8, name: 'Nick Anderson', role: 'mopup', overall: 58, era: 5.20, saves: 0, holds: 3, fatigue: 85, warmingUp: false, pitchedLastGame: true, pitchedLast2: true, consecutiveDays: 3, inningsPitched: 45, baseVelocity: 94 },
  ];

  return relievers.map(r => {
    const veloDrop = getVelocityDrop(r as RelieverStatus);
    const avail = getAvailability(r as RelieverStatus);
    return { ...r, velocity: r.baseVelocity - veloDrop, available: avail.available };
  });
}
