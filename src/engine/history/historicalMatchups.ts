/**
 * historicalMatchups.ts – Historical Matchups
 *
 * Head-to-head records between teams across seasons.
 * Tracks all-time win/loss records, season breakdowns,
 * dominant pitchers, and nemesis hitters for each matchup.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MatchupSeason {
  season: number;
  wins: number;
  losses: number;
  runDiff: number;
  homeRecord: string;
  awayRecord: string;
}

export interface TeamMatchupData {
  opponentId: number;
  opponentName: string;
  opponentAbbr: string;
  allTimeWins: number;
  allTimeLosses: number;
  seasons: MatchupSeason[];
  currentStreak: number;
  streakType: 'W' | 'L';
  dominantPitcher: string;
  nemesis: string;
}

export interface MatchupHistoryData {
  teamName: string;
  matchups: TeamMatchupData[];
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export function winPctColor(wins: number, losses: number): string {
  if (wins + losses === 0) return '#9ca3af';
  const pct = wins / (wins + losses);
  if (pct >= 0.600) return '#22c55e';
  if (pct >= 0.500) return '#4ade80';
  if (pct >= 0.450) return '#f59e0b';
  return '#ef4444';
}

export function streakColor(type: 'W' | 'L'): string {
  return type === 'W' ? '#22c55e' : '#ef4444';
}

export function runDiffColor(diff: number): string {
  if (diff > 0) return '#22c55e';
  if (diff < 0) return '#ef4444';
  return '#9ca3af';
}

export function formatRunDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff);
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoMatchupHistory(): MatchupHistoryData {
  const matchups: TeamMatchupData[] = [
    {
      opponentId: 1,
      opponentName: 'New York Metros',
      opponentAbbr: 'NYM',
      allTimeWins: 42,
      allTimeLosses: 34,
      seasons: [
        { season: 1, wins: 10, losses: 9, runDiff: 8, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 2, wins: 12, losses: 7, runDiff: 22, homeRecord: '7-2', awayRecord: '5-5' },
        { season: 3, wins: 11, losses: 8, runDiff: 14, homeRecord: '6-3', awayRecord: '5-5' },
        { season: 4, wins: 9, losses: 10, runDiff: -5, homeRecord: '5-4', awayRecord: '4-6' },
      ],
      currentStreak: 3,
      streakType: 'W',
      dominantPitcher: "James O'Brien",
      nemesis: 'Carlos Santana',
    },
    {
      opponentId: 2,
      opponentName: 'Chicago Windrunners',
      opponentAbbr: 'CHW',
      allTimeWins: 35,
      allTimeLosses: 41,
      seasons: [
        { season: 1, wins: 8, losses: 11, runDiff: -15, homeRecord: '5-4', awayRecord: '3-7' },
        { season: 2, wins: 9, losses: 10, runDiff: -6, homeRecord: '5-4', awayRecord: '4-6' },
        { season: 3, wins: 10, losses: 9, runDiff: 3, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 4, wins: 8, losses: 11, runDiff: -12, homeRecord: '4-5', awayRecord: '4-6' },
      ],
      currentStreak: 4,
      streakType: 'L',
      dominantPitcher: 'Ryan Parker',
      nemesis: 'Miguel Torres',
    },
    {
      opponentId: 3,
      opponentName: 'Los Angeles Suns',
      opponentAbbr: 'LAS',
      allTimeWins: 38,
      allTimeLosses: 38,
      seasons: [
        { season: 1, wins: 10, losses: 9, runDiff: 5, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 2, wins: 8, losses: 11, runDiff: -10, homeRecord: '4-5', awayRecord: '4-6' },
        { season: 3, wins: 11, losses: 8, runDiff: 12, homeRecord: '7-2', awayRecord: '4-6' },
        { season: 4, wins: 9, losses: 10, runDiff: -7, homeRecord: '5-4', awayRecord: '4-6' },
      ],
      currentStreak: 1,
      streakType: 'L',
      dominantPitcher: "James O'Brien",
      nemesis: 'Derek Yamamoto',
    },
    {
      opponentId: 4,
      opponentName: 'Houston Roughnecks',
      opponentAbbr: 'HOU',
      allTimeWins: 44,
      allTimeLosses: 32,
      seasons: [
        { season: 1, wins: 12, losses: 7, runDiff: 18, homeRecord: '7-2', awayRecord: '5-5' },
        { season: 2, wins: 11, losses: 8, runDiff: 15, homeRecord: '6-3', awayRecord: '5-5' },
        { season: 3, wins: 10, losses: 9, runDiff: 4, homeRecord: '5-4', awayRecord: '5-5' },
        { season: 4, wins: 11, losses: 8, runDiff: 9, homeRecord: '7-2', awayRecord: '4-6' },
      ],
      currentStreak: 5,
      streakType: 'W',
      dominantPitcher: 'Marcus Webb',
      nemesis: 'Tony Alvarez',
    },
    {
      opponentId: 5,
      opponentName: 'Boston Harbormen',
      opponentAbbr: 'BOS',
      allTimeWins: 30,
      allTimeLosses: 46,
      seasons: [
        { season: 1, wins: 7, losses: 12, runDiff: -22, homeRecord: '4-5', awayRecord: '3-7' },
        { season: 2, wins: 8, losses: 11, runDiff: -14, homeRecord: '5-4', awayRecord: '3-7' },
        { season: 3, wins: 7, losses: 12, runDiff: -18, homeRecord: '4-5', awayRecord: '3-7' },
        { season: 4, wins: 8, losses: 11, runDiff: -11, homeRecord: '5-4', awayRecord: '3-7' },
      ],
      currentStreak: 6,
      streakType: 'L',
      dominantPitcher: 'Ryan Parker',
      nemesis: 'Jake Crawford',
    },
    {
      opponentId: 6,
      opponentName: 'Atlanta Phoenixes',
      opponentAbbr: 'ATL',
      allTimeWins: 40,
      allTimeLosses: 36,
      seasons: [
        { season: 1, wins: 11, losses: 8, runDiff: 10, homeRecord: '6-3', awayRecord: '5-5' },
        { season: 2, wins: 10, losses: 9, runDiff: 5, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 3, wins: 9, losses: 10, runDiff: -3, homeRecord: '5-4', awayRecord: '4-6' },
        { season: 4, wins: 10, losses: 9, runDiff: 7, homeRecord: '6-3', awayRecord: '4-6' },
      ],
      currentStreak: 2,
      streakType: 'W',
      dominantPitcher: "James O'Brien",
      nemesis: 'Ronald Acuna III',
    },
    {
      opponentId: 7,
      opponentName: 'San Francisco Fog',
      opponentAbbr: 'SFF',
      allTimeWins: 39,
      allTimeLosses: 37,
      seasons: [
        { season: 1, wins: 9, losses: 10, runDiff: -4, homeRecord: '5-4', awayRecord: '4-6' },
        { season: 2, wins: 11, losses: 8, runDiff: 11, homeRecord: '7-2', awayRecord: '4-6' },
        { season: 3, wins: 10, losses: 9, runDiff: 6, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 4, wins: 9, losses: 10, runDiff: -3, homeRecord: '5-4', awayRecord: '4-6' },
      ],
      currentStreak: 2,
      streakType: 'L',
      dominantPitcher: 'Marcus Webb',
      nemesis: 'Tommy Nakamura',
    },
    {
      opponentId: 8,
      opponentName: 'Seattle Cascades',
      opponentAbbr: 'SEA',
      allTimeWins: 43,
      allTimeLosses: 33,
      seasons: [
        { season: 1, wins: 11, losses: 8, runDiff: 13, homeRecord: '7-2', awayRecord: '4-6' },
        { season: 2, wins: 12, losses: 7, runDiff: 20, homeRecord: '7-2', awayRecord: '5-5' },
        { season: 3, wins: 10, losses: 9, runDiff: 8, homeRecord: '6-3', awayRecord: '4-6' },
        { season: 4, wins: 10, losses: 9, runDiff: 5, homeRecord: '6-3', awayRecord: '4-6' },
      ],
      currentStreak: 3,
      streakType: 'W',
      dominantPitcher: "James O'Brien",
      nemesis: 'Cal Raleigh Jr.',
    },
  ];

  return {
    teamName: 'Portland Pioneers',
    matchups,
  };
}
