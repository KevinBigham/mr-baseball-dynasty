/**
 * staffPoaching.ts — FO Staff Poaching Events
 *
 * After strong seasons (85+ wins), rival teams come calling for your staff.
 * The player can let them go (impacts morale) or block the move (owner patience cost).
 */

import type { FOStaffMember } from '../types/frontOffice';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffPoachEvent {
  id:          string;
  staffMember: FOStaffMember;
  suitingTeam: string;
  offerTitle:  string;   // Elevated role title being offered
  offerYears:  number;
  resolved:    boolean;
  decision:    'let_go' | 'block' | null;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

const RIVAL_TEAMS = [
  'New Harbor Admirals',     'Harbor Bay Dodgers',      'Crown City Monarchs',
  'Steel City Steamers',     'Bay City Giants',         'South City Crushers',
  'Bayou City Astros',       'Gateway City Redbirds',   'Brick City Patriots',
  'Anaheim Hills Angels',    'New Harbor Metros',       'Peach City Brawlers',
  'Lake City Cubs',          'Desert City Rattlers',
];

// Maps current role title → elevated offer title
const ELEVATED_TITLES: Record<string, string> = {
  'General Manager':          'President of Baseball Operations',
  'Manager':                  'General Manager',
  'Pitching Coach':           'Pitching Coordinator',
  'Hitting Coach':            'Offensive Development Director',
  'Bench Coach':              'Manager',
  'Director of Analytics':   'VP of Baseball Strategy',
  'Scouting Director':        'Director of Player Development',
  'International Scout':      'International Scouting Director',
  'Trainer':                  'Director of Sports Science',
};

function getElevatedTitle(currentTitle: string): string {
  return ELEVATED_TITLES[currentTitle] ?? `Senior ${currentTitle}`;
}

// ─── Logic ────────────────────────────────────────────────────────────────────

/**
 * Determines if a poaching event should trigger this offseason.
 * Higher win totals = higher probability.
 * Uses deterministic roll based on season + wins to keep it seedable.
 */
export function shouldTriggerPoach(
  userWins:   number,
  staffCount: number,
  season:     number,
): boolean {
  if (userWins < 85)   return false;
  if (staffCount === 0) return false;

  // Probability: 30% at 85w, 50% at 90w, 70% at 95w+
  const threshold = userWins >= 95 ? 0.70 : userWins >= 90 ? 0.50 : 0.30;

  // Deterministic roll — no Math.random() in engine functions
  const roll = ((season * 7919 + userWins * 37 + staffCount * 13) % 100) / 100;
  return roll < threshold;
}

/**
 * Generate a poaching event for a random FO staff member.
 * Targets higher-salary staff members (they look more attractive to rivals).
 */
export function generatePoachEvent(
  staff:  FOStaffMember[],
  season: number,
): StaffPoachEvent | null {
  if (staff.length === 0) return null;

  // Prefer higher-salary targets (they're the attractive hires)
  const sorted = [...staff].sort((a, b) => b.salary - a.salary);
  // Pick from top-3 most valuable staff members
  const idx    = (season * 13 + 7) % Math.min(sorted.length, 3);
  const target = sorted[idx];

  const teamIdx     = (season * 37 + target.id.charCodeAt(0) + target.id.charCodeAt(1)) % RIVAL_TEAMS.length;
  const suitingTeam = RIVAL_TEAMS[teamIdx];
  const offerTitle  = getElevatedTitle(target.title);
  const offerYears  = 3 + (season % 2);  // 3 or 4 years

  return {
    id:          `poach-${season}-${target.id}`,
    staffMember: target,
    suitingTeam,
    offerTitle,
    offerYears,
    resolved:    false,
    decision:    null,
  };
}
