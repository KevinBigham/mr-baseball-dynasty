import type { Rivalry } from '@mbd/contracts';
import type { StandingsEntry } from './standings.js';

function rivalryId(teamA: string, teamB: string): string {
  return [teamA, teamB].sort().join(':');
}

function clampIntensity(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function upsertRivalry(
  existing: Map<string, Rivalry>,
  teamA: string,
  teamB: string,
  intensityChange: number,
  reason: string,
): Map<string, Rivalry> {
  const id = rivalryId(teamA, teamB);
  const current = existing.get(id);
  const reasons = current ? [...current.reasons] : [];
  if (!reasons.includes(reason)) reasons.push(reason);

  existing.set(id, {
    id,
    teamA,
    teamB,
    intensity: clampIntensity((current?.intensity ?? 50) + intensityChange),
    summary: `${teamA.toUpperCase()} and ${teamB.toUpperCase()} are becoming central to each other's season.`,
    reasons,
  });

  return existing;
}

export function deriveRivalriesFromStandings(
  existing: Map<string, Rivalry>,
  standingsByDivision: Record<string, StandingsEntry[]>,
): Map<string, Rivalry> {
  const next = new Map(existing);

  for (const entries of Object.values(standingsByDivision)) {
    if (entries.length < 2) continue;
    const leader = entries[0]!;
    const challenger = entries[1]!;
    if (challenger.gamesBack <= 4) {
      upsertRivalry(next, leader.teamId, challenger.teamId, 6, 'Tight division race');
    }
  }

  return next;
}
