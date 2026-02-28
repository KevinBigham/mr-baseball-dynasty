// ─── Umpire Tendencies ────────────────────────────────────────────────────
// Strike zone bias, consistency ratings, and crew assignments.

export interface Umpire {
  id: number;
  name: string;
  experience: number;     // years
  consistency: number;    // 1-100 (100 = robot)
  strikeZoneSize: 'tight' | 'average' | 'wide';
  lowZoneBias: number;    // -3 to +3 (positive = gives low calls)
  outsideCornerBias: number; // -3 to +3
  rightHandedBias: number;   // -2 to +2
  ejectionRate: number;   // ejections per 100 games
  rating: number;         // overall 40-99
  personality: string;
}

export interface CrewAssignment {
  game: string;
  homePlate: Umpire;
  firstBase: Umpire;
  secondBase: Umpire;
  thirdBase: Umpire;
}

export const ZONE_SIZE_DISPLAY: Record<string, { label: string; color: string; desc: string }> = {
  tight:   { label: 'Tight Zone', color: '#ef4444', desc: 'Calls a small strike zone — favors hitters' },
  average: { label: 'Average Zone', color: '#eab308', desc: 'Standard MLB strike zone' },
  wide:    { label: 'Wide Zone', color: '#22c55e', desc: 'Calls an expanded strike zone — favors pitchers' },
};

export function getConsistencyLabel(c: number): { label: string; color: string } {
  if (c >= 90) return { label: 'Elite', color: '#22c55e' };
  if (c >= 75) return { label: 'Good', color: '#a3e635' };
  if (c >= 60) return { label: 'Average', color: '#eab308' };
  if (c >= 40) return { label: 'Inconsistent', color: '#f97316' };
  return { label: 'Erratic', color: '#ef4444' };
}

export function getStrikeZoneEffect(ump: Umpire): { pitcherAdj: number; hitterAdj: number } {
  const base = ump.strikeZoneSize === 'wide' ? 2 : ump.strikeZoneSize === 'tight' ? -2 : 0;
  return {
    pitcherAdj: base + Math.round(ump.outsideCornerBias * 0.5),
    hitterAdj: -base + Math.round(ump.lowZoneBias * -0.3),
  };
}

export function getEjectionRisk(ump: Umpire): { label: string; color: string } {
  if (ump.ejectionRate >= 3) return { label: 'Quick Hook', color: '#ef4444' };
  if (ump.ejectionRate >= 1.5) return { label: 'Moderate', color: '#f97316' };
  return { label: 'Patient', color: '#22c55e' };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoUmpires(): Umpire[] {
  return [
    { id: 1, name: 'Angel Hernandez Jr.', experience: 28, consistency: 42, strikeZoneSize: 'wide', lowZoneBias: 2, outsideCornerBias: 3, rightHandedBias: 1, ejectionRate: 3.2, rating: 48, personality: 'Confrontational' },
    { id: 2, name: 'Pat Hoberg', experience: 12, consistency: 96, strikeZoneSize: 'average', lowZoneBias: 0, outsideCornerBias: 0, rightHandedBias: 0, ejectionRate: 0.5, rating: 92, personality: 'By the Book' },
    { id: 3, name: 'Laz Diaz', experience: 22, consistency: 55, strikeZoneSize: 'wide', lowZoneBias: 1, outsideCornerBias: 2, rightHandedBias: -1, ejectionRate: 2.1, rating: 58, personality: 'Dramatic' },
    { id: 4, name: 'Mark Wegner', experience: 25, consistency: 72, strikeZoneSize: 'tight', lowZoneBias: -1, outsideCornerBias: -1, rightHandedBias: 0, ejectionRate: 1.8, rating: 70, personality: 'Quiet Professional' },
    { id: 5, name: 'DJ Reyburn', experience: 5, consistency: 85, strikeZoneSize: 'average', lowZoneBias: 0, outsideCornerBias: 1, rightHandedBias: 0, ejectionRate: 0.3, rating: 82, personality: 'New School' },
    { id: 6, name: 'CB Buckner Jr.', experience: 18, consistency: 60, strikeZoneSize: 'wide', lowZoneBias: 2, outsideCornerBias: 1, rightHandedBias: 1, ejectionRate: 2.5, rating: 55, personality: 'Show Runner' },
    { id: 7, name: 'Dan Bellino', experience: 15, consistency: 78, strikeZoneSize: 'tight', lowZoneBias: -2, outsideCornerBias: 0, rightHandedBias: -1, ejectionRate: 1.2, rating: 75, personality: 'Pitcher-Friendly' },
    { id: 8, name: 'Nic Lentz', experience: 8, consistency: 88, strikeZoneSize: 'average', lowZoneBias: 0, outsideCornerBias: -1, rightHandedBias: 0, ejectionRate: 0.8, rating: 84, personality: 'Consistent' },
  ];
}

export function generateDemoCrews(): CrewAssignment[] {
  const umps = generateDemoUmpires();
  return [
    { game: 'NYY vs BOS', homePlate: umps[0], firstBase: umps[3], secondBase: umps[5], thirdBase: umps[7] },
    { game: 'LAD vs SFG', homePlate: umps[1], firstBase: umps[2], secondBase: umps[4], thirdBase: umps[6] },
  ];
}
