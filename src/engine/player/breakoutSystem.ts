/**
 * Breakout System — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's breakout-system.
 * Identifies young players on the cusp of a breakout season,
 * resolves whether they hit or bust, and generates narrative
 * milestones throughout the season.
 *
 * Breakout candidates: ages 21-26, OVR 50-65, POT >= OVR+8
 * 55% chance to hit breakout, gaining 8-14 OVR points.
 */

import type { Player } from '../../types/player';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreakoutCandidate {
  playerId:    number;
  name:        string;
  position:    string;
  teamId:      number;
  ovrAtStart:  number;
  potAtStart:  number;
  targetOvr:   number;
  hit:         boolean;
  bust:        boolean;
  resolved:    boolean;
  milestones:  string[];
}

export interface BreakoutMilestone {
  playerId: number;
  message:  string;
  type:     'progress' | 'stat' | 'resolved';
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

export function isBreakoutEligible(p: Player): boolean {
  return (
    p.age >= 21 &&
    p.age <= 26 &&
    p.overall >= 50 &&
    p.overall <= 65 &&
    p.potential >= p.overall + 8 &&
    p.rosterData.rosterStatus === 'MLB_ACTIVE'
  );
}

// ─── Pick breakout candidates from a roster ───────────────────────────────────

export function pickBreakoutCandidates(
  roster: Player[],
  rand: () => number,
): BreakoutCandidate[] {
  const eligible = roster
    .filter(isBreakoutEligible)
    .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall));

  const count = eligible.length >= 6 ? 3 : eligible.length >= 3 ? 2 : eligible.length >= 1 ? 1 : 0;

  const picked: BreakoutCandidate[] = [];
  for (const p of eligible) {
    if (picked.length >= count) break;
    if (rand() < 0.7) {
      const gain = Math.round(8 + rand() * 6); // 8-14 OVR gain
      picked.push({
        playerId: p.playerId,
        name: p.name,
        position: p.position,
        teamId: p.teamId,
        ovrAtStart: p.overall,
        potAtStart: p.potential,
        targetOvr: Math.min(p.potential, p.overall + gain),
        hit: false,
        bust: false,
        resolved: false,
        milestones: [],
      });
    }
  }

  return picked.slice(0, 3);
}

// ─── Resolve breakout at end of season ────────────────────────────────────────

export function resolveBreakout(
  candidate: BreakoutCandidate,
  currentOvr: number,
  rand: () => number,
): BreakoutCandidate {
  if (candidate.resolved) return candidate;

  const didHit = rand() < 0.55;

  return {
    ...candidate,
    resolved: true,
    hit: didHit,
    bust: !didHit,
    milestones: [
      ...candidate.milestones,
      didHit
        ? `${candidate.name} broke out! OVR jumped to ${candidate.targetOvr}.`
        : `${candidate.name} didn't make the leap this year.`,
    ],
  };
}

// ─── Mid-season milestone checks ──────────────────────────────────────────────

export function checkBreakoutMilestone(
  candidate: BreakoutCandidate,
  currentOvr: number,
  gamesPlayed: number,
  stats: { hr?: number; rbi?: number; sb?: number; h?: number; w?: number; k?: number; sv?: number },
  isPitcher: boolean,
): BreakoutMilestone | null {
  if (candidate.resolved) return null;

  const gained = currentOvr - candidate.ovrAtStart;

  // OVR gain milestone
  if (gained >= 3 && !candidate.milestones.some(m => m.includes('OVR'))) {
    candidate.milestones.push(`+${gained} OVR`);
    return {
      playerId: candidate.playerId,
      message: `${candidate.name} gained +${gained} OVR! Breakout looking REAL.`,
      type: 'progress',
    };
  }

  // Stat milestones at midseason (60-90 games)
  if (gamesPlayed >= 60 && gamesPlayed <= 90) {
    if (!isPitcher) {
      if ((stats.hr ?? 0) >= 18 && !candidate.milestones.includes('hr_pace')) {
        candidate.milestones.push('hr_pace');
        return {
          playerId: candidate.playerId,
          message: `${candidate.name} has ${stats.hr} HR at the midpoint — on pace for 30+!`,
          type: 'stat',
        };
      }
      if ((stats.sb ?? 0) >= 20 && !candidate.milestones.includes('sb_pace')) {
        candidate.milestones.push('sb_pace');
        return {
          playerId: candidate.playerId,
          message: `${candidate.name} already has ${stats.sb} stolen bases — elite speed emerging!`,
          type: 'stat',
        };
      }
      if ((stats.h ?? 0) >= 100 && !candidate.milestones.includes('hit_pace')) {
        candidate.milestones.push('hit_pace');
        return {
          playerId: candidate.playerId,
          message: `${candidate.name} with ${stats.h} hits — on pace for 200+!`,
          type: 'stat',
        };
      }
    } else {
      if ((stats.w ?? 0) >= 10 && !candidate.milestones.includes('win_pace')) {
        candidate.milestones.push('win_pace');
        return {
          playerId: candidate.playerId,
          message: `${candidate.name} already has ${stats.w} wins — ace in the making!`,
          type: 'stat',
        };
      }
      if ((stats.k ?? 0) >= 100 && !candidate.milestones.includes('k_pace')) {
        candidate.milestones.push('k_pace');
        return {
          playerId: candidate.playerId,
          message: `${candidate.name} with ${stats.k} strikeouts — dominant stuff!`,
          type: 'stat',
        };
      }
    }
  }

  return null;
}

// ─── Get breakout summary for display ─────────────────────────────────────────

export function getBreakoutSummary(candidates: BreakoutCandidate[]): {
  active: number;
  resolved: number;
  hits: number;
  busts: number;
} {
  return {
    active: candidates.filter(c => !c.resolved).length,
    resolved: candidates.filter(c => c.resolved).length,
    hits: candidates.filter(c => c.hit).length,
    busts: candidates.filter(c => c.bust).length,
  };
}
