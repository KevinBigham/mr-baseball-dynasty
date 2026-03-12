/**
 * teamChemistry.ts — Team Chemistry Engine (v1)
 *
 * Advances team chemistry state between seasons using the chemistry aggregation
 * system (Slice 1A+1B). Deterministic: same inputs → same outputs.
 *
 * Chemistry effects:
 *   - Cohesion (0–100): driven by roster archetype balance (leaders vs disruptors)
 *   - Morale (0–100): driven by win/loss record + previous morale inertia
 *   - Clubhouse events: notable chemistry-driven happenings
 *
 * Design rules:
 *   - No ambient randomness — uses only the passed-in PRNG
 *   - Additive to existing systems — reads player data, never mutates it
 *   - Bounded effects — cohesion/morale stay in [0, 100]
 */

import type { Player } from '../../types/player';
import type { TeamSeason } from '../../types/team';
import type { OwnerProfile } from '../../types/owner';
import type { TeamChemistryState, ClubhouseEvent } from '../../types/chemistry';
import type { RandomGenerator } from '../math/prng';
import { nextFloat } from '../math/prng';
import { buildChemistrySnapshot, type TeamChemistrySnapshot } from '../chemistryAggregate';

// ─── Tuning constants ────────────────────────────────────────────────────────

/** How much previous cohesion carries forward (0–1) */
const COHESION_INERTIA = 0.6;
/** How much previous morale carries forward (0–1) */
const MORALE_INERTIA = 0.5;

/** Cohesion bonus per veteran leader on roster */
const LEADER_COHESION_BONUS = 4;
/** Cohesion penalty per clubhouse disruptor on roster */
const DISRUPTOR_COHESION_PENALTY = 6;
/** Base cohesion for a roster with no strong signals */
const BASE_COHESION = 50;

/** Morale bonus for winning seasons (scaled by win%) */
const WIN_MORALE_SCALE = 40;
/** Morale penalty for losing seasons (scaled by loss%) */
const LOSS_MORALE_SCALE = 30;
/** Base morale target before win/loss adjustment */
const BASE_MORALE = 45;

/** Probability of a clubhouse event being generated per team per advance */
const EVENT_PROBABILITY = 0.35;

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ChemistryAdvanceInput {
  season: number;
  players: Player[];
  teamSeasons: Map<number, TeamSeason>;
  ownerProfiles: Map<number, OwnerProfile>;
  previousChemistry: Map<number, TeamChemistryState>;
  gen: RandomGenerator;
  nextEventId: number;
  /** Per-team morale bonus from coaching staff quality (0–5) */
  coachingMoraleBonuses?: Map<number, number>;
}

export interface ChemistryAdvanceResult {
  chemistry: Map<number, TeamChemistryState>;
  events: ClubhouseEvent[];
  gen: RandomGenerator;
}

// ─── Cohesion calculation ────────────────────────────────────────────────────

function computeTargetCohesion(snapshot: TeamChemistrySnapshot): number {
  const { flags, archetypeCounts } = snapshot;

  let target = BASE_COHESION;

  // Leadership bonus: each veteran leader anchors the clubhouse
  target += flags.leaderCount * LEADER_COHESION_BONUS;

  // Disruption penalty: clubhouse disruptors erode cohesion
  target -= flags.disruptorCount * DISRUPTOR_COHESION_PENALTY;

  // Roster balance bonus: diverse archetypes = healthier clubhouse
  const typesPresent = Object.values(archetypeCounts.counts).filter(c => c > 0).length;
  target += typesPresent * 1.5;

  // Concentration penalty: if >50% of roster is one archetype, monoculture
  if (archetypeCounts.percentages[archetypeCounts.dominant] > 0.5) {
    target -= 5;
  }

  return Math.max(0, Math.min(100, target));
}

// ─── Morale calculation ──────────────────────────────────────────────────────

function computeTargetMorale(teamSeason: TeamSeason | undefined): number {
  if (!teamSeason) return BASE_MORALE;

  const totalGames = teamSeason.wins + teamSeason.losses;
  if (totalGames === 0) return BASE_MORALE;

  const winPct = teamSeason.wins / totalGames;

  // Scale morale around .500: above .500 → bonus, below → penalty
  let target = BASE_MORALE;
  if (winPct >= 0.5) {
    target += (winPct - 0.5) * 2 * WIN_MORALE_SCALE;
  } else {
    target -= (0.5 - winPct) * 2 * LOSS_MORALE_SCALE;
  }

  // Division winners get a bonus
  if (teamSeason.divisionRank === 1) target += 8;

  // Playoff teams get a smaller bonus
  if (teamSeason.playoffResult) target += 4;

  return Math.max(0, Math.min(100, target));
}

// ─── Blended advance ────────────────────────────────────────────────────────

function blendWithInertia(previous: number, target: number, inertia: number): number {
  return Math.round(previous * inertia + target * (1 - inertia));
}

// ─── Clubhouse event generation ──────────────────────────────────────────────

interface EventCandidate {
  kind: string;
  description: string;
  weight: number;
}

function generateEventCandidates(
  snapshot: TeamChemistrySnapshot,
  newCohesion: number,
  newMorale: number,
  prevState: TeamChemistryState,
): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Leadership emergence
  if (snapshot.flags.leaderCount >= 2 && prevState.cohesion < 55 && newCohesion >= 55) {
    candidates.push({
      kind: 'leadership_emergence',
      description: 'Veteran leaders have rallied the clubhouse. Team cohesion is rising.',
      weight: 3,
    });
  }

  // Disruptor friction
  if (snapshot.flags.hasDisruption && newCohesion < prevState.cohesion) {
    candidates.push({
      kind: 'clubhouse_friction',
      description: 'A clubhouse disruptor has been causing tension in the locker room.',
      weight: 2,
    });
  }

  // Morale surge (big improvement)
  if (newMorale - prevState.morale >= 15) {
    candidates.push({
      kind: 'morale_surge',
      description: 'Winning has the clubhouse buzzing. Players are confident heading into next season.',
      weight: 2,
    });
  }

  // Morale collapse (big drop)
  if (prevState.morale - newMorale >= 15) {
    candidates.push({
      kind: 'morale_collapse',
      description: 'A tough season has taken its toll. The clubhouse mood is somber.',
      weight: 2,
    });
  }

  // High cohesion milestone
  if (newCohesion >= 75 && prevState.cohesion < 75) {
    candidates.push({
      kind: 'strong_clubhouse',
      description: 'This is one of the tightest clubhouses in the league. Players genuinely enjoy coming to work.',
      weight: 1,
    });
  }

  // Low cohesion warning
  if (newCohesion <= 30 && prevState.cohesion > 30) {
    candidates.push({
      kind: 'clubhouse_crisis',
      description: 'Sources say the clubhouse is fractured. Multiple cliques have formed.',
      weight: 1,
    });
  }

  return candidates;
}

// ─── Core advance function ───────────────────────────────────────────────────

export function advanceTeamChemistry(input: ChemistryAdvanceInput): ChemistryAdvanceResult {
  const { season, players, teamSeasons, previousChemistry, gen: inputGen, coachingMoraleBonuses } = input;
  let gen = inputGen;
  let eventId = input.nextEventId;

  const newChemistry = new Map<number, TeamChemistryState>();
  const events: ClubhouseEvent[] = [];

  // Get unique team IDs from players
  const teamIds = new Set<number>();
  for (const p of players) {
    if (p.teamId >= 1) teamIds.add(p.teamId);
  }

  for (const teamId of teamIds) {
    const roster = players.filter(p => p.teamId === teamId && p.rosterData.rosterStatus !== 'RETIRED');
    const mlbRoster = roster.filter(p =>
      p.rosterData.rosterStatus === 'MLB_ACTIVE' ||
      p.rosterData.rosterStatus === 'MLB_IL_10' ||
      p.rosterData.rosterStatus === 'MLB_IL_60'
    );

    // Build chemistry snapshot from MLB roster (fall back to full roster if empty)
    const snapshot = buildChemistrySnapshot(teamId, season, mlbRoster.length > 0 ? mlbRoster : roster);

    // Get previous state (default: 50/50)
    const prev = previousChemistry.get(teamId) ?? { teamId, cohesion: 50, morale: 50, lastUpdatedSeason: season - 1 };

    // Compute targets
    const targetCohesion = computeTargetCohesion(snapshot);
    const coachingBonus = coachingMoraleBonuses?.get(teamId) ?? 0;
    const targetMorale = computeTargetMorale(teamSeasons.get(teamId)) + coachingBonus;

    // Blend with inertia (previous season carries weight)
    const newCohesion = Math.max(0, Math.min(100, blendWithInertia(prev.cohesion, targetCohesion, COHESION_INERTIA)));
    const newMorale = Math.max(0, Math.min(100, blendWithInertia(prev.morale, targetMorale, MORALE_INERTIA)));

    newChemistry.set(teamId, {
      teamId,
      cohesion: newCohesion,
      morale: newMorale,
      lastUpdatedSeason: season,
    });

    // Generate clubhouse events (deterministic via PRNG)
    let roll: number;
    [roll, gen] = nextFloat(gen);

    if (roll < EVENT_PROBABILITY) {
      const candidates = generateEventCandidates(snapshot, newCohesion, newMorale, prev);
      if (candidates.length > 0) {
        const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
        let pick: number;
        [pick, gen] = nextFloat(gen);
        pick *= totalWeight;

        let chosen = candidates[0];
        for (const c of candidates) {
          pick -= c.weight;
          if (pick <= 0) { chosen = c; break; }
        }

        events.push({
          eventId: eventId++,
          teamId,
          season,
          kind: chosen.kind,
          description: chosen.description,
        });
      }
    }
  }

  return { chemistry: newChemistry, events, gen };
}

// ─── Initialization ──────────────────────────────────────────────────────────

export function initializeTeamChemistry(
  teamIds: number[],
  _season: number,
): Map<number, TeamChemistryState> {
  const map = new Map<number, TeamChemistryState>();
  for (const teamId of teamIds) {
    map.set(teamId, {
      teamId,
      cohesion: 50,
      morale: 50,
      lastUpdatedSeason: _season,
    });
  }
  return map;
}
