/**
 * streaks.ts — Streak & Momentum Detection
 *
 * Calculates team win/loss streaks and player hot/cold status.
 * Pure functions — no side effects, no state mutation.
 * Streak data is visual-only (does not affect simulation determinism).
 */

// ─── Team Streaks ──────────────────────────────────────────────────────────

export interface TeamStreak {
  teamId: number;
  type: 'win' | 'loss';
  length: number;
  /** Intensity level: 0 = none, 1 = 3-4, 2 = 5-7, 3 = 8-9, 4 = 10+ */
  intensity: number;
}

/**
 * Calculate team streaks from recent game results.
 * @param results Array of { teamId, won } for recent games, newest first
 */
export function calculateTeamStreak(
  results: Array<{ teamId: number; won: boolean }>,
  teamId: number,
): TeamStreak {
  const teamResults = results.filter(r => r.teamId === teamId);
  if (teamResults.length === 0) {
    return { teamId, type: 'win', length: 0, intensity: 0 };
  }

  const firstResult = teamResults[0].won;
  let streak = 0;
  for (const r of teamResults) {
    if (r.won === firstResult) streak++;
    else break;
  }

  const type = firstResult ? 'win' : 'loss';
  const intensity = streak >= 10 ? 4 : streak >= 8 ? 3 : streak >= 5 ? 2 : streak >= 3 ? 1 : 0;

  return { teamId, type, length: streak, intensity };
}

/**
 * Calculate streaks for all teams from standings data.
 * Uses win totals from consecutive checks to infer streaks.
 */
export function inferTeamStreaks(
  standings: Array<{ teamId: number; wins: number; losses: number }>,
  previousStandings: Array<{ teamId: number; wins: number; losses: number }> | null,
): TeamStreak[] {
  if (!previousStandings) return [];

  return standings.map(team => {
    const prev = previousStandings.find(p => p.teamId === team.teamId);
    if (!prev) return { teamId: team.teamId, type: 'win' as const, length: 0, intensity: 0 };

    const gamesPlayed = (team.wins + team.losses) - (prev.wins + prev.losses);
    const winsGained = team.wins - prev.wins;
    const lossesGained = team.losses - prev.losses;

    // Simple streak estimation: if all recent games were wins or losses
    if (gamesPlayed > 0 && winsGained === gamesPlayed) {
      const len = Math.min(winsGained, 10);
      return {
        teamId: team.teamId,
        type: 'win' as const,
        length: len,
        intensity: len >= 10 ? 4 : len >= 8 ? 3 : len >= 5 ? 2 : len >= 3 ? 1 : 0,
      };
    }
    if (gamesPlayed > 0 && lossesGained === gamesPlayed) {
      const len = Math.min(lossesGained, 10);
      return {
        teamId: team.teamId,
        type: 'loss' as const,
        length: len,
        intensity: len >= 10 ? 4 : len >= 8 ? 3 : len >= 5 ? 2 : len >= 3 ? 1 : 0,
      };
    }

    return { teamId: team.teamId, type: 'win' as const, length: 0, intensity: 0 };
  });
}

// ─── Player Streaks ────────────────────────────────────────────────────────

export type PlayerStreakType = 'hot' | 'cold' | 'none';

export interface PlayerStreak {
  playerId: number;
  type: PlayerStreakType;
  /** Description for tooltip */
  label: string;
}

/**
 * Determine if a player is hot/cold based on recent batting stats.
 * Uses a simple heuristic: batting average over recent games.
 */
export function getPlayerStreak(
  recentAB: number,
  recentHits: number,
  recentHR: number,
  seasonAvg: number,
): PlayerStreakType {
  if (recentAB < 10) return 'none';

  const recentAvg = recentHits / recentAB;

  // Hot: recent avg 100+ points above season avg, or HR binge
  if (recentAvg >= seasonAvg + 0.100 || (recentHR >= 3 && recentAB <= 30)) return 'hot';

  // Cold: recent avg 80+ points below season avg or < .150
  if (recentAvg <= seasonAvg - 0.080 || recentAvg < 0.150) return 'cold';

  return 'none';
}

/**
 * Get pitcher streak based on recent ERA vs season ERA.
 */
export function getPitcherStreak(
  recentIP: number,
  recentER: number,
  seasonERA: number,
): PlayerStreakType {
  if (recentIP < 5) return 'none';

  const recentERA = (recentER / recentIP) * 9;

  // Hot: recent ERA 1.5+ below season average
  if (recentERA <= seasonERA - 1.5) return 'hot';

  // Cold: recent ERA 2.0+ above season average
  if (recentERA >= seasonERA + 2.0) return 'cold';

  return 'none';
}
