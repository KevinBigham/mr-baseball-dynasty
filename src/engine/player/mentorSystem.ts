/**
 * Mentor System
 *
 * Veterans can mentor rookies/young players in the same position group.
 * Mentorship provides OVR development bonuses based on the gap between
 * mentor and mentee, plus narrative hooks for the story arc engine.
 *
 * Ported from football dynasty mentor-system.js, adapted for baseball
 * position groups.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface MentorPair {
  mentorId: number;
  mentorName: string;
  mentorPosition: string;
  mentorOvr: number;
  mentorAge: number;
  menteeId: number;
  menteeName: string;
  menteePosition: string;
  menteeOvr: number;
  menteeAge: number;
  season: number;
  weeksActive: number;
  bonusAccrued: number;
  status: 'active' | 'graduated' | 'broken';
}

export interface MentorBonusResult {
  pairId: string;
  mentorName: string;
  menteeName: string;
  weeklyBonus: number;
  totalBonus: number;
  narrative: string;
}

// ── Position groups (baseball) ──────────────────────────────────────────────

export const POSITION_GROUPS: Record<string, string[]> = {
  'Infield':  ['C', '1B', '2B', '3B', 'SS'],
  'Outfield': ['LF', 'CF', 'RF'],
  'Starting': ['SP'],
  'Relief':   ['RP', 'CL'],
  'Utility':  ['DH'],
};

export function getPositionGroup(pos: string): string {
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(pos)) return group;
  }
  return 'Unknown';
}

export function samePositionGroup(pos1: string, pos2: string): boolean {
  return getPositionGroup(pos1) === getPositionGroup(pos2);
}

// ── Mentor eligibility ──────────────────────────────────────────────────────

export interface PlayerForMentor {
  id: number;
  name: string;
  position: string;
  overall: number;
  age: number;
  experience: number; // seasons in MLB
  personality?: string;
}

const MENTOR_MIN_AGE = 30;
const MENTOR_MIN_OVR = 60;
const MENTOR_MIN_EXP = 6;
const MENTEE_MAX_AGE = 25;
const MENTEE_MAX_EXP = 3;

export function isMentorEligible(p: PlayerForMentor): boolean {
  return p.age >= MENTOR_MIN_AGE && p.overall >= MENTOR_MIN_OVR && p.experience >= MENTOR_MIN_EXP;
}

export function isMenteeEligible(p: PlayerForMentor): boolean {
  return p.age <= MENTEE_MAX_AGE && p.experience <= MENTEE_MAX_EXP;
}

// ── Pair formation ──────────────────────────────────────────────────────────

export function findMentorPairs(
  roster: PlayerForMentor[],
  existingPairs: MentorPair[],
  season: number,
): MentorPair[] {
  const mentors = roster.filter(isMentorEligible);
  const mentees = roster.filter(isMenteeEligible);

  // Don't re-pair already paired players
  const pairedMentorIds = new Set(existingPairs.filter(p => p.status === 'active').map(p => p.mentorId));
  const pairedMenteeIds = new Set(existingPairs.filter(p => p.status === 'active').map(p => p.menteeId));

  const newPairs: MentorPair[] = [];

  for (const mentee of mentees) {
    if (pairedMenteeIds.has(mentee.id)) continue;

    // Find best available mentor in same position group
    const candidates = mentors
      .filter(m => !pairedMentorIds.has(m.id) && samePositionGroup(m.position, mentee.position))
      .sort((a, b) => b.overall - a.overall);

    if (candidates.length === 0) continue;

    const mentor = candidates[0];
    pairedMentorIds.add(mentor.id);
    pairedMenteeIds.add(mentee.id);

    newPairs.push({
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorPosition: mentor.position,
      mentorOvr: mentor.overall,
      mentorAge: mentor.age,
      menteeId: mentee.id,
      menteeName: mentee.name,
      menteePosition: mentee.position,
      menteeOvr: mentee.overall,
      menteeAge: mentee.age,
      season,
      weeksActive: 0,
      bonusAccrued: 0,
      status: 'active',
    });
  }

  return newPairs;
}

// ── Weekly bonus calculation ────────────────────────────────────────────────

const BASE_BONUS = 0.5;       // base weekly OVR points
const OVR_GAP_SCALE = 0.1;    // bonus per OVR gap point
const MAX_WEEKLY_BONUS = 2.5;  // cap per week
const GRADUATION_WEEKS = 20;   // mentee "graduates" after 20 weeks

export function calcWeeklyBonus(pair: MentorPair): MentorBonusResult {
  const gap = Math.max(0, pair.mentorOvr - pair.menteeOvr);
  const rawBonus = BASE_BONUS + gap * OVR_GAP_SCALE;
  const weeklyBonus = Math.min(MAX_WEEKLY_BONUS, rawBonus);

  const narratives = [
    `${pair.mentorName} spent extra time with ${pair.menteeName} before batting practice.`,
    `${pair.menteeName} is picking up veteran habits from ${pair.mentorName}.`,
    `${pair.mentorName} shared insight on reading pitchers with ${pair.menteeName}.`,
    `The ${pair.mentorName}–${pair.menteeName} pairing is paying dividends in the clubhouse.`,
    `${pair.menteeName} credits ${pair.mentorName} for his recent improvement.`,
    `${pair.mentorName} and ${pair.menteeName} were seen reviewing film together.`,
  ];

  return {
    pairId: `${pair.mentorId}-${pair.menteeId}`,
    mentorName: pair.mentorName,
    menteeName: pair.menteeName,
    weeklyBonus,
    totalBonus: pair.bonusAccrued + weeklyBonus,
    narrative: narratives[pair.weeksActive % narratives.length],
  };
}

export function tickMentorPair(pair: MentorPair): MentorPair {
  if (pair.status !== 'active') return pair;

  const bonus = calcWeeklyBonus(pair);
  const updated = {
    ...pair,
    weeksActive: pair.weeksActive + 1,
    bonusAccrued: bonus.totalBonus,
  };

  if (updated.weeksActive >= GRADUATION_WEEKS) {
    updated.status = 'graduated';
  }

  return updated;
}

// ── Summary helpers ─────────────────────────────────────────────────────────

export function getMentorSummary(pairs: MentorPair[]) {
  const active = pairs.filter(p => p.status === 'active');
  const graduated = pairs.filter(p => p.status === 'graduated');
  const totalBonus = pairs.reduce((s, p) => s + p.bonusAccrued, 0);

  return {
    totalPairs: pairs.length,
    active: active.length,
    graduated: graduated.length,
    broken: pairs.filter(p => p.status === 'broken').length,
    totalBonusAccrued: Math.round(totalBonus * 10) / 10,
    avgBonus: active.length > 0
      ? Math.round((active.reduce((s, p) => s + p.bonusAccrued, 0) / active.length) * 10) / 10
      : 0,
  };
}

export const MENTOR_DISPLAY = {
  active:    { color: '#22c55e', label: 'ACTIVE',    icon: '🤝' },
  graduated: { color: '#3b82f6', label: 'GRADUATED', icon: '🎓' },
  broken:    { color: '#ef4444', label: 'BROKEN',    icon: '💔' },
} as const;
