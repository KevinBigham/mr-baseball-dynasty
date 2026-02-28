/**
 * Staff Poaching System
 *
 * After a successful season, other teams may attempt to hire
 * away your top coaching staff (bench coach, pitching coach,
 * hitting coach, etc.). Counter-offers cost money.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CoachRole = 'bench' | 'pitching' | 'hitting' | 'first_base' | 'third_base' | 'bullpen' | 'quality_control';

export const ROLE_DISPLAY: Record<CoachRole, { label: string; emoji: string; color: string; importance: number }> = {
  bench:           { label: 'Bench Coach',     emoji: '📋', color: '#f97316', importance: 5 },
  pitching:        { label: 'Pitching Coach',  emoji: '⚾', color: '#3b82f6', importance: 5 },
  hitting:         { label: 'Hitting Coach',   emoji: '🏏', color: '#ef4444', importance: 4 },
  bullpen:         { label: 'Bullpen Coach',   emoji: '🔥', color: '#f59e0b', importance: 4 },
  first_base:      { label: '1B Coach',        emoji: '👈', color: '#22c55e', importance: 2 },
  third_base:      { label: '3B Coach',        emoji: '👉', color: '#8b5cf6', importance: 3 },
  quality_control: { label: 'QC Coach',        emoji: '📊', color: '#06b6d4', importance: 3 },
};

export type PoachStatus = 'safe' | 'targeted' | 'offer_pending' | 'countered' | 'poached' | 'retained';

export const STATUS_DISPLAY: Record<PoachStatus, { label: string; color: string }> = {
  safe:          { label: 'Safe',           color: '#22c55e' },
  targeted:      { label: 'Targeted',       color: '#f97316' },
  offer_pending: { label: 'Offer Pending',  color: '#ef4444' },
  countered:     { label: 'Counter Sent',   color: '#3b82f6' },
  poached:       { label: 'Poached',        color: '#ef4444' },
  retained:      { label: 'Retained',       color: '#22c55e' },
};

export interface StaffMember {
  id: number;
  name: string;
  role: CoachRole;
  overall: number;        // 50-99
  salary: number;         // in M
  yearsOnStaff: number;
  specialty: string;
  poachStatus: PoachStatus;
  poachingTeam: string | null;
  offerAmount: number | null;
  counterCost: number | null;
  poachChance: number;    // % chance of being targeted
}

export interface PoachingSummary {
  totalStaff: number;
  targeted: number;
  offersPending: number;
  poached: number;
  retained: number;
  totalCounterCost: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function calcPoachChance(coach: StaffMember, teamWins: number, isChampion: boolean): number {
  if (coach.overall < 65) return 0;
  let chance = (coach.overall - 60) * 1.5;
  if (teamWins >= 95) chance += 15;
  else if (teamWins >= 85) chance += 8;
  if (isChampion) chance += 20;
  if (coach.yearsOnStaff >= 5) chance += 5;
  const roleInfo = ROLE_DISPLAY[coach.role];
  chance += roleInfo.importance * 2;
  return Math.min(85, Math.round(chance));
}

export function calcCounterCost(coach: StaffMember): number {
  return Math.round(coach.salary * 1.5 * 10) / 10;
}

export function counterOffer(coach: StaffMember): StaffMember {
  return { ...coach, poachStatus: 'countered', counterCost: calcCounterCost(coach) };
}

export function letGo(coach: StaffMember): StaffMember {
  return { ...coach, poachStatus: 'poached' };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const COACH_NAMES = [
  'Dave Martinez', 'Bob Melvin', 'Skip Schumaker', 'Pat Murphy',
  'Kevin Long', 'Matt Quatraro', 'Carlos Mendoza', 'Torey Lovullo',
  'Craig Counsell', 'Ron Washington', 'Mark DeRosa', 'Scott Servais',
];

const SPECIALTIES: Record<CoachRole, string[]> = {
  bench:           ['Game Strategy', 'Lineup Construction', 'In-Game Decisions'],
  pitching:        ['Pitch Development', 'Mechanics', 'Spin Rate Analytics'],
  hitting:         ['Launch Angle', 'Approach Coaching', 'Bat Speed Development'],
  bullpen:         ['Arm Care', 'Relief Sequencing', 'Pitch Tunneling'],
  first_base:      ['Base Running', 'Lead Technique', 'Runner Communication'],
  third_base:      ['Send/Hold Decisions', 'Tag-Up Reads', 'Relay Systems'],
  quality_control: ['Video Analysis', 'Advance Scouting', 'Data Integration'],
};

const POACHING_TEAMS = [
  'NYY', 'LAD', 'NYM', 'BOS', 'CHC', 'SF', 'PHI', 'SD', 'TEX', 'ATL', 'HOU', 'MIN',
];

export function generateDemoStaff(): StaffMember[] {
  const roles: CoachRole[] = ['bench', 'pitching', 'hitting', 'bullpen', 'first_base', 'third_base', 'quality_control'];

  return roles.map((role, i) => {
    const overall = 60 + ((i * 17 + 7) % 35);
    const salary = Math.round((0.5 + overall * 0.015) * 10) / 10;
    const poachChance = calcPoachChance(
      { id: i, name: '', role, overall, salary, yearsOnStaff: 1 + (i % 5), specialty: '', poachStatus: 'safe', poachingTeam: null, offerAmount: null, counterCost: null, poachChance: 0 },
      90, false
    );

    const isTargeted = poachChance >= 40;
    const hasOffer = isTargeted && (i % 3 !== 2);

    return {
      id: i,
      name: COACH_NAMES[i % COACH_NAMES.length],
      role,
      overall,
      salary,
      yearsOnStaff: 1 + (i % 5),
      specialty: SPECIALTIES[role][(i * 3) % SPECIALTIES[role].length],
      poachStatus: hasOffer ? 'offer_pending' : isTargeted ? 'targeted' : 'safe',
      poachingTeam: isTargeted ? POACHING_TEAMS[(i * 5) % POACHING_TEAMS.length] : null,
      offerAmount: hasOffer ? Math.round(salary * 1.8 * 10) / 10 : null,
      counterCost: hasOffer ? calcCounterCost({ salary } as StaffMember) : null,
      poachChance,
    };
  });
}

export function getSummary(staff: StaffMember[]): PoachingSummary {
  return {
    totalStaff: staff.length,
    targeted: staff.filter(s => s.poachStatus === 'targeted' || s.poachStatus === 'offer_pending').length,
    offersPending: staff.filter(s => s.poachStatus === 'offer_pending').length,
    poached: staff.filter(s => s.poachStatus === 'poached').length,
    retained: staff.filter(s => s.poachStatus === 'retained' || s.poachStatus === 'countered').length,
    totalCounterCost: staff.filter(s => s.counterCost).reduce((sum, s) => sum + (s.counterCost ?? 0), 0),
  };
}
