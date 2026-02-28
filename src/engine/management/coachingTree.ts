/**
 * coachingTree.ts – Coaching Tree Engine
 *
 * Shows the lineage and development tree of coaches/managers in the
 * organization. Tracks mentor/protege relationships, win-loss records,
 * specialties, and ratings. Builds a hierarchical tree from root
 * coaches (no mentor) down through their protege chains.
 *
 * All demo data — no sim engine integration.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type CoachRole =
  | 'manager'
  | 'bench'
  | 'pitching'
  | 'hitting'
  | 'first_base'
  | 'third_base'
  | 'bullpen'
  | 'quality_control';

export interface CoachNode {
  coachId: number;
  name: string;
  role: CoachRole;
  rating: number;        // 0-550 internal scale (400=MLB avg)
  yearsInOrg: number;
  mentorId: number | null;
  proteges: number[];    // coachIds of proteges
  wins: number;
  losses: number;
  specialty: string;
}

export interface CoachingTreeData {
  orgName: string;
  treeRoots: CoachNode[];      // coaches with no mentor
  allCoaches: CoachNode[];     // flat list of all coaches
  totalWins: number;
  totalLosses: number;
}

// ── Role Display Labels ────────────────────────────────────────────────────

export const COACH_ROLE_LABELS: Record<CoachRole, string> = {
  manager: 'Manager',
  bench: 'Bench Coach',
  pitching: 'Pitching Coach',
  hitting: 'Hitting Coach',
  first_base: '1B Coach',
  third_base: '3B Coach',
  bullpen: 'Bullpen Coach',
  quality_control: 'Quality Control',
};

export const COACH_ROLE_COLORS: Record<CoachRole, string> = {
  manager: '#f59e0b',
  bench: '#94a3b8',
  pitching: '#3b82f6',
  hitting: '#ef4444',
  first_base: '#22c55e',
  third_base: '#a855f7',
  bullpen: '#06b6d4',
  quality_control: '#6b7280',
};

// ── Rating to Scouting Scale ───────────────────────────────────────────────

export function ratingToScouting(rating: number): number {
  // 0-550 internal -> 20-80 scouting scale
  return Math.round(20 + (rating / 550) * 60);
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Mike', 'Dave', 'Bob', 'Joe', 'Tom', 'Steve', 'Bill', 'Jim',
  'Ron', 'Dan', 'Tony', 'Rick', 'Mark', 'Kevin', 'Greg', 'Pete',
];

const LAST_NAMES = [
  'Johnson', 'Martinez', 'Anderson', 'Thomas', 'Robinson', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Young', 'Baker', 'Nelson', 'Hill',
  'Green', 'Adams', 'Mitchell',
];

const SPECIALTIES = [
  'Player Development', 'Pitch Design', 'Launch Angle Theory',
  'Defensive Alignment', 'Baserunning Strategy', 'Bullpen Management',
  'Youth Development', 'Veteran Motivation', 'Analytics Integration',
  'Contact Approach', 'Power Mechanics', 'Pitch Framing',
  'Game Planning', 'Scouting Reports', 'Mental Conditioning',
  'Situational Hitting',
];

const ROLES: CoachRole[] = [
  'manager', 'bench', 'pitching', 'hitting',
  'first_base', 'third_base', 'bullpen', 'quality_control',
];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 11) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function buildDemoCoaches(rand: () => number): CoachNode[] {
  const coaches: CoachNode[] = [];
  let nextId = 1;

  function makeName(): string {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    return `${first} ${last}`;
  }

  function makeCoach(
    role: CoachRole,
    mentorId: number | null,
    ratingRange: [number, number],
    yearsRange: [number, number],
  ): CoachNode {
    const id = nextId++;
    const rating = Math.round(ratingRange[0] + rand() * (ratingRange[1] - ratingRange[0]));
    const years = Math.round(yearsRange[0] + rand() * (yearsRange[1] - yearsRange[0]));
    const wins = Math.round(40 + rand() * 80) * years;
    const losses = Math.round(40 + rand() * 80) * years;

    return {
      coachId: id,
      name: makeName(),
      role,
      rating,
      yearsInOrg: years,
      mentorId,
      proteges: [],
      wins,
      losses,
      specialty: SPECIALTIES[Math.floor(rand() * SPECIALTIES.length)],
    };
  }

  // Root coaches (no mentor) — 3 legendary managers
  const root1 = makeCoach('manager', null, [420, 520], [18, 30]);
  const root2 = makeCoach('manager', null, [380, 480], [14, 22]);
  const root3 = makeCoach('manager', null, [350, 450], [12, 20]);
  coaches.push(root1, root2, root3);

  // First generation proteges under root1
  const gen1a = makeCoach('bench', root1.coachId, [360, 460], [10, 18]);
  const gen1b = makeCoach('pitching', root1.coachId, [380, 480], [12, 16]);
  const gen1c = makeCoach('hitting', root1.coachId, [340, 440], [8, 14]);
  root1.proteges.push(gen1a.coachId, gen1b.coachId, gen1c.coachId);
  coaches.push(gen1a, gen1b, gen1c);

  // First generation proteges under root2
  const gen1d = makeCoach('manager', root2.coachId, [350, 450], [8, 14]);
  const gen1e = makeCoach('pitching', root2.coachId, [320, 420], [6, 12]);
  root2.proteges.push(gen1d.coachId, gen1e.coachId);
  coaches.push(gen1d, gen1e);

  // First generation proteges under root3
  const gen1f = makeCoach('hitting', root3.coachId, [310, 410], [6, 10]);
  const gen1g = makeCoach('bullpen', root3.coachId, [300, 400], [5, 10]);
  root3.proteges.push(gen1f.coachId, gen1g.coachId);
  coaches.push(gen1f, gen1g);

  // Second generation proteges under gen1a (became a manager)
  const gen2a = makeCoach('bench', gen1a.coachId, [300, 400], [4, 8]);
  const gen2b = makeCoach('third_base', gen1a.coachId, [280, 380], [3, 7]);
  gen1a.proteges.push(gen2a.coachId, gen2b.coachId);
  coaches.push(gen2a, gen2b);

  // Second generation proteges under gen1b
  const gen2c = makeCoach('pitching', gen1b.coachId, [320, 420], [4, 8]);
  const gen2d = makeCoach('quality_control', gen1b.coachId, [280, 360], [2, 6]);
  gen1b.proteges.push(gen2c.coachId, gen2d.coachId);
  coaches.push(gen2c, gen2d);

  // Second generation proteges under gen1d
  const gen2e = makeCoach('first_base', gen1d.coachId, [260, 380], [3, 6]);
  const gen2f = makeCoach('hitting', gen1d.coachId, [300, 400], [4, 8]);
  gen1d.proteges.push(gen2e.coachId, gen2f.coachId);
  coaches.push(gen2e, gen2f);

  // Third generation under gen2c
  const gen3a = makeCoach('bullpen', gen2c.coachId, [260, 360], [2, 5]);
  gen2c.proteges.push(gen3a.coachId);
  coaches.push(gen3a);

  return coaches;
}

export function generateDemoCoachingTree(): CoachingTreeData {
  const rand = seededRand(42);
  const allCoaches = buildDemoCoaches(rand);

  const treeRoots = allCoaches.filter(c => c.mentorId === null);
  const totalWins = allCoaches.reduce((s, c) => s + c.wins, 0);
  const totalLosses = allCoaches.reduce((s, c) => s + c.losses, 0);

  return {
    orgName: 'Franchise Coaching Tree',
    treeRoots,
    allCoaches,
    totalWins,
    totalLosses,
  };
}
