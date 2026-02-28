/**
 * Coaching Staff System — Mr. Baseball Dynasty
 *
 * Manages coaching staff with meaningful gameplay effects:
 *   - Coach archetypes with specialization traits
 *   - Development bonuses applied during offseason player development
 *   - Performance bonuses applied during season simulation
 *   - Hire/fire mechanics with available coaching pool
 *   - Coach quality affects prospect development, injury recovery, performance
 *
 * Inspired by OOTP's coaching staff system.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type CoachRole = 'manager' | 'pitching_coach' | 'hitting_coach' | 'bench_coach' | 'bullpen_coach' | 'first_base' | 'third_base';

export type CoachSpecialty =
  | 'developer'           // +15% prospect development speed
  | 'tactician'           // +5% win probability in close games
  | 'motivator'           // +10% team chemistry
  | 'analytics_guru'      // +10% scouting accuracy
  | 'veteran_handler'     // +5% performance for 30+ players
  | 'youth_whisperer'     // +20% prospect development for U-25
  | 'pitching_savant'     // +15% pitcher development
  | 'hitting_guru'        // +15% hitter development
  | 'defense_first'       // +10% fielding development
  | 'bullpen_master'      // +10% reliever performance
  | 'injury_preventer'    // -15% injury rate
  | 'comeback_specialist' // +10% recovery speed
  | 'clubhouse_leader'    // +15% chemistry, prevents morale dips
  | 'sabermetrician';     // +10% lineup optimization

export interface Coach {
  coachId:      number;
  name:         string;
  role:         CoachRole;
  specialty:    CoachSpecialty;
  quality:      number;   // 30-80 (scouting scale)
  experience:   number;   // Years coaching
  salary:       number;   // Annual salary in dollars
  contractYears: number;  // Remaining contract years
  age:          number;
  personality:  'calm' | 'fiery' | 'analytical' | 'players_coach';
}

export interface CoachingStaffData {
  teamId:      number;
  coaches:     Coach[];
  totalSalary: number;
  // Computed bonuses
  devBonus:       number;  // Overall development speed multiplier (0.8 - 1.3)
  pitcherDevBonus: number; // Pitcher-specific dev multiplier
  hitterDevBonus:  number; // Hitter-specific dev multiplier
  chemistryBonus:  number; // Chemistry boost (0.0 - 0.25)
  injuryReduction: number; // Injury rate reduction (0.0 - 0.15)
  scoutingBonus:   number; // Scouting accuracy boost (0.0 - 0.10)
}

export interface CoachingEffect {
  devMultiplier:       number;
  pitcherDevMultiplier: number;
  hitterDevMultiplier:  number;
  chemistryBoost:      number;
  injuryRateReduction: number;
  scoutingBoost:       number;
  youngPlayerBoost:    number;  // Extra dev for U-25
  veteranBoost:        number;  // Performance boost for 30+
}

// ─── Coach name generation ──────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Mike', 'Dave', 'Bob', 'Joe', 'Tom', 'Steve', 'Bill', 'Jim', 'John', 'Ron',
  'Dan', 'Tony', 'Rick', 'Mark', 'Kevin', 'Greg', 'Pete', 'Pat', 'Tim', 'Chris',
  'Scott', 'Jeff', 'Brian', 'Gary', 'Craig', 'Ken', 'Ray', 'Don', 'Larry', 'Bruce',
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Martinez', 'Anderson', 'Thomas', 'Robinson', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott',
  'Baker', 'Nelson', 'Hill', 'Green', 'Adams', 'Mitchell', 'Roberts', 'Carter',
  'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Morris',
];

const SPECIALTIES: CoachSpecialty[] = [
  'developer', 'tactician', 'motivator', 'analytics_guru', 'veteran_handler',
  'youth_whisperer', 'pitching_savant', 'hitting_guru', 'defense_first',
  'bullpen_master', 'injury_preventer', 'comeback_specialist', 'clubhouse_leader',
  'sabermetrician',
];

const PERSONALITIES: Coach['personality'][] = ['calm', 'fiery', 'analytical', 'players_coach'];

let _nextCoachId = 10000;

// ─── Generate coaching candidates ───────────────────────────────────────────────

export function generateCoachCandidate(
  role: CoachRole,
  qualityRange: [number, number],
  rand: () => number,
): Coach {
  const quality = Math.round(qualityRange[0] + rand() * (qualityRange[1] - qualityRange[0]));
  const experience = Math.round(3 + rand() * 25);
  const age = Math.round(40 + rand() * 25);

  // Salary based on quality + role
  const roleMultiplier = role === 'manager' ? 2.5 : role === 'pitching_coach' || role === 'hitting_coach' ? 1.5 : 1.0;
  const salary = Math.round(((quality - 30) / 50 * 3_000_000 + 500_000) * roleMultiplier / 100_000) * 100_000;

  const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];

  return {
    coachId: _nextCoachId++,
    name: `${firstName} ${lastName}`,
    role,
    specialty: SPECIALTIES[Math.floor(rand() * SPECIALTIES.length)],
    quality,
    experience,
    salary,
    contractYears: Math.floor(1 + rand() * 3),
    age,
    personality: PERSONALITIES[Math.floor(rand() * PERSONALITIES.length)],
  };
}

export function generateCoachingPool(
  count: number,
  rand: () => number,
): Coach[] {
  const pool: Coach[] = [];
  const roles: CoachRole[] = ['manager', 'pitching_coach', 'hitting_coach', 'bench_coach', 'bullpen_coach', 'first_base', 'third_base'];

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(rand() * roles.length)];
    pool.push(generateCoachCandidate(role, [35, 75], rand));
  }

  return pool.sort((a, b) => b.quality - a.quality);
}

// ─── Generate initial coaching staff for a team ─────────────────────────────────

export function generateInitialStaff(rand: () => number): Coach[] {
  const coreRoles: CoachRole[] = ['manager', 'pitching_coach', 'hitting_coach', 'bench_coach', 'bullpen_coach'];
  return coreRoles.map(role => generateCoachCandidate(role, [40, 65], rand));
}

// ─── Compute coaching effects from staff ────────────────────────────────────────

export function computeCoachingEffects(coaches: Coach[]): CoachingEffect {
  let devMult = 1.0;
  let pitcherDevMult = 1.0;
  let hitterDevMult = 1.0;
  let chemistryBoost = 0;
  let injuryRateReduction = 0;
  let scoutingBoost = 0;
  let youngPlayerBoost = 0;
  let veteranBoost = 0;

  for (const coach of coaches) {
    // Base quality contribution (quality 50 = neutral, 70 = strong bonus, 30 = penalty)
    const qualityFactor = (coach.quality - 50) / 100; // -0.20 to +0.30

    // Role-specific base bonuses
    if (coach.role === 'manager') {
      devMult += qualityFactor * 0.15;
      chemistryBoost += qualityFactor * 0.10;
    } else if (coach.role === 'pitching_coach') {
      pitcherDevMult += qualityFactor * 0.25;
    } else if (coach.role === 'hitting_coach') {
      hitterDevMult += qualityFactor * 0.25;
    } else if (coach.role === 'bench_coach') {
      devMult += qualityFactor * 0.05;
    } else if (coach.role === 'bullpen_coach') {
      pitcherDevMult += qualityFactor * 0.10;
    }

    // Specialty bonuses (only if quality > 50)
    if (coach.quality >= 50) {
      const specBonus = (coach.quality - 40) / 200; // 0.05 - 0.20
      switch (coach.specialty) {
        case 'developer':          devMult += specBonus * 0.75; break;
        case 'youth_whisperer':    youngPlayerBoost += specBonus; break;
        case 'pitching_savant':    pitcherDevMult += specBonus; break;
        case 'hitting_guru':       hitterDevMult += specBonus; break;
        case 'motivator':          chemistryBoost += specBonus * 0.50; break;
        case 'clubhouse_leader':   chemistryBoost += specBonus * 0.75; break;
        case 'injury_preventer':   injuryRateReduction += specBonus * 0.75; break;
        case 'comeback_specialist': injuryRateReduction += specBonus * 0.50; break;
        case 'analytics_guru':     scoutingBoost += specBonus * 0.50; break;
        case 'sabermetrician':     scoutingBoost += specBonus * 0.40; break;
        case 'veteran_handler':    veteranBoost += specBonus * 0.50; break;
        case 'defense_first':      hitterDevMult += specBonus * 0.30; break;
        case 'bullpen_master':     pitcherDevMult += specBonus * 0.30; break;
        case 'tactician':          devMult += specBonus * 0.25; break;
      }
    }
  }

  return {
    devMultiplier: clamp(devMult, 0.8, 1.30),
    pitcherDevMultiplier: clamp(pitcherDevMult, 0.8, 1.40),
    hitterDevMultiplier: clamp(hitterDevMult, 0.8, 1.40),
    chemistryBoost: clamp(chemistryBoost, 0, 0.25),
    injuryRateReduction: clamp(injuryRateReduction, 0, 0.15),
    scoutingBoost: clamp(scoutingBoost, 0, 0.10),
    youngPlayerBoost: clamp(youngPlayerBoost, 0, 0.20),
    veteranBoost: clamp(veteranBoost, 0, 0.10),
  };
}

// ─── Get coaching staff summary for a team ──────────────────────────────────────

export function getCoachingStaffData(teamId: number, coaches: Coach[]): CoachingStaffData {
  const teamCoaches = coaches.filter(() => true); // All passed in should be team's
  const effects = computeCoachingEffects(teamCoaches);
  const totalSalary = teamCoaches.reduce((sum, c) => sum + c.salary, 0);

  return {
    teamId,
    coaches: teamCoaches,
    totalSalary,
    devBonus: effects.devMultiplier,
    pitcherDevBonus: effects.pitcherDevMultiplier,
    hitterDevBonus: effects.hitterDevMultiplier,
    chemistryBonus: effects.chemistryBoost,
    injuryReduction: effects.injuryRateReduction,
    scoutingBonus: effects.scoutingBoost,
  };
}

// ─── Advance coaching contracts ─────────────────────────────────────────────────

export function advanceCoachContracts(coaches: Coach[]): { remaining: Coach[]; expired: Coach[] } {
  const remaining: Coach[] = [];
  const expired: Coach[] = [];

  for (const c of coaches) {
    c.contractYears--;
    if (c.contractYears <= 0) {
      expired.push(c);
    } else {
      remaining.push(c);
    }
  }

  return { remaining, expired };
}

// ─── Specialty display labels ───────────────────────────────────────────────────

export const SPECIALTY_LABELS: Record<CoachSpecialty, string> = {
  developer: 'Player Developer',
  tactician: 'Tactician',
  motivator: 'Motivator',
  analytics_guru: 'Analytics Guru',
  veteran_handler: 'Veteran Handler',
  youth_whisperer: 'Youth Whisperer',
  pitching_savant: 'Pitching Savant',
  hitting_guru: 'Hitting Guru',
  defense_first: 'Defense First',
  bullpen_master: 'Bullpen Master',
  injury_preventer: 'Injury Preventer',
  comeback_specialist: 'Comeback Specialist',
  clubhouse_leader: 'Clubhouse Leader',
  sabermetrician: 'Sabermetrician',
};

export const ROLE_LABELS: Record<CoachRole, string> = {
  manager: 'Manager',
  pitching_coach: 'Pitching Coach',
  hitting_coach: 'Hitting Coach',
  bench_coach: 'Bench Coach',
  bullpen_coach: 'Bullpen Coach',
  first_base: '1B Coach',
  third_base: '3B Coach',
};

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }
