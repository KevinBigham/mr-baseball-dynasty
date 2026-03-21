/**
 * visionSystem.ts — Conflicting Scout Opinions
 *
 * Generates 2-3 different staff opinions on a prospect based on staff traits,
 * scouting accuracy, and player attributes. Creates uncertainty and engagement.
 *
 * Uses deterministic seeding (no Math.random) for reproducibility.
 */

import type { FOStaffMember } from '../types/frontOffice';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StaffOpinion {
  staffName: string;
  staffRole: string;
  icon: string;
  projectedCeiling: string;    // e.g., "Future All-Star", "Solid Regular", etc.
  projectedGrade: number;      // 20-80 scouting scale
  confidence: 'high' | 'medium' | 'low';
  quote: string;               // e.g., "His bat speed is elite, but..."
  color: string;               // accent color for display
}

// ─── Deterministic hash (no Math.random) ─────────────────────────────────

function simpleHash(seed: number): number {
  let h = seed | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return (h & 0x7fffffff) / 0x7fffffff;
}

// ─── Ceiling labels ──────────────────────────────────────────────────────

function ceilingLabel(grade: number): string {
  if (grade >= 70) return 'Future All-Star';
  if (grade >= 60) return 'Quality Starter';
  if (grade >= 55) return 'Solid Regular';
  if (grade >= 50) return 'Average MLB';
  if (grade >= 45) return 'Bench Piece';
  if (grade >= 40) return 'Fringe Major Leaguer';
  return 'Organizational Depth';
}

// ─── Quote generation ─────────────────────────────────────────────────────

const POSITIVE_HITTER_QUOTES = [
  'The bat speed jumps off the screen. This kid can hit.',
  'Rare raw power for his age. He could be a middle-of-the-order force.',
  'Elite hand-eye coordination. He barrels everything.',
  'His approach at the plate is mature beyond his years.',
  'The swing is smooth and repeatable. I love the mechanics.',
  'He uses the whole field. Not many prospects his age do that.',
];

const NEGATIVE_HITTER_QUOTES = [
  'The strikeout rate concerns me. Can he make enough contact?',
  'The power is there but the approach needs work.',
  'Defensive limitations could cap his ceiling.',
  'He struggles with breaking pitches. That\'s exploitable.',
  'I worry about the swing-and-miss against quality arms.',
  'The speed won\'t age well. What\'s the floor without it?',
];

const POSITIVE_PITCHER_QUOTES = [
  'The fastball has serious life. Hitters don\'t barrel it.',
  'His secondary arsenal is deep. Two plus pitches already.',
  'Rare feel for the zone at his age. Very advanced.',
  'The arm action is clean and loose. Lots of projection left.',
  'He competes on every pitch. Elite mound presence.',
  'The movement profile is special. Hard to square up.',
];

const NEGATIVE_PITCHER_QUOTES = [
  'Command is inconsistent. He\'ll walk himself out of games.',
  'I see durability concerns. Can he hold up over 200 innings?',
  'The secondary stuff isn\'t there yet. Fastball dependent.',
  'Mechanical red flags that could lead to injury.',
  'He nibbles too much. Needs to attack the zone.',
  'The ceiling might be a reliever, not a starter.',
];

const PERSONALITY_QUOTES = [
  'Great clubhouse kid. Team-first mentality every day.',
  'The work ethic is outstanding. First one in, last one out.',
  'He\'s got that competitive fire. Refuses to give in.',
  'Very coachable. Absorbs adjustments quickly.',
  'Mental toughness could be a factor under pressure.',
  'Quiet confidence. Doesn\'t get rattled.',
];

const ROLE_ICONS: Record<string, string> = {
  scout_dir: '🔍',
  analytics: '📊',
  manager: '🧢',
  pitching_coach: '⚾',
  hitting_coach: '🏏',
  gm: '📋',
  trainer: '🏥',
  intl_scout: '🌎',
};

const ROLE_LABELS: Record<string, string> = {
  scout_dir: 'Scout Director',
  analytics: 'Analytics Head',
  manager: 'Manager',
  pitching_coach: 'Pitching Coach',
  hitting_coach: 'Hitting Coach',
  gm: 'GM',
  trainer: 'Trainer',
  intl_scout: 'Intl Scout',
};

// ─── Main Generator ──────────────────────────────────────────────────────

/**
 * Generate 2-3 conflicting staff opinions on a prospect.
 * Better staff = more accurate. Cheap staff = wildly divergent.
 */
export function generateVisionOpinions(
  playerId: number,
  _playerOverall: number,
  playerPotential: number,
  isPitcher: boolean,
  _age: number,
  staff: FOStaffMember[],
  season: number,
): StaffOpinion[] {
  const opinions: StaffOpinion[] = [];
  const truePotGrade = Math.round(20 + (playerPotential / 550) * 60);

  // Pick 2-3 staff members to give opinions
  const evaluators = staff
    .filter(s => ['scout_dir', 'analytics', 'manager', 'pitching_coach', 'hitting_coach'].includes(s.roleId))
    .slice(0, 3);

  // If no staff, generate generic opinions
  if (evaluators.length === 0) {
    evaluators.push(
      { id: 'generic-scout', roleId: 'scout_dir', name: 'Area Scout', ovr: 50, salary: 0.5, yearsLeft: 1, traitId: 'talent_scout' } as FOStaffMember,
      { id: 'generic-analytics', roleId: 'analytics', name: 'Analytics Dept', ovr: 50, salary: 0.5, yearsLeft: 1, traitId: 'analytical' } as FOStaffMember,
    );
  }

  for (let i = 0; i < evaluators.length; i++) {
    const staff = evaluators[i];
    const seed = playerId * 31 + season * 17 + i * 7;

    // Staff accuracy: higher OVR = tighter opinion range
    const accuracy = staff.ovr / 100;  // 0.4 to 0.95
    const noise = (1 - accuracy) * 15;  // 0.75 to 9 grade points of noise
    const hashVal = simpleHash(seed);
    const offset = (hashVal - 0.5) * 2 * noise;

    const projectedGrade = Math.max(20, Math.min(80, Math.round(truePotGrade + offset)));
    const confidence = accuracy >= 0.75 ? 'high' : accuracy >= 0.55 ? 'medium' : 'low';

    // Pick quote based on whether opinion is positive or negative relative to true potential
    const isPositive = projectedGrade >= truePotGrade;
    const quotePool = staff.roleId === 'manager'
      ? PERSONALITY_QUOTES
      : isPitcher
        ? (isPositive ? POSITIVE_PITCHER_QUOTES : NEGATIVE_PITCHER_QUOTES)
        : (isPositive ? POSITIVE_HITTER_QUOTES : NEGATIVE_HITTER_QUOTES);

    const quoteIdx = Math.abs(seed) % quotePool.length;
    const quote = quotePool[quoteIdx];

    // Color based on opinion sentiment
    const color = projectedGrade >= 60 ? '#4ade80'
      : projectedGrade >= 50 ? '#60a5fa'
      : projectedGrade >= 40 ? '#f97316'
      : '#ef4444';

    opinions.push({
      staffName: staff.name,
      staffRole: ROLE_LABELS[staff.roleId] ?? staff.roleId,
      icon: ROLE_ICONS[staff.roleId] ?? '👤',
      projectedCeiling: ceilingLabel(projectedGrade),
      projectedGrade,
      confidence,
      quote,
      color,
    });
  }

  return opinions;
}
