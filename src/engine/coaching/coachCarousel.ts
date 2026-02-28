/**
 * Coach Carousel
 *
 * Manages the pool of available and fired coaches/managers
 * for hiring. Tracks career records, firing history, and
 * availability for hire.
 *
 * Ported from football dynasty coach-carousel.js, adapted for baseball
 * (manager instead of HC, plus pitching/hitting coaches).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type CoachRole = 'manager' | 'pitching_coach' | 'hitting_coach' | 'bench_coach';

export interface CarouselCoach {
  id: number;
  name: string;
  role: CoachRole;
  age: number;
  overall: number;
  specialty: string;
  record: { wins: number; losses: number; rings: number; seasons: number };
  firedFrom?: string;
  firedYear?: number;
  available: boolean;
  personality: string;
  askingSalary: number;
}

// ── Role config ─────────────────────────────────────────────────────────────

export const ROLE_DISPLAY: Record<CoachRole, { label: string; color: string; icon: string }> = {
  manager:       { label: 'MANAGER',       color: '#eab308', icon: '👔' },
  pitching_coach: { label: 'PITCHING COACH', color: '#3b82f6', icon: '💨' },
  hitting_coach: { label: 'HITTING COACH', color: '#f97316', icon: '⚾' },
  bench_coach:   { label: 'BENCH COACH',   color: '#94a3b8', icon: '📋' },
};

// ── Specialties ─────────────────────────────────────────────────────────────

export const SPECIALTIES: Record<CoachRole, string[]> = {
  manager:        ['Strategist', 'Players\' Manager', 'Analytics-Driven', 'Old School', 'Bullpen Master', 'Youth Developer'],
  pitching_coach: ['Velocity Guru', 'Pitch Design', 'Mechanical Fix', 'Bullpen Specialist', 'Pitch Sequencing'],
  hitting_coach:  ['Contact Approach', 'Launch Angle', 'Plate Discipline', 'Power Development', 'Situational Hitting'],
  bench_coach:    ['Game Prep', 'In-Game Strategy', 'Defensive Alignment', 'Baserunning', 'Replay Decisions'],
};

export const PERSONALITIES = [
  'Fiery', 'Calm', 'Cerebral', 'Motivator', 'Disciplinarian',
  'Players\' Guy', 'Quiet Leader', 'Innovator', 'Veteran Mind', 'Risk-Taker',
];

// ── Name generation ─────────────────────────────────────────────────────────

const FIRST_NAMES = ['Joe', 'Mike', 'Dave', 'Rick', 'Tony', 'Bob', 'Terry', 'Buck', 'Dusty', 'Bruce', 'Jim', 'Lou', 'Don', 'Skip', 'Bobby'];
const LAST_NAMES = ['Baker', 'Girardi', 'Showalter', 'Maddon', 'Roberts', 'Boone', 'Melvin', 'Kapler', 'Counsell', 'Cash', 'Hyde', 'Francona', 'LaRussa', 'Valentine', 'Pinella'];

// ── Pool management ─────────────────────────────────────────────────────────

const MAX_POOL = 20;

export function generateCoach(id: number, role: CoachRole): CarouselCoach {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const specs = SPECIALTIES[role];
  const ovr = 45 + Math.floor(Math.random() * 35);

  return {
    id,
    name: `${firstName} ${lastName}`,
    role,
    age: 42 + Math.floor(Math.random() * 20),
    overall: ovr,
    specialty: specs[Math.floor(Math.random() * specs.length)],
    record: {
      wins: Math.floor(Math.random() * 500),
      losses: Math.floor(Math.random() * 500),
      rings: Math.floor(Math.random() * 3),
      seasons: 2 + Math.floor(Math.random() * 15),
    },
    available: true,
    personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
    askingSalary: Math.round((1 + ovr * 0.06 + Math.random() * 2) * 10) / 10,
  };
}

export function fireCoach(pool: CarouselCoach[], coach: CarouselCoach, teamName: string, year: number): CarouselCoach[] {
  const fired = { ...coach, firedFrom: teamName, firedYear: year, available: true };
  const updated = [...pool, fired];
  if (updated.length > MAX_POOL) {
    return updated.slice(updated.length - MAX_POOL);
  }
  return updated;
}

export function hireCoach(pool: CarouselCoach[], coachId: number): CarouselCoach[] {
  return pool.map(c => c.id === coachId ? { ...c, available: false } : c);
}

export function generateCarouselPool(count: number = 12): CarouselCoach[] {
  const pool: CarouselCoach[] = [];
  const roles: CoachRole[] = ['manager', 'manager', 'manager', 'pitching_coach', 'pitching_coach', 'pitching_coach', 'hitting_coach', 'hitting_coach', 'hitting_coach', 'bench_coach', 'bench_coach', 'bench_coach'];

  for (let i = 0; i < count; i++) {
    const coach = generateCoach(200 + i, roles[i % roles.length]);
    if (Math.random() < 0.4) {
      const teams = ['NYY', 'BOS', 'LAD', 'CHC', 'HOU', 'ATL', 'SEA', 'PHI'];
      coach.firedFrom = teams[Math.floor(Math.random() * teams.length)];
      coach.firedYear = 2025 + Math.floor(Math.random() * 3);
    }
    pool.push(coach);
  }
  return pool;
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getCarouselSummary(pool: CarouselCoach[]) {
  const available = pool.filter(c => c.available);
  return {
    total: pool.length,
    available: available.length,
    managers: available.filter(c => c.role === 'manager').length,
    pitchingCoaches: available.filter(c => c.role === 'pitching_coach').length,
    hittingCoaches: available.filter(c => c.role === 'hitting_coach').length,
    benchCoaches: available.filter(c => c.role === 'bench_coach').length,
    avgOvr: available.length > 0
      ? Math.round(available.reduce((s, c) => s + c.overall, 0) / available.length)
      : 0,
  };
}
