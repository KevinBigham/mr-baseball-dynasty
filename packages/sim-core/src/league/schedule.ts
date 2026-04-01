/**
 * @module schedule
 * Season schedule generator: 162-game season for 32 teams.
 * Generates a balanced schedule with more intra-division games.
 */

import type { GameRNG } from '../math/prng.js';
import type { Division } from './teams.js';
import { TEAMS, getTeamsByDivision, DIVISIONS } from './teams.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduledGame {
  readonly day: number;      // 1–162ish (calendar day of season)
  readonly homeTeamId: string;
  readonly awayTeamId: string;
}

// ---------------------------------------------------------------------------
// Schedule generator
// ---------------------------------------------------------------------------

/**
 * Generate a 162-game schedule for all 32 teams.
 *
 * Distribution approach:
 * - Each team plays ~76 division games (19 vs each of ~4 division opponents)
 * - Remaining ~86 games vs non-division opponents
 * - Games distributed across ~180 calendar days (rest days built in)
 *
 * Uses round-robin with home/away balancing.
 */
export function generateSchedule(rng: GameRNG): ScheduledGame[] {
  const games: ScheduledGame[] = [];

  // Build matchup list: each pair plays a number of games
  const matchups: Array<{ home: string; away: string }> = [];

  for (const div of DIVISIONS) {
    const divTeams = getTeamsByDivision(div);

    // Intra-division: each pair plays 19 games (alternating home/away)
    for (let i = 0; i < divTeams.length; i++) {
      for (let j = i + 1; j < divTeams.length; j++) {
        const teamA = divTeams[i]!;
        const teamB = divTeams[j]!;
        for (let g = 0; g < 19; g++) {
          if (g % 2 === 0) {
            matchups.push({ home: teamA.id, away: teamB.id });
          } else {
            matchups.push({ home: teamB.id, away: teamA.id });
          }
        }
      }
    }
  }

  // Inter-division: each team plays ~6 games vs every non-division team
  for (let i = 0; i < TEAMS.length; i++) {
    for (let j = i + 1; j < TEAMS.length; j++) {
      const teamA = TEAMS[i]!;
      const teamB = TEAMS[j]!;

      // Skip division opponents (already scheduled)
      if (teamA.division === teamB.division) continue;

      // Same league (AL vs AL or NL vs NL): 7 games each
      // Cross-league: 4 games each
      const sameLeague = teamA.division.startsWith('AL') === teamB.division.startsWith('AL');
      const gamesPerPair = sameLeague ? 7 : 4;

      for (let g = 0; g < gamesPerPair; g++) {
        if (g % 2 === 0) {
          matchups.push({ home: teamA.id, away: teamB.id });
        } else {
          matchups.push({ home: teamB.id, away: teamA.id });
        }
      }
    }
  }

  // Shuffle all matchups to create randomized schedule
  const shuffled = rng.shuffle(matchups);

  // Distribute games across calendar days (max 16 games per day for 32 teams)
  const MAX_GAMES_PER_DAY = 16;
  const teamGamesPerDay = new Map<string, Set<number>>();

  for (const teamDef of TEAMS) {
    teamGamesPerDay.set(teamDef.id, new Set());
  }

  let currentDay = 1;
  let gamesOnCurrentDay = 0;

  for (const matchup of shuffled) {
    const homeGames = teamGamesPerDay.get(matchup.home)!;
    const awayGames = teamGamesPerDay.get(matchup.away)!;

    // Find a day where neither team is already playing
    while (
      homeGames.has(currentDay) ||
      awayGames.has(currentDay) ||
      gamesOnCurrentDay >= MAX_GAMES_PER_DAY
    ) {
      currentDay++;
      gamesOnCurrentDay = 0;
    }

    games.push({
      day: currentDay,
      homeTeamId: matchup.home,
      awayTeamId: matchup.away,
    });

    homeGames.add(currentDay);
    awayGames.add(currentDay);
    gamesOnCurrentDay++;

    // Reset day tracking periodically to avoid infinite growth
    if (currentDay > 220) {
      // Wrap — shouldn't happen with proper distribution, but safety valve
      currentDay = 1;
    }
  }

  // Sort by day
  games.sort((a, b) => a.day - b.day);

  return games;
}

/** Get all games for a specific day. */
export function getGamesForDay(schedule: ScheduledGame[], day: number): ScheduledGame[] {
  return schedule.filter(g => g.day === day);
}

/** Get the total number of calendar days in the schedule. */
export function getSeasonLength(schedule: ScheduledGame[]): number {
  if (schedule.length === 0) return 0;
  return schedule[schedule.length - 1]!.day;
}

/** Check if two teams are in the same division. */
export function isDivisionGame(teamAId: string, teamBId: string): boolean {
  const teamA = TEAMS.find(t => t.id === teamAId);
  const teamB = TEAMS.find(t => t.id === teamBId);
  if (!teamA || !teamB) return false;
  return teamA.division === teamB.division;
}
